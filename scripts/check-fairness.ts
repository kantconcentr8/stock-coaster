import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TUNING } from '../src/config/tuning';
import type { CourseDef, InputState, RailIndex } from '../src/core/types';
import { createSim } from '../src/sim/simulation';
import { assertCourseLength, buildTrack } from '../src/sim/track';

export interface FairnessCheckResult {
  passed: boolean;
  checks: { name: string; passed: boolean; detail: string }[];
}

interface HazardCluster {
  s: number;
  blockedRails: Set<RailIndex>;
}

function buildHazardClusters(course: CourseDef): HazardCluster[] {
  const hazards = course.objects.filter((o) => o.kind === 'hazard').sort((a, b) => a.s - b.s);
  const clusters: HazardCluster[] = [];
  const mergeWindow = TUNING.hitHalfWidth * 2;

  for (const h of hazards) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(h.s - last.s) <= mergeWindow) {
      last.blockedRails.add(h.rail);
    } else {
      clusters.push({ s: h.s, blockedRails: new Set([h.rail]) });
    }
  }
  return clusters;
}

/**
 * Evaluates a course against PRD §9.2, §9.3, §9.4, §17 Fairness criteria:
 * a. Safe rail exists at every s (no cluster blocks all 3 rails).
 * b. Reachability: DP over hazard clusters from starting rail (1) using single-rail steps.
 *    Outside brake zones, transitions must be reachable at vMaxBoost; inside a tagged brakeZone,
 *    transitions must be reachable when braking (vCruise).
 * c. Preview spacing: successive required lane-change decisions outside brake zones are spaced
 *    by at least vMaxBoost * previewSeconds.
 * d. Course length passes assertCourseLength.
 * e. Braking moment: at least one brakeZone segment where braking + steering through the zone
 *    collides with fewer hazards than boosting + steering through the zone.
 */
export function evaluateCourseFairness(course: CourseDef): FairnessCheckResult {
  const checks: { name: string; passed: boolean; detail: string }[] = [];
  const track = buildTrack(course);

  // d. Length check
  try {
    assertCourseLength(track);
    checks.push({
      name: 'length',
      passed: true,
      detail: `${Math.round(track.length)} wu >= required`,
    });
  } catch (err) {
    checks.push({
      name: 'length',
      passed: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  const clusters = buildHazardClusters(course);
  const inBrakeZone = (s: number): boolean =>
    Boolean(course.segments?.some((seg) => seg.brakeZone && s >= seg.s0 && s <= seg.s1));

  // a. Safe rail exists at every cluster
  const fullBlocked = clusters.find((c) => c.blockedRails.size >= 3);
  if (fullBlocked) {
    checks.push({
      name: 'safe-rail',
      passed: false,
      detail: `All 3 rails blocked at s=${fullBlocked.s}`,
    });
  } else {
    checks.push({
      name: 'safe-rail',
      passed: true,
      detail: `All ${clusters.length} hazard clusters leave >= 1 open rail`,
    });
  }

  // b. Reachability DP + c. Preview spacing between required decisions
  const stepTime = TUNING.laneChangeSeconds + TUNING.reactionSeconds;
  let reachable = new Set<RailIndex>([1]);
  let prevS = 0;
  let reachFailedAt: number | null = null;
  let previewFailedAt: { s0: number; s1: number; ds: number } | null = null;
  let lastDecisionS: number | null = null;
  const requiredPreviewWu = TUNING.vMaxBoost * TUNING.previewSeconds;

  for (const cluster of clusters) {
    const ds = cluster.s - prevS;
    const refSpeed = inBrakeZone(cluster.s) ? TUNING.vMin : TUNING.vMaxBoost;
    const availTime = ds / refSpeed;
    const effStepTime = inBrakeZone(cluster.s) ? TUNING.laneChangeSeconds : stepTime;
    const maxRailDelta = Math.floor(availTime / effStepTime);

    // Did this cluster force all previously reachable rails to move?
    const staysSafe = [...reachable].some((r) => !cluster.blockedRails.has(r));
    if (!staysSafe && !inBrakeZone(cluster.s)) {
      if (lastDecisionS !== null && cluster.s - lastDecisionS < requiredPreviewWu) {
        previewFailedAt = {
          s0: lastDecisionS,
          s1: cluster.s,
          ds: cluster.s - lastDecisionS,
        };
      }
      lastDecisionS = cluster.s;
    }

    const nextReachable = new Set<RailIndex>();
    for (const r of [0, 1, 2] as RailIndex[]) {
      if (cluster.blockedRails.has(r)) continue;
      for (const prevR of reachable) {
        if (Math.abs(r - prevR) <= maxRailDelta) {
          nextReachable.add(r);
          break;
        }
      }
    }

    if (nextReachable.size === 0) {
      reachFailedAt = cluster.s;
      break;
    }
    reachable = nextReachable;
    prevS = cluster.s;
  }

  checks.push({
    name: 'reachability',
    passed: reachFailedAt === null,
    detail:
      reachFailedAt === null
        ? 'Safe path reachable from start rail across all clusters'
        : `Unreachable safe rail at s=${reachFailedAt}`,
  });

  checks.push({
    name: 'preview',
    passed: previewFailedAt === null,
    detail:
      previewFailedAt === null
        ? `Required decisions spaced >= ${Math.round(requiredPreviewWu)} wu`
        : `Decisions at s=${previewFailedAt.s0} and s=${previewFailedAt.s1} only ${Math.round(previewFailedAt.ds)} wu apart (< ${Math.round(requiredPreviewWu)} wu)`,
  });

  // e. Braking moment check
  const brakeZones = course.segments?.filter((seg) => seg.brakeZone) ?? [];
  if (brakeZones.length === 0) {
    checks.push({
      name: 'brake-zone',
      passed: false,
      detail: 'Course has no segment tagged with "brakeZone": true',
    });
  } else {
    const zone = brakeZones[0]!;
    const boostHits = simulateZone(course, zone.s0, zone.s1, 'boost');
    const brakeHits = simulateZone(course, zone.s0, zone.s1, 'brake');
    const ok = brakeHits < boostHits;
    checks.push({
      name: 'brake-zone',
      passed: ok,
      detail: `Zone [${zone.s0}..${zone.s1}]: brake hits=${brakeHits}, boost hits=${boostHits}`,
    });
  }

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}

/**
 * Simulates a smart-steering agent through [s0, s1] that steers toward the nearest open rail
 * at the next upcoming hazard cluster while either holding boost or holding brake.
 */
function simulateZone(course: CourseDef, s0: number, s1: number, mode: 'boost' | 'brake'): number {
  const track = buildTrack(course);
  const sim = createSim(track, course);
  const clusters = buildHazardClusters(course).filter((c) => c.s >= s0 && c.s <= s1);

  // Place kart slightly before s0 at realistic entry speed and full boost
  sim.state.kart.s = Math.max(0, s0 - 300);
  sim.state.kart.speed = mode === 'boost' ? TUNING.vMaxBoost : TUNING.vCruise;
  sim.state.kart.boost = TUNING.boostCapacity;

  let guard = 0;
  while (sim.state.kart.s <= s1 + 50 && guard < 10000) {
    guard++;
    const s = sim.state.kart.s;
    const inZone = s >= s0 - 200 && s <= s1;
    const nextCluster = clusters.find((c) => c.s >= s);

    let laneUp = 0;
    let laneDown = 0;
    if (nextCluster && sim.state.kart.railT >= 1) {
      const curRail = sim.state.kart.rail;
      if (nextCluster.blockedRails.has(curRail)) {
        // Pick closest open rail
        const open = ([0, 1, 2] as RailIndex[]).filter((r) => !nextCluster.blockedRails.has(r));
        open.sort((a, b) => Math.abs(a - curRail) - Math.abs(b - curRail));
        const target = open[0];
        if (target !== undefined) {
          if (target < curRail) laneUp = 1;
          else if (target > curRail) laneDown = 1;
        }
      }
    }

    const input: InputState = {
      boost: mode === 'boost',
      brake: inZone && mode === 'brake',
      laneUp,
      laneDown,
    };
    sim.step(input, TUNING.SIM_DT);
  }

  return sim.state.stats.hazards;
}

// CLI entry point
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('scripts/check-fairness.ts');

if (isMain) {
  const argPath = process.argv[2] ?? 'src/content/courses/course-01.json';
  const fullPath = resolve(process.cwd(), argPath);
  const raw = readFileSync(fullPath, 'utf-8');
  const course = JSON.parse(raw) as CourseDef;
  const res = evaluateCourseFairness(course);

  console.log(`\nFairness Report: ${course.courseId} (${argPath})`);
  console.log('─'.repeat(60));
  for (const c of res.checks) {
    const badge = c.passed ? 'PASS' : 'FAIL';
    console.log(`[${badge}] ${c.name.padEnd(14)} ${c.detail}`);
  }
  console.log('─'.repeat(60));
  if (!res.passed) {
    process.exit(1);
  }
}

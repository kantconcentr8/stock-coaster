import { TUNING } from '@/config/tuning';
import type { CourseDef } from '@/core/types';

/**
 * Coordinates are screen-style: x grows right, y grows DOWN. `angle` is atan2(dy, dx) in
 * radians, so a positive angle means the track descends on screen (the kart speeds up).
 * Rail offsets are in rail-index units from the centerline: -1 = upper, 0 = middle, +1 = lower.
 */
export interface TrackSample {
  x: number;
  y: number;
  angle: number;
}

export interface Track {
  /** Centerline arc length (wu). */
  readonly length: number;
  readonly step: number;
  readonly railSpacing: number;
  readonly x: Float64Array;
  readonly y: Float64Array;
  readonly angle: Float64Array;
  readonly warnings: string[];
  /** Linear interpolation of the resampled centerline; `s` is clamped to [0, length]. */
  sample(s: number, out?: TrackSample): TrackSample;
  /** Y of a rail at `s`; `offset` is continuous in -1..+1 (see above). */
  railY(s: number, offset: number): number;
}

type Pt = { x: number; y: number };

function catmullRom(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}

export function buildTrack(course: CourseDef): Track {
  const pts = course.points;
  if (pts.length < 2) throw new Error('Course needs at least 2 points');
  const step = TUNING.trackStep;
  const at = (i: number): Pt => pts[Math.min(Math.max(i, 0), pts.length - 1)] as Pt;

  // Dense Catmull-Rom polyline with cumulative arc length.
  const dense: Pt[] = [at(0)];
  const cum: number[] = [0];
  const SUB = 48;
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 1; k <= SUB; k++) {
      const p = catmullRom(at(i - 1), at(i), at(i + 1), at(i + 2), k / SUB);
      const prev = dense[dense.length - 1] as Pt;
      dense.push(p);
      cum.push((cum[cum.length - 1] as number) + Math.hypot(p.x - prev.x, p.y - prev.y));
    }
  }
  const length = cum[cum.length - 1] as number;
  const n = Math.floor(length / step) + 1;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const target = i * step;
    while (j < dense.length - 2 && (cum[j + 1] as number) < target) j++;
    const c0 = cum[j] as number;
    const c1 = cum[j + 1] as number;
    const u = c1 > c0 ? (target - c0) / (c1 - c0) : 0;
    const a = dense[j] as Pt;
    const b = dense[j + 1] as Pt;
    x[i] = a.x + (b.x - a.x) * u;
    y[i] = a.y + (b.y - a.y) * u;
  }

  const angle = new Float64Array(n);
  const warnings: string[] = [];
  const maxRad = (TUNING.maxSlopeDeg * Math.PI) / 180;
  const W = 4;
  let flaggedFrom = -1;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - W);
    const b = Math.min(n - 1, i + W);
    const raw = Math.atan2(
      (y[b] as number) - (y[a] as number),
      (x[b] as number) - (x[a] as number),
    );
    if (Math.abs(raw) > maxRad) {
      if (flaggedFrom < 0) flaggedFrom = i;
    } else if (flaggedFrom >= 0) {
      warnings.push(`Slope exceeds ${TUNING.maxSlopeDeg}° between s=${flaggedFrom} and s=${i}`);
      flaggedFrom = -1;
    }
    angle[i] = Math.max(-maxRad, Math.min(maxRad, raw));
  }
  if (flaggedFrom >= 0) {
    warnings.push(`Slope exceeds ${TUNING.maxSlopeDeg}° from s=${flaggedFrom} to the end`);
  }

  const last = n - 1;
  const sample = (s: number, out: TrackSample = { x: 0, y: 0, angle: 0 }): TrackSample => {
    const f = Math.min(Math.max(s / step, 0), last);
    const i = Math.min(Math.floor(f), last - 1);
    const u = f - i;
    const i1 = i + 1;
    out.x = (x[i] as number) + ((x[i1] as number) - (x[i] as number)) * u;
    out.y = (y[i] as number) + ((y[i1] as number) - (y[i] as number)) * u;
    out.angle = (angle[i] as number) + ((angle[i1] as number) - (angle[i] as number)) * u;
    return out;
  };

  const scratch: TrackSample = { x: 0, y: 0, angle: 0 };
  return {
    length,
    step,
    railSpacing: course.railSpacing,
    x,
    y,
    angle,
    warnings,
    sample,
    railY(s, offset) {
      return sample(s, scratch).y + offset * course.railSpacing;
    },
  };
}

/** Throws when the course cannot run out within a full boosted run (plus 15% margin). */
export function assertCourseLength(track: Track): void {
  const needed = TUNING.vMaxBoost * TUNING.RUN_SECONDS * 1.15;
  if (track.length < needed) {
    throw new Error(
      `Course length ${Math.round(track.length)} wu is below required ${Math.ceil(needed)} wu`,
    );
  }
}

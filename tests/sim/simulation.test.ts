import { describe, expect, it } from 'vitest';
import { TUNING } from '@/config/tuning';
import devCourse from '@/content/courses/dev-course.json';
import type { CourseDef, GameEvent } from '@/core/types';
import { scoreBreakdown } from '@/sim/scoring';
import { createSim, type Sim } from '@/sim/simulation';
import { buildTrack } from '@/sim/track';
import { SCRIPTS, type InputScript } from '../fixtures/inputScripts';

const course = devCourse as CourseDef;
const track = buildTrack(course);
const TOTAL_STEPS = Math.round(TUNING.RUN_SECONDS / TUNING.SIM_DT);

function play(sim: Sim, script: InputScript) {
  for (let i = 0; i < TOTAL_STEPS; i++) sim.step(script(i), TUNING.SIM_DT);
}

describe('simulation', () => {
  for (const [name, script] of Object.entries(SCRIPTS)) {
    it(`fixture "${name}" ends at t = 60 within the course`, () => {
      const sim = createSim(track, course);
      play(sim, script);
      expect(sim.state.t).toBeCloseTo(TUNING.RUN_SECONDS, 6);
      expect(sim.state.stats.distance).toBeLessThan(track.length);
    });
  }

  it('is deterministic: same script gives the same final score', () => {
    const a = createSim(track, course);
    const b = createSim(track, course);
    play(a, SCRIPTS['lane-zigzag']!);
    play(b, SCRIPTS['lane-zigzag']!);
    expect(a.state.stats).toEqual(b.state.stats);
  });

  it('reset restores a state deep-equal to a fresh sim', () => {
    const sim = createSim(track, course);
    play(sim, SCRIPTS['boost-all']!);
    expect(sim.state.stats.distance).toBeGreaterThan(0);
    sim.reset();
    expect(sim.state).toEqual(createSim(track, course).state);
    // The object index is reset too: a replay yields the same result.
    const first = createSim(track, course);
    play(first, SCRIPTS['lane-zigzag']!);
    sim.reset();
    play(sim, SCRIPTS['lane-zigzag']!);
    expect(sim.state.stats).toEqual(first.state.stats);
  });

  it('emits pickup/hazard events and score matches the formula', () => {
    const events: GameEvent[] = [];
    const sim = createSim(track, course, (e) => events.push(e));
    play(sim, SCRIPTS['lane-zigzag']!);
    const { stats } = sim.state;
    expect(events.filter((e) => e.type === 'pickup')).toHaveLength(stats.pickups);
    expect(events.filter((e) => e.type === 'hazardHit')).toHaveLength(stats.hazards);
    expect(stats.score).toBe(scoreBreakdown(stats).total);
  });
});

describe('scoring', () => {
  it('uses floor(distance × rate) + pickups × points', () => {
    const b = scoreBreakdown({ distance: 1999, pickups: 3 });
    expect(b.distancePoints).toBe(Math.floor(1999 * TUNING.distancePointsPerWu));
    expect(b.pickupPoints).toBe(3 * TUNING.pickupPoints);
    expect(b.total).toBe(b.distancePoints + b.pickupPoints);
  });
});

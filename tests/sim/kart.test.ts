import { describe, expect, it } from 'vitest';
import { TUNING } from '@/config/tuning';
import type { InputState } from '@/core/types';
import { createKart, stepKart } from '@/sim/kart';
import type { Track } from '@/sim/track';
import {
  downhillTrack,
  flatTrack,
  steepDownhillTrack,
  steepUphillTrack,
  uphillTrack,
} from '../fixtures/tracks';

const NONE: InputState = { boost: false, brake: false, laneUp: 0, laneDown: 0 };

function run(track: Track, input: InputState, seconds: number, speed?: number) {
  const kart = createKart();
  if (speed !== undefined) kart.speed = speed;
  const speeds: number[] = [];
  const steps = Math.round(seconds / TUNING.SIM_DT);
  for (let i = 0; i < steps; i++) {
    stepKart(kart, track, input, TUNING.SIM_DT);
    speeds.push(kart.speed);
  }
  return { kart, speeds };
}

describe('kart movement', () => {
  it('downhill accelerates, uphill decelerates, flat converges to cruise', () => {
    expect(run(downhillTrack(), NONE, 3).kart.speed).toBeGreaterThan(TUNING.vCruise);
    expect(run(uphillTrack(), NONE, 3).kart.speed).toBeLessThan(TUNING.vCruise);
    expect(run(flatTrack(), NONE, 30, 300).kart.speed).toBeCloseTo(TUNING.vCruise, 1);
  });

  it('never drops below vMin on the steepest uphill, nor exceeds vMax without boost', () => {
    const up = run(steepUphillTrack(), NONE, 60);
    expect(Math.min(...up.speeds)).toBeGreaterThanOrEqual(TUNING.vMin);
    const down = run(steepDownhillTrack(), NONE, 60);
    expect(Math.max(...down.speeds)).toBeLessThanOrEqual(TUNING.vMax + 1e-9);
  });

  it('is deterministic for the same input script', () => {
    const a = run(downhillTrack(), { ...NONE, boost: true }, 10);
    const b = run(downhillTrack(), { ...NONE, boost: true }, 10);
    expect(a.speeds).toEqual(b.speeds);
    expect(a.kart).toEqual(b.kart);
  });

  it('speed above the cap decays smoothly rather than snapping', () => {
    const kart = createKart();
    kart.speed = TUNING.vMaxBoost;
    const t = flatTrack();
    stepKart(kart, t, NONE, TUNING.SIM_DT);
    expect(kart.speed).toBeGreaterThan(TUNING.vMax);
    expect(TUNING.vMaxBoost - kart.speed).toBeLessThan(2);
  });
});

describe('boost and brake', () => {
  it('holding boost with no pickups empties the meter and speed returns to normal cap', () => {
    const { kart, speeds } = run(flatTrack(), { ...NONE, boost: true }, 60);
    expect(kart.boost).toBe(0);
    expect(Math.max(...speeds)).toBeGreaterThan(TUNING.vMax);
    expect(kart.speed).toBeLessThanOrEqual(TUNING.vMax + 1e-9);
  });

  it('brake wins when both are held', () => {
    const both = run(downhillTrack(), { ...NONE, boost: true, brake: true }, 3);
    const brake = run(downhillTrack(), { ...NONE, brake: true }, 3);
    expect(both.kart.speed).toBeCloseTo(brake.kart.speed, 9);
    expect(both.kart.boost).toBe(TUNING.boostStart);
  });

  it('braking on a steep downhill holds speed >= vMin and is slower than not braking', () => {
    const braked = run(steepDownhillTrack(), { ...NONE, brake: true }, 20);
    const free = run(steepDownhillTrack(), NONE, 20);
    expect(Math.min(...braked.speeds)).toBeGreaterThanOrEqual(TUNING.vMin);
    expect(braked.kart.speed).toBeLessThan(free.kart.speed);
  });
});

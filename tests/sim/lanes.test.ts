import { describe, expect, it } from 'vitest';
import { TUNING } from '@/config/tuning';
import { createKart, stepKart } from '@/sim/kart';
import { applyLaneInput, collisionRail, railOffset, stepLane } from '@/sim/lanes';
import { flatTrack } from '../fixtures/tracks';

const UP = { laneUp: 1, laneDown: 0 };
const DOWN = { laneUp: 0, laneDown: 1 };
const NONE = { laneUp: 0, laneDown: 0 };
const STEPS = Math.ceil(TUNING.laneChangeSeconds / TUNING.SIM_DT) + 1;

function settle(kart: ReturnType<typeof createKart>) {
  for (let i = 0; i < STEPS; i++) stepLane(kart, TUNING.SIM_DT);
}

describe('lanes', () => {
  it('rapid presses move one rail at a time and never skip', () => {
    const kart = createKart();
    kart.rail = kart.railFrom = 2;
    const seen: number[] = [];
    // Three presses in consecutive steps: only the first is accepted mid-transition.
    for (let i = 0; i < 3; i++) {
      applyLaneInput(kart, UP);
      stepLane(kart, TUNING.SIM_DT);
      seen.push(kart.rail);
    }
    expect(seen).toEqual([1, 1, 1]);
    settle(kart);
    applyLaneInput(kart, UP);
    settle(kart);
    expect(kart.rail).toBe(0);
    // Ignored at the bound.
    applyLaneInput(kart, UP);
    expect(kart.rail).toBe(0);
    expect(kart.railT).toBe(1);
  });

  it('opposite presses in one step cancel', () => {
    const kart = createKart();
    applyLaneInput(kart, { laneUp: 1, laneDown: 1 });
    expect(kart.rail).toBe(1);
  });

  it('lane changes do not alter speed or s', () => {
    const track = flatTrack();
    const a = createKart();
    const b = createKart();
    for (let i = 0; i < STEPS * 2; i++) {
      applyLaneInput(a, i === 0 ? DOWN : NONE);
      stepLane(a, TUNING.SIM_DT);
      stepKart(a, track, { boost: false, brake: false }, TUNING.SIM_DT);
      stepKart(b, track, { boost: false, brake: false }, TUNING.SIM_DT);
    }
    expect(a.rail).toBe(2);
    expect(a.s).toBe(b.s);
    expect(a.speed).toBe(b.speed);
  });

  it('collisionRail switches exactly at the transition midpoint', () => {
    const kart = createKart();
    applyLaneInput(kart, DOWN);
    kart.railT = 0.4999;
    expect(collisionRail(kart)).toBe(1);
    kart.railT = 0.5;
    expect(collisionRail(kart)).toBe(2);
  });

  it('railOffset interpolates from -1..+1 and is eased', () => {
    const kart = createKart();
    expect(railOffset(kart)).toBe(0);
    applyLaneInput(kart, DOWN);
    kart.railT = 0.5;
    expect(railOffset(kart)).toBeCloseTo(0.5, 9);
    kart.railT = 1;
    expect(railOffset(kart)).toBe(1);
  });
});

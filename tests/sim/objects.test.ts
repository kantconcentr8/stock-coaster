import { describe, expect, it } from 'vitest';
import { TUNING } from '@/config/tuning';
import type { CourseObject, GameEvent, SimState } from '@/core/types';
import { createKart } from '@/sim/kart';
import { createObjectIndex, processObjects } from '@/sim/objects';

function makeState(): SimState {
  return {
    t: 0,
    kart: createKart(),
    stats: { distance: 0, pickups: 0, hazards: 0, score: 0 },
    consumed: new Set(),
    done: false,
  };
}

function setup(objects: CourseObject[]) {
  const state = makeState();
  const events: GameEvent[] = [];
  const index = createObjectIndex(objects);
  const tick = () => processObjects(state, index, (e) => events.push(e));
  return { state, events, tick };
}

describe('objects', () => {
  it('a pickup applies exactly once even when overlapped for many steps', () => {
    const { state, events, tick } = setup([{ id: 'p', kind: 'pickup', rail: 1, s: 100 }]);
    state.kart.s = 100;
    state.kart.boost = 0;
    for (let i = 0; i < 500; i++) tick();
    expect(state.stats.pickups).toBe(1);
    expect(state.kart.boost).toBe(TUNING.pickupBoost);
    expect(events.filter((e) => e.type === 'pickup')).toHaveLength(1);
  });

  it('two hazards inside the invulnerability window apply one hit', () => {
    const { state, events, tick } = setup([
      { id: 'a', kind: 'hazard', rail: 1, s: 100 },
      { id: 'b', kind: 'hazard', rail: 1, s: 130 },
    ]);
    state.kart.speed = 300;
    for (let s = 90; s <= 140; s += 1) {
      state.kart.s = s;
      state.t += 0.005;
      tick();
    }
    expect(state.stats.hazards).toBe(1);
    expect(events.filter((e) => e.type === 'hazardHit')).toHaveLength(1);
    expect(state.kart.speed).toBeCloseTo(300 * TUNING.hazardSpeedFactor, 9);
    expect(state.done).toBe(false);
  });

  it('a hazard after the invulnerability window hits again', () => {
    const { state, tick } = setup([
      { id: 'a', kind: 'hazard', rail: 1, s: 100 },
      { id: 'b', kind: 'hazard', rail: 1, s: 900 },
    ]);
    state.kart.s = 100;
    tick();
    state.kart.s = 900;
    state.t = TUNING.invulnSeconds + 0.01;
    tick();
    expect(state.stats.hazards).toBe(2);
  });

  it('hazard speed never drops below vMin', () => {
    const { state, tick } = setup([{ id: 'a', kind: 'hazard', rail: 1, s: 10 }]);
    state.kart.s = 10;
    state.kart.speed = TUNING.vMin;
    tick();
    expect(state.kart.speed).toBe(TUNING.vMin);
  });

  it('a mid-transition kart collides per collisionRail only', () => {
    const { state, tick } = setup([
      { id: 'old', kind: 'hazard', rail: 1, s: 100 },
      { id: 'new', kind: 'pickup', rail: 2, s: 100 },
    ]);
    state.kart.s = 100;
    state.kart.railFrom = 1;
    state.kart.rail = 2;
    state.kart.railT = 0.3; // still on the old rail
    tick();
    expect(state.stats.hazards).toBe(1);
    expect(state.stats.pickups).toBe(0);
    state.kart.railT = 0.6; // now on the new rail
    tick();
    expect(state.stats.pickups).toBe(1);
  });

  it('ignores objects outside the hit window', () => {
    const { state, tick } = setup([{ id: 'p', kind: 'pickup', rail: 1, s: 100 }]);
    state.kart.s = 100 + TUNING.hitHalfWidth + 1;
    tick();
    expect(state.stats.pickups).toBe(0);
  });
});

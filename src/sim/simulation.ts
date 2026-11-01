import type { CourseDef, GameEvent, InputState, SimState } from '@/core/types';
import { applyLaneInput, stepLane } from './lanes';
import { createKart, stepKart } from './kart';
import { createObjectIndex, processObjects } from './objects';
import { computeScore } from './scoring';
import type { Track } from './track';

export interface Sim {
  /** Live state; the object identity is stable across `reset()`. */
  readonly state: SimState;
  /** Order per step: lanes → boost/brake/kart → objects → stats → t += dt. */
  step(input: InputState, dt: number): void;
  reset(): void;
}

function createState(): SimState {
  return {
    t: 0,
    kart: createKart(),
    stats: { distance: 0, pickups: 0, hazards: 0, score: 0 },
    consumed: new Set<string>(),
    done: false,
  };
}

export function createSim(
  track: Track,
  course: CourseDef,
  emit: (event: GameEvent) => void = () => {},
): Sim {
  const state = createState();
  let index = createObjectIndex(course.objects);

  return {
    state,
    step(input, dt) {
      const { kart, stats } = state;
      applyLaneInput(kart, input);
      stepLane(kart, dt);
      stepKart(kart, track, input, dt);
      processObjects(state, index, emit);
      stats.distance = kart.s;
      stats.score = computeScore(stats);
      state.t += dt;
    },
    reset() {
      Object.assign(state, createState());
      index = createObjectIndex(course.objects);
    },
  };
}

import type { InputState } from '@/core/types';

export type HoldAction = 'boost' | 'brake';
export type LaneDir = 'up' | 'down';

export interface InputController {
  readonly state: Readonly<InputState>;
  press(action: HoldAction): void;
  release(action: HoldAction): void;
  pulseLane(dir: LaneDir): void;
  /** Returns a snapshot of current state and zeroes the lane edge-trigger counters. */
  consumeLanes(): InputState;
  clearAll(): void;
}

export function createInput(): InputController {
  const state: InputState = { boost: false, brake: false, laneUp: 0, laneDown: 0 };

  return {
    state,
    press(action) {
      state[action] = true;
    },
    release(action) {
      state[action] = false;
    },
    pulseLane(dir) {
      if (dir === 'up') state.laneUp++;
      else state.laneDown++;
    },
    consumeLanes() {
      const snap: InputState = {
        boost: state.boost,
        brake: state.brake,
        laneUp: state.laneUp,
        laneDown: state.laneDown,
      };
      state.laneUp = 0;
      state.laneDown = 0;
      return snap;
    },
    clearAll() {
      state.boost = false;
      state.brake = false;
      state.laneUp = 0;
      state.laneDown = 0;
    },
  };
}

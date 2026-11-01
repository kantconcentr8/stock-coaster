import type { InputState } from '@/core/types';

export type InputScript = (stepIndex: number) => InputState;

const none = (): InputState => ({ boost: false, brake: false, laneUp: 0, laneDown: 0 });

export const idle: InputScript = () => none();
export const boostAll: InputScript = () => ({ ...none(), boost: true });
export const brakeAll: InputScript = () => ({ ...none(), brake: true });

/** Presses a lane key every 0.5 s of sim time (60 steps), alternating down/up. */
export const laneZigzag: InputScript = (i) => {
  if (i % 60 !== 0) return none();
  const n = i / 60;
  return n % 2 === 0 ? { ...none(), laneUp: 1 } : { ...none(), laneDown: 1 };
};

export const SCRIPTS: Record<string, InputScript> = {
  idle,
  'boost-all': boostAll,
  'brake-all': brakeAll,
  'lane-zigzag': laneZigzag,
};

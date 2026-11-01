import { TUNING } from '@/config/tuning';
import type { InputState, KartState, RailIndex } from '@/core/types';

/**
 * Policy: new lane presses are IGNORED while a transition is in progress (railT < 1);
 * each accepted press moves exactly one adjacent rail. Up+down in the same step cancel.
 * Lane fields of `input` are per-step values supplied by the caller (not mutated here).
 */
export function applyLaneInput(
  kart: KartState,
  input: Pick<InputState, 'laneUp' | 'laneDown'>,
): void {
  if (kart.railT < 1) return;
  const up = input.laneUp > 0;
  const down = input.laneDown > 0;
  if (up === down) return;
  const next = (up ? kart.rail - 1 : kart.rail + 1) as number;
  if (next < 0 || next > 2) return;
  kart.railFrom = kart.rail;
  kart.rail = next as RailIndex;
  kart.railT = 0;
}

export function stepLane(kart: KartState, dt: number): void {
  if (kart.railT >= 1) return;
  kart.railT = Math.min(1, kart.railT + dt / TUNING.laneChangeSeconds);
}

/** Continuous rail offset for rendering: -1 (upper) .. +1 (lower), ease-in-out. */
export function railOffset(kart: KartState): number {
  const e = kart.railT * kart.railT * (3 - 2 * kart.railT);
  return kart.railFrom + (kart.rail - kart.railFrom) * e - 1;
}

/** The single collision-rail rule: the old rail until the midpoint, the new rail after. */
export function collisionRail(kart: KartState): RailIndex {
  return kart.railT < 0.5 ? kart.railFrom : kart.rail;
}

import { TUNING } from '@/config/tuning';
import type { InputState, KartState } from '@/core/types';
import { canBoost, drainBoost } from './boost';
import type { Track } from './track';

export function createKart(): KartState {
  return {
    s: 0,
    speed: TUNING.vCruise,
    rail: 1,
    railFrom: 1,
    railT: 1,
    boost: TUNING.boostStart,
    invulnUntil: 0,
  };
}

/**
 * Advances the kart along the centerline. MUTATES `kart` (no allocation per step).
 * Acceleration: gravityK·sin(angle) − drag·(speed − vCruise) + boost − brake.
 * `angle` is screen-style (positive = descending), so downhill accelerates.
 * If boost and brake are both held, brake wins. Speed above the current cap decays
 * at `overCapDecel` instead of snapping. Rail elevation never affects speed.
 */
export function stepKart(
  kart: KartState,
  track: Track,
  input: Pick<InputState, 'boost' | 'brake'>,
  dt: number,
): void {
  const boosting = canBoost(kart, input.boost, input.brake);
  const angle = track.sample(kart.s).angle;
  const a =
    TUNING.gravityK * Math.sin(angle) -
    TUNING.drag * (kart.speed - TUNING.vCruise) +
    (boosting ? TUNING.boostAccel : 0) -
    (input.brake ? TUNING.brakeDecel : 0);
  const cap = boosting ? TUNING.vMaxBoost : TUNING.vMax;
  let v: number;
  if (kart.speed > cap) {
    v = Math.max(cap, Math.min(kart.speed - TUNING.overCapDecel * dt, kart.speed + a * dt));
  } else {
    v = Math.min(cap, kart.speed + a * dt);
  }
  kart.speed = Math.max(TUNING.vMin, v);
  kart.s += kart.speed * dt;
  drainBoost(kart, boosting, dt);
}

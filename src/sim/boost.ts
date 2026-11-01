import { TUNING } from '@/config/tuning';
import type { KartState } from '@/core/types';

/** Boost meter helpers. The meter lives in `KartState.boost`, clamped to [0, boostCapacity]. */

export function addBoost(kart: KartState, amount: number): void {
  kart.boost = Math.min(TUNING.boostCapacity, Math.max(0, kart.boost + amount));
}

/** Drains while `active`; returns nothing. Callers decide `active` (see `canBoost`). */
export function drainBoost(kart: KartState, active: boolean, dt: number): void {
  if (!active) return;
  kart.boost = Math.max(0, kart.boost - TUNING.boostDrainPerSec * dt);
}

/** Boosting is only effective when the meter has charge, and braking wins over boosting. */
export function canBoost(kart: KartState, wantBoost: boolean, wantBrake: boolean): boolean {
  return wantBoost && !wantBrake && kart.boost > 0;
}

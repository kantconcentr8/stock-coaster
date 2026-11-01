import { TUNING } from '@/config/tuning';
import type { CourseObject, GameEvent, SimState } from '@/core/types';
import { addBoost } from './boost';
import { collisionRail } from './lanes';
import { computeScore } from './scoring';

export interface ObjectIndex {
  readonly objects: readonly CourseObject[];
  /** First object that may still be overlapped (objects are sorted by s). */
  cursor: number;
}

export function createObjectIndex(objects: readonly CourseObject[]): ObjectIndex {
  return { objects: [...objects].sort((a, b) => a.s - b.s), cursor: 0 };
}

/**
 * Resolves collisions for the current kart position. Amortized O(1): the cursor only moves
 * forward past objects the kart has fully cleared.
 * Collision: |object.s − kart.s| ≤ hitHalfWidth and object.rail === collisionRail(kart).
 * Pickups apply once (tracked in `state.consumed`). A hazard hits only when t ≥ invulnUntil,
 * is then consumed, and never ends the run.
 */
export function processObjects(
  state: SimState,
  index: ObjectIndex,
  emit: (event: GameEvent) => void,
): void {
  const { kart, stats } = state;
  const h = TUNING.hitHalfWidth;
  const objs = index.objects;
  while (index.cursor < objs.length && (objs[index.cursor] as CourseObject).s + h < kart.s) {
    index.cursor++;
  }
  const rail = collisionRail(kart);
  for (let i = index.cursor; i < objs.length; i++) {
    const o = objs[i] as CourseObject;
    if (o.s - h > kart.s) break;
    if (o.rail !== rail || state.consumed.has(o.id)) continue;
    if (o.kind === 'pickup') {
      state.consumed.add(o.id);
      stats.pickups++;
      addBoost(kart, TUNING.pickupBoost);
      stats.score = computeScore(stats);
      emit({ type: 'pickup', objectId: o.id, t: state.t });
    } else if (state.t >= kart.invulnUntil) {
      state.consumed.add(o.id);
      stats.hazards++;
      kart.speed = Math.max(TUNING.vMin, kart.speed * TUNING.hazardSpeedFactor);
      kart.invulnUntil = state.t + TUNING.invulnSeconds;
      emit({ type: 'hazardHit', objectId: o.id, t: state.t });
    }
  }
}

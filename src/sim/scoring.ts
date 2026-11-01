import { SCORING_VERSION, TUNING } from '@/config/tuning';
import type { RunStats } from '@/core/types';

/**
 * Score formula (SCORING_VERSION = 1):
 *   score = floor(distance × distancePointsPerWu) + pickups × pickupPoints
 * Neutral game points only. Hazards do not subtract points; they cost speed.
 * Bump SCORING_VERSION whenever this formula or its constants change.
 */
export { SCORING_VERSION };

export interface ScoreBreakdown {
  distancePoints: number;
  pickupPoints: number;
  total: number;
}

export function scoreBreakdown(stats: Pick<RunStats, 'distance' | 'pickups'>): ScoreBreakdown {
  const distancePoints = Math.floor(stats.distance * TUNING.distancePointsPerWu);
  const pickupPoints = stats.pickups * TUNING.pickupPoints;
  return { distancePoints, pickupPoints, total: distancePoints + pickupPoints };
}

export function computeScore(stats: Pick<RunStats, 'distance' | 'pickups'>): number {
  return scoreBreakdown(stats).total;
}

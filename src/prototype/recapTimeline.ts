import type { Briefing } from '@/core/types';

export const RIDE_DURATION = 28;

export function rideStage(time: number): string {
  return time >= RIDE_DURATION
    ? 'Recap complete'
    : time >= 17
      ? 'The recovery'
      : time >= 15
        ? 'Through the trough'
        : time >= 10
          ? 'The plunge'
          : time >= 7
            ? 'At the crest'
            : time > 0
              ? 'The climb'
              : 'Ready to climb';
}

/** The first section establishes context through the plunge; subsequent sections occupy recovery.
 * This retimes editorial sections for presentation, never their market coverage dates.
 */
export function recapChapter(briefing: Briefing, time: number) {
  const chapters = briefing.chapters;
  const recovery = chapters.slice(1);
  if (!recovery.length || time < 17) return { chapter: chapters[0]!, index: 0 };
  const total = recovery.reduce((sum, ch) => sum + ch.endSec - ch.startSec, 0);
  let cursor = 17;
  for (const [index, chapter] of recovery.entries()) {
    // Reserve a little more reading time for the first recovery section in a three-section recap.
    const length =
      recovery.length === 2
        ? index === 0
          ? 7
          : 4
        : ((chapter.endSec - chapter.startSec) / total) * 11;
    cursor += length;
    if (time < cursor || index === recovery.length - 1) return { chapter, index: index + 1 };
  }
  return { chapter: chapters[0]!, index: 0 };
}

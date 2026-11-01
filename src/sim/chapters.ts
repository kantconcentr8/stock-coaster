import type { Chapter } from '../core/types';

export function createChapterScheduler(
  chapters: Chapter[],
  onSeen: (chapter: Chapter, t: number) => void = () => {},
) {
  const seen = new Set<string>();
  return {
    update(activeTime: number): Chapter | undefined {
      const chapter = chapters.find((c) => activeTime >= c.startSec && activeTime < c.endSec);
      if (chapter && !seen.has(chapter.id)) {
        seen.add(chapter.id);
        onSeen(chapter, activeTime);
      }
      return chapter;
    },
    reset() {
      seen.clear();
    },
  };
}

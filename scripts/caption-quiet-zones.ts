import type { Briefing, CourseDef } from '../src/core/types';
import { TUNING } from '../src/config/tuning';
import { courseTimeline } from './course-timeline';

/** Keep the two active seconds following each caption free of immediate hazards. */
export function checkCaptionQuietZones(course: CourseDef, chapters: Briefing['chapters']) {
  return chapters.map((chapter) => {
    const [start = 0, end = 0] = courseTimeline(course, 'idle', [
      chapter.startSec,
      chapter.startSec + 2,
    ]);
    const hazards = course.objects.filter(
      (o) =>
        o.kind === 'hazard' &&
        o.s >= start - TUNING.hitHalfWidth &&
        o.s <= end + TUNING.hitHalfWidth,
    );
    return {
      name: `captionQuietZone:${chapter.id}`,
      passed: hazards.length === 0,
      detail: `${Math.round(start)}..${Math.round(end)} wu; ${hazards.length} hazards`,
    };
  });
}

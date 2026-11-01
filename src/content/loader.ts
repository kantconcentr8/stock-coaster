import type { Briefing, CourseDef } from '../core/types';
import { BRIEFING_ID, validateBriefing } from './schema';

export const defaultBriefingId = '2026-10-31-lower-value';
export type BriefingNotice = 'unknown-id' | 'invalid-id';
export function createBriefingLoader(entries: unknown[], courses: CourseDef[]) {
  return (search: string): { briefing: Briefing; course: CourseDef; notice?: BriefingNotice } => {
    const registry = new Map(
      entries.map((entry) => {
        const { briefing } = validateBriefing(entry);
        return [briefing.briefingId, briefing] as const;
      }),
    );
    if (registry.size !== entries.length) throw new Error('app_error: duplicate briefing ID');
    const id = new URLSearchParams(search).get('b');
    const notice =
      id !== null && !BRIEFING_ID.test(id)
        ? 'invalid-id'
        : id !== null && !registry.has(id)
          ? 'unknown-id'
          : undefined;
    const briefing = registry.get(notice || id === null ? defaultBriefingId : id);
    if (!briefing) throw new Error('app_error: missing default briefing');
    const course = courses.find(
      (c) => c.courseId === briefing.courseId && c.courseVersion === briefing.courseVersion,
    );
    if (
      !course ||
      !Array.isArray(course.points) ||
      course.points.length < 2 ||
      !Array.isArray(course.objects)
    )
      throw new Error('app_error: missing or invalid referenced course');
    return { briefing, course, notice };
  };
}

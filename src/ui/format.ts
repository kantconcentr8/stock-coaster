import type { Briefing } from '../core/types';
export function formatCoverage(briefing: Briefing): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: briefing.displayTimezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return `Published ${formatter.format(new Date(briefing.publishedAt))} · Covers through ${formatter.format(new Date(briefing.coverageEnd))} (${briefing.displayTimezone})`;
}

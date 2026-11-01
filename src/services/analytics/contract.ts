import { sanitizeAttribution } from '../attribution';
export interface Payloads {
  landing_view: Record<string, never>;
  run_start: Record<string, never>;
  chapter_seen: { chapterId: string; runTime: number };
  run_complete: { score: number; distance: number; pickups: number; hazards: number };
  run_restart: { sourceScreen: 'paused' | 'results'; priorComplete: boolean };
  briefing_read: { entryScreen: 'intro' | 'results' | 'fallback' };
  learning_answer: { questionId: string; correct: boolean };
  cta_click: { ctaId: string; destinationCategory: string };
  share_action: { method: 'native' | 'copy' | 'manual' };
  app_error: { code: 'content_invalid' | 'graphics_unavailable' | 'unknown' };
}
export type EventName = keyof Payloads;
export type AnalyticsRecord = {
  name: EventName;
  properties: Record<string, string | number | boolean>;
};
const fields: Record<EventName, string[]> = {
  landing_view: [],
  run_start: [],
  chapter_seen: ['chapterId', 'runTime'],
  run_complete: ['score', 'distance', 'pickups', 'hazards'],
  run_restart: ['sourceScreen', 'priorComplete'],
  briefing_read: ['entryScreen'],
  learning_answer: ['questionId', 'correct'],
  cta_click: ['ctaId', 'destinationCategory'],
  share_action: ['method'],
  app_error: ['code'],
};
const common = [
  'briefingId',
  'contentVersion',
  'courseVersion',
  'appVersion',
  'deviceClass',
  'sessionId',
  'runId',
];
const enums: Record<string, string[]> = {
  method: ['native', 'copy', 'manual'],
  entryScreen: ['intro', 'results', 'fallback'],
  sourceScreen: ['paused', 'results'],
  deviceClass: ['mobile', 'desktop'],
  code: ['content_invalid', 'graphics_unavailable', 'unknown'],
};
export function sanitizeEvent(name: EventName, input: Record<string, unknown>): AnalyticsRecord {
  const properties: AnalyticsRecord['properties'] = {};
  for (const key of [...common, ...fields[name]]) {
    const value = input[key];
    const numeric = [
      'contentVersion',
      'courseVersion',
      'runTime',
      'score',
      'distance',
      'pickups',
      'hazards',
    ];
    if (numeric.includes(key)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0)
        properties[key] = value;
    } else if (['correct', 'priorComplete'].includes(key)) {
      if (typeof value === 'boolean') properties[key] = value;
    } else if (
      typeof value === 'string' &&
      /^[A-Za-z0-9._~-]{1,100}$/.test(value) &&
      (!enums[key] || enums[key].includes(value))
    )
      properties[key] = value;
  }
  if (name === 'landing_view' || name === 'cta_click')
    Object.assign(properties, sanitizeAttribution(input));
  return { name, properties };
}

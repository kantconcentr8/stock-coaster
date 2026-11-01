import type { Briefing } from '../core/types';

export const BRIEFING_ID = /^[a-z0-9-]{3,64}$/;
export const isHttps = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
};
// Same-origin sources are published chart images, never internal editorial notes.
export const isSourceUrl = (value: string): boolean =>
  isHttps(value) || /^\/charts\/[a-z0-9-]+\.jpg$/.test(value);
export interface ValidationOptions {
  production?: boolean;
  allowUnapproved?: boolean;
}
export function validateBriefing(
  value: unknown,
  options: ValidationOptions = {},
): {
  briefing: Briefing;
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  type RecordValue = Record<string, unknown>;
  const object = (v: unknown, path: string): RecordValue => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      errors.push(`${path}: expected object`);
      return {};
    }
    return v as RecordValue;
  };
  const str = (o: RecordValue, key: string, path = key): string => {
    const v = o[key];
    if (typeof v !== 'string' || !v.trim()) {
      errors.push(`${path}: required nonempty string`);
      return '';
    }
    return v;
  };
  const array = (o: RecordValue, key: string, min: number, max = Infinity): unknown[] => {
    const v = o[key];
    if (!Array.isArray(v) || v.length < min || v.length > max) {
      errors.push(`${key}: expected ${min}–${max} entries`);
      return [];
    }
    return v;
  };
  const date = (v: string, path: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      v,
    );
    if (
      !match ||
      !Number.isFinite(Date.parse(v)) ||
      Number(match[2]) < 1 ||
      Number(match[2]) > 12 ||
      Number(match[3]) < 1 ||
      Number(match[3]) > new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate()
    )
      errors.push(`${path}: invalid ISO date with explicit timezone`);
  };
  const url = (v: string, path: string, placeholder = false) => {
    if (!isHttps(v) && !(placeholder && v.startsWith('TODO(owner)') && !options.production))
      errors.push(`${path}: HTTPS URL required`);
  };
  const classified = (o: RecordValue, path: string) => {
    const c = str(o, 'classification', `${path}.classification`);
    if (!['historical', 'interpretation', 'hypothetical'].includes(c))
      errors.push(`${path}: invalid classification`);
    const label = str(o, 'label', `${path}.label`);
    if (c === 'hypothetical' && !/hypothetical/i.test(label))
      errors.push(`${path}: missing Hypothetical label`);
  };
  const b = object(value, 'briefing');
  for (const key of [
    'briefingId',
    'title',
    'summary',
    'brandName',
    'courseId',
    'shareText',
    'socialImage',
    'disclaimer',
  ])
    str(b, key);
  if (!BRIEFING_ID.test(String(b.briefingId))) errors.push('briefingId: invalid ID');
  for (const key of ['contentVersion', 'courseVersion', 'scoringVersion'])
    if (!Number.isInteger(b[key]) || Number(b[key]) < 1)
      errors.push(`${key}: positive integer required`);
  for (const key of ['publishedAt', 'coverageEnd']) date(str(b, key), key);
  if (Date.parse(String(b.coverageEnd)) > Date.parse(String(b.publishedAt)))
    errors.push('coverageEnd: must not exceed publishedAt');
  try {
    new Intl.DateTimeFormat('en', { timeZone: str(b, 'displayTimezone') });
  } catch {
    errors.push('displayTimezone: invalid named timezone');
  }
  let end = 0;
  const ids = new Set<string>();
  for (const [i, item] of array(b, 'chapters', 1, 3).entries()) {
    const path = `chapters[${i}]`,
      ch = object(item, path);
    const id = str(ch, 'id', `${path}.id`);
    if (ids.has(id)) errors.push(`${path}: duplicate ID`);
    ids.add(id);
    str(ch, 'summary', `${path}.summary`);
    classified(ch, path);
    const words = str(ch, 'caption', `${path}.caption`).split(/\s+/).length;
    if (words > 16) errors.push(`${path}: caption exceeds 16 words`);
    else if (words > 12) warnings.push(`${path}: caption exceeds 12 words`);
    if (
      typeof ch.startSec !== 'number' ||
      typeof ch.endSec !== 'number' ||
      !Number.isFinite(ch.startSec) ||
      !Number.isFinite(ch.endSec) ||
      ch.startSec < end ||
      ch.startSec < 0 ||
      ch.endSec > 60 ||
      ch.endSec <= ch.startSec
    )
      errors.push(`${path}: overlapping, unordered or out-of-range times`);
    end = Number(ch.endSec);
    if (typeof ch.forwardLooking !== 'boolean')
      errors.push(`${path}.forwardLooking: boolean required`);
    if (ch.forwardLooking && ch.classification !== 'hypothetical')
      errors.push(`${path}: forward-looking content must be hypothetical`);
  }
  for (const item of array(b, 'takeaways', 1, 3)) {
    const t = object(item, 'takeaways');
    str(t, 'text');
    classified(t, 'takeaways');
  }
  for (const item of array(b, 'sources', 0)) {
    const s = object(item, 'sources');
    str(s, 'title');
    if (!isSourceUrl(str(s, 'url')))
      errors.push('sources.url: HTTPS URL or packaged /charts/*.jpg required');
    if (String(s.url).startsWith('/charts/')) {
      for (const key of ['caption', 'alt', 'context', 'attribution']) str(s, key, `sources.${key}`);
    }
    if (s.secondary !== undefined && typeof s.secondary !== 'boolean')
      errors.push('sources.secondary: boolean required');
  }
  for (const item of array(b, 'glossary', 0)) {
    const g = object(item, 'glossary');
    str(g, 'term');
    str(g, 'definition');
  }
  const cta = object(b.cta, 'cta');
  for (const key of ['id', 'label', 'campaignId', 'destinationCategory'])
    str(cta, key, `cta.${key}`);
  url(str(cta, 'url'), 'cta.url', true);
  const image = String(b.socialImage);
  if (!image.startsWith('TODO(owner)') && !/^\/(?!\/)[a-zA-Z0-9/_.-]+$/.test(image))
    url(image, 'socialImage');
  const approval = object(b.approval, 'approval');
  if (typeof approval.approved !== 'boolean') errors.push('approval.approved: boolean required');
  if (approval.approved) {
    str(approval, 'approvedBy');
    date(str(approval, 'approvedAt'), 'approval.approvedAt');
  }
  if (
    options.production &&
    !options.allowUnapproved &&
    JSON.stringify(value).includes('TODO(owner)')
  )
    errors.push('content: production cannot contain unresolved editorial TODOs');
  if (options.production && !options.allowUnapproved && approval.approved !== true)
    errors.push('approval: production requires owner approval (ALLOW_UNAPPROVED=1 for preview)');
  if (b.learningQuestion !== undefined) {
    const q = object(b.learningQuestion, 'learningQuestion');
    for (const key of ['id', 'prompt', 'explanation']) str(q, key);
    const answers = array(q, 'answers', 2, 4);
    if (answers.some((a) => typeof a !== 'string' || !a.trim()))
      errors.push('answers: nonempty strings required');
    if (
      !Number.isInteger(q.correctIndex) ||
      Number(q.correctIndex) < 0 ||
      Number(q.correctIndex) >= answers.length
    )
      errors.push('correctIndex: invalid answer index');
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { briefing: value as Briefing, warnings };
}

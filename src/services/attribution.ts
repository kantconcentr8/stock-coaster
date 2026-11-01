import type { Briefing } from '@/core/types';
import { createSafeStore } from './storage';
export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;
export type Attribution = Partial<Record<(typeof UTM_KEYS)[number], string>>;
export function sanitizeAttribution(input: Record<string, unknown>): Attribution {
  const result: Attribution = {};
  for (const key of UTM_KEYS) {
    const value = input[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (/^[A-Za-z0-9._~-]{1,100}$/.test(trimmed)) result[key] = trimmed;
  }
  return result;
}
export function captureAttribution(
  search: string,
  getBackend = () => globalThis.sessionStorage,
): Attribution {
  const store = createSafeStore(getBackend);
  let saved: Attribution = {};
  try {
    saved = sanitizeAttribution(JSON.parse(store.get('cc:v1:attribution') ?? '{}') ?? {});
  } catch {
    /* corrupt */
  }
  const incoming = sanitizeAttribution(Object.fromEntries(new URLSearchParams(search)));
  const result = { ...saved, ...incoming };
  store.set('cc:v1:attribution', JSON.stringify(result));
  return result;
}
export function buildCtaUrl(
  cta: Pick<Briefing['cta'], 'id' | 'url'>,
  attribution: Attribution,
): string {
  const url = new URL(cta.url);
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error('Invalid CTA destination');
  for (const [key, value] of Object.entries(sanitizeAttribution(attribution))) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  if (!url.searchParams.has('utm_content')) {
    const id = sanitizeAttribution({ utm_content: cta.id }).utm_content;
    if (id) url.searchParams.set('utm_content', id);
  }
  return url.href;
}

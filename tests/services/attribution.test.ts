// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { buildCtaUrl, captureAttribution, sanitizeAttribution } from '@/services/attribution';
it('allowlists, trims and rejects unsafe or overlong attribution', () => {
  expect(
    sanitizeAttribution({
      utm_source: ' x ',
      email: 'a@b.c',
      fbclid: 'secret',
      utm_campaign: 'bad value',
      utm_medium: 'x'.repeat(101),
    }),
  ).toEqual({ utm_source: 'x' });
});
it('keeps session attribution across retries and new service instances', () => {
  sessionStorage.clear();
  captureAttribution('?utm_source=x&utm_campaign=t&email=a@b.c');
  expect(captureAttribution('')).toEqual({ utm_source: 'x', utm_campaign: 't' });
});
it('preserves destination parameters and rejects insecure or credentialed URLs', () => {
  const cta = { id: 'join', url: 'https://example.test/?existing=1&utm_source=owned' };
  const url = new URL(buildCtaUrl(cta, { utm_source: 'x', utm_campaign: 't' }));
  expect(url.searchParams.get('utm_source')).toBe('owned');
  expect(url.searchParams.get('existing')).toBe('1');
  expect(url.searchParams.get('utm_content')).toBe('join');
  expect(url.searchParams.get('utm_campaign')).toBe('t');
  expect(() => buildCtaUrl({ ...cta, url: 'http://example.test' }, {})).toThrow();
  expect(() => buildCtaUrl({ ...cta, url: 'https://user:pass@example.test' }, {})).toThrow();
});

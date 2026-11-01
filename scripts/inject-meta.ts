import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import type { Briefing } from '../src/core/types.ts';
const briefing = JSON.parse(
  readFileSync(
    new URL('../src/content/briefings/2026-10-31-lower-value.json', import.meta.url),
    'utf8',
  ),
) as Briefing;
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
export function socialMetadata(): Plugin {
  // Public hosting/domain is a Phase 5 decision. Local preview URLs are deliberately explicit.
  const site = new URL(process.env.SITE_URL ?? 'http://localhost:4173/');
  if (!['http:', 'https:'].includes(site.protocol)) throw new Error('Invalid SITE_URL');
  site.search = '';
  site.hash = '';
  const canonical = new URL(site);
  canonical.searchParams.set('b', briefing.briefingId);
  const image = new URL('/social/default-1200x630.png', site).href;
  const description = briefing.approval.approved ? briefing.summary : briefing.shareText;
  const tag = (name: string, content: string, property = false) => ({
    tag: 'meta',
    attrs: { [property ? 'property' : 'name']: name, content },
  });
  return {
    name: 'briefing-social-metadata',
    transformIndexHtml(html) {
      return {
        html: html.replace(
          /<title>.*?<\/title>/,
          `<title>${escape(briefing.title)} | Candlestick Coaster</title>`,
        ),
        tags: [
          ...(!briefing.approval.approved ? [tag('robots', 'noindex, nofollow')] : []),
          tag('description', description),
          tag('og:type', 'website', true),
          tag('og:title', briefing.title, true),
          tag('og:description', description, true),
          tag('og:url', canonical.href, true),
          tag('og:image', image, true),
          tag('og:image:width', '1200', true),
          tag('og:image:height', '630', true),
          tag(
            'og:image:alt',
            'The Daily Ride — Candlestick Coaster illustrative passenger briefing',
            true,
          ),
          tag('twitter:card', 'summary_large_image'),
          tag('twitter:title', briefing.title),
          tag('twitter:description', description),
          tag('twitter:image', image),
          { tag: 'link', attrs: { rel: 'canonical', href: canonical.href } },
        ],
      };
    },
  };
}

import { expect, it, vi } from 'vitest';
import { createAnalytics } from '@/services/analytics/adapter';
import { sanitizeEvent, type AnalyticsRecord } from '@/services/analytics/contract';
import { createEventBus } from '@/core/events';
import data from '@/content/briefings/2026-10-31-lower-value.json';
import type { Briefing } from '@/core/types';
const briefing = data as Briefing;
it('drops unlisted properties, free text, URLs and unknown error codes', () => {
  expect(
    sanitizeEvent('cta_click', {
      ctaId: 'waitlist',
      destinationCategory: 'waitlist',
      email: 'a@b.c',
      url: 'https://secret.test',
      utm_campaign: 'ok',
      utm_source: 'a@b.c',
    }).properties,
  ).toEqual({ ctaId: 'waitlist', destinationCategory: 'waitlist', utm_campaign: 'ok' });
  expect(sanitizeEvent('app_error', { code: 'secret', message: 'personal' }).properties).toEqual(
    {},
  );
});
it('guards landing/completion, ignores pause/resume and assigns a new run ID on retry', () => {
  const bus = createEventBus();
  const records: AnalyticsRecord[] = [];
  const analytics = createAnalytics({
    bus,
    briefing,
    attribution: {},
    transport: (e) => {
      records.push(e);
    },
    stats: () => ({ distance: 123, pickups: 2, hazards: 1, score: 4 }),
    deviceClass: 'desktop',
    getSessionStorage: () => {
      throw new Error('disabled');
    },
  });
  analytics.landing();
  analytics.landing();
  bus.emit({ type: 'runStart', t: 0 });
  bus.emit({ type: 'pause', t: 20 });
  bus.emit({ type: 'resume', t: 20 });
  bus.emit({ type: 'runComplete', score: 4, t: 60 });
  bus.emit({ type: 'runComplete', score: 4, t: 60 });
  bus.emit({ type: 'restart', t: 0, sourceScreen: 'results', priorComplete: true });
  bus.emit({ type: 'runStart', t: 0 });
  bus.emit({ type: 'runComplete', score: 4, t: 60 });
  expect(records.filter((e) => e.name === 'landing_view')).toHaveLength(1);
  const completed = records.filter((e) => e.name === 'run_complete');
  expect(completed).toHaveLength(2);
  expect(completed[0]?.properties.runId).not.toBe(completed[1]?.properties.runId);
  expect(completed[0]?.properties).toMatchObject({ distance: 123, pickups: 2, hazards: 1 });
  analytics.dispose();
});
it('contains synchronous and asynchronous transport failures', async () => {
  for (const transport of [
    vi.fn(() => {
      throw new Error('blocked');
    }),
    vi.fn(() => Promise.reject('blocked')),
  ]) {
    const bus = createEventBus();
    const analytics = createAnalytics({
      bus,
      briefing,
      attribution: {},
      transport,
      stats: () => ({ distance: 0, pickups: 0, hazards: 0, score: 0 }),
      deviceClass: 'mobile',
    });
    expect(() => analytics.landing()).not.toThrow();
    expect(() =>
      bus.emit({ type: 'ctaClick', ctaId: 'join', destinationCategory: 'waitlist' }),
    ).not.toThrow();
    await Promise.resolve();
  }
});

import { expect, it, vi } from 'vitest';
import { buildShareUrl, shareBriefing } from '@/services/share';
import data from '@/content/briefings/2026-10-31-lower-value.json';
import type { Briefing } from '@/core/types';
const briefing = data as Briefing;
const href = 'https://example.test/game/?email=private&score=99#secret';
it('shares only briefing and method attribution', () => {
  expect(buildShareUrl(href, 'briefing', 'native')).toBe(
    'https://example.test/game/?b=briefing&utm_source=share&utm_medium=native',
  );
});
it('silently handles native cancellation without copying', async () => {
  const copy = vi.fn();
  const emit = vi.fn();
  const result = await shareBriefing(briefing, emit, {
    href,
    copy,
    share: async () => {
      throw { name: 'AbortError' };
    },
  });
  expect(result.cancelled).toBe(true);
  expect(copy).not.toHaveBeenCalled();
  expect(emit).toHaveBeenCalledExactlyOnceWith('native');
});
it('falls through failed native and clipboard APIs to manual', async () => {
  const emit = vi.fn();
  const result = await shareBriefing(briefing, emit, {
    href,
    share: async () => {
      throw new Error('blocked');
    },
    copy: async () => {
      throw new Error('denied');
    },
  });
  expect(result.method).toBe('manual');
  expect(emit.mock.calls).toEqual([['native'], ['manual']]);
});
it('copies and tolerates analytics failure', async () => {
  const copy = vi.fn().mockResolvedValue(undefined);
  const result = await shareBriefing(
    briefing,
    () => {
      throw new Error();
    },
    { href, copy },
  );
  expect(result.method).toBe('copy');
  expect(copy).toHaveBeenCalledWith(result.url);
});

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createStorage } from '@/services/storage';
describe('storage', () => {
  it('falls back when storage access throws and preserves scores/preferences', () => {
    const storage = createStorage(() => {
      throw new Error('disabled');
    });
    expect(storage.submitScore('b', 1, 1, 10)).toEqual({ best: 10, isNewBest: true });
    expect(storage.submitScore('b', 1, 1, 5)).toEqual({ best: 10, isNewBest: false });
    expect(storage.getBest('b', 2, 1)).toBeNull();
    expect(storage.getBest('b', 1, 2)).toBeNull();
    storage.setPrefs({ muted: false, reducedMotion: true });
    expect(storage.getPrefs()).toEqual({ muted: false, reducedMotion: true });
  });
  it('handles corrupt JSON, invalid scores and quota failures', () => {
    localStorage.clear();
    localStorage.setItem('cc:v1:prefs', '{');
    localStorage.setItem('cc:v1:best:b:1:1', '{}');
    const storage = createStorage();
    expect(storage.getPrefs()).toEqual({ muted: true });
    expect(storage.getBest('b', 1, 1)).toBeNull();
    expect(storage.submitScore('b', 1, 1, NaN).isNewBest).toBe(false);
    const limited = createStorage(
      () =>
        ({
          getItem: () => null,
          removeItem: () => {},
          setItem: () => {
            throw new Error('quota');
          },
        }) as unknown as Storage,
    );
    limited.submitScore('b', 1, 1, 42);
    expect(limited.getBest('b', 1, 1)).toBe(42);
  });
});

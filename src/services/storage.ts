/** Storage access is optional; memory remains authoritative if a browser write fails. */
export function createSafeStore(getBackend: () => Storage | undefined) {
  const memory = new Map<string, string>();
  let backend: Storage | undefined;
  try {
    backend = getBackend();
    backend?.setItem('cc:v1:probe', '1');
    backend?.removeItem('cc:v1:probe');
  } catch {
    backend = undefined;
  }
  return {
    get(key: string): string | null {
      if (memory.has(key)) return memory.get(key)!;
      try {
        return backend?.getItem(key) ?? null;
      } catch {
        backend = undefined;
        return null;
      }
    },
    set(key: string, value: string) {
      memory.set(key, value);
      try {
        backend?.setItem(key, value);
      } catch {
        backend = undefined;
      }
    },
  };
}
export interface Preferences {
  muted: boolean;
  reducedMotion?: boolean;
}
export function createStorage(getBackend = () => globalThis.localStorage) {
  const store = createSafeStore(getBackend);
  const bestKey = (id: string, course: number, scoring: number) =>
    `cc:v1:best:${encodeURIComponent(id)}:${course}:${scoring}`;
  const getBest = (id: string, course: number, scoring: number): number | null => {
    const raw = store.get(bestKey(id, course, scoring));
    if (raw === null) return null;
    try {
      const value: unknown = JSON.parse(raw);
      return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
    } catch {
      return null;
    }
  };
  const getPrefs = (): Preferences => {
    try {
      const value = JSON.parse(store.get('cc:v1:prefs') ?? '{}');
      return {
        muted: typeof value?.muted === 'boolean' ? value.muted : true,
        ...(typeof value?.reducedMotion === 'boolean'
          ? { reducedMotion: value.reducedMotion }
          : {}),
      };
    } catch {
      return { muted: true };
    }
  };
  return {
    getBest,
    getPrefs,
    submitScore(id: string, course: number, scoring: number, score: number) {
      const previous = getBest(id, course, scoring);
      if (!Number.isSafeInteger(score) || score < 0) return { best: previous, isNewBest: false };
      const isNewBest = previous === null || score > previous;
      const best = Math.max(previous ?? 0, score);
      store.set(bestKey(id, course, scoring), JSON.stringify(best));
      return { best, isNewBest };
    },
    setPrefs(prefs: Partial<Preferences>) {
      store.set('cc:v1:prefs', JSON.stringify({ ...getPrefs(), ...prefs }));
    },
  };
}
export type GameStorage = ReturnType<typeof createStorage>;

/** One page-scoped fallback shared by UI and renderer. */
export const gameStorage = createStorage();

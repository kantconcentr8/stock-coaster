export type OrientationMode = 'portrait' | 'landscape';

export interface LayoutRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface LayoutMetrics {
  readonly width: number;
  readonly height: number;
  readonly orientation: OrientationMode;
  readonly dpr: number;
  readonly hudBandHeight: number;
  readonly controlsBandHeight: number;
  readonly trackRegion: LayoutRegion;
}

export interface LayoutManager {
  readonly current: LayoutMetrics;
  onChange(fn: (metrics: LayoutMetrics) => void): () => void;
  recompute(): LayoutMetrics;
  destroy(): void;
}

export function computeLayoutMetrics(
  viewportWidth: number,
  viewportHeight: number,
  rawDpr = 1,
  coarsePointer = false,
  safeTop = 0,
): LayoutMetrics {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  const orientation: OrientationMode = height >= width ? 'portrait' : 'landscape';
  const dpr = Math.min(Math.max(1, rawDpr || 1), 2);
  const hudBandHeight = 144 + Math.max(0, safeTop);

  // Portrait reserves bottom 24% (clamped 120..210px) when touch/coarse or narrow; landscape splits controls on sides
  const showBottomBand = orientation === 'portrait' && (coarsePointer || width <= 768);
  const controlsBandHeight = showBottomBand
    ? Math.round(Math.min(210, Math.max(120, height * 0.24)))
    : 0;

  const trackTop = hudBandHeight;
  const trackHeight = Math.max(120, height - hudBandHeight - controlsBandHeight);

  return {
    width,
    height,
    orientation,
    dpr,
    hudBandHeight,
    controlsBandHeight,
    trackRegion: {
      top: trackTop,
      left: 0,
      width,
      height: trackHeight,
    },
  };
}

export function createLayoutManager(targetWindow: Window = window): LayoutManager {
  const listeners = new Set<(m: LayoutMetrics) => void>();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const readMetrics = (): LayoutMetrics => {
    const vv = targetWindow.visualViewport;
    const w = vv ? vv.width : targetWindow.innerWidth;
    const h = vv ? vv.height : targetWindow.innerHeight;
    const coarse =
      typeof targetWindow.matchMedia === 'function' &&
      targetWindow.matchMedia('(pointer: coarse)').matches;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;pointer-events:none;height:var(--safe-top, 0px)';
    document.body.append(probe);
    const safeTop = probe.getBoundingClientRect().height;
    probe.remove();
    return computeLayoutMetrics(w, h, targetWindow.devicePixelRatio, coarse, safeTop);
  };

  let current = readMetrics();

  const applyRootAttributes = (m: LayoutMetrics) => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.orientation = m.orientation;
    document.documentElement.style.setProperty('--hud-band', `${m.hudBandHeight}px`);
    document.documentElement.style.setProperty('--controls-band', `${m.controlsBandHeight}px`);
  };

  applyRootAttributes(current);

  const recompute = (): LayoutMetrics => {
    current = readMetrics();
    applyRootAttributes(current);
    for (const fn of [...listeners]) {
      fn(current);
    }
    return current;
  };

  const scheduleRecompute = () => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      recompute();
    }, 100);
  };

  targetWindow.addEventListener('resize', scheduleRecompute);
  targetWindow.addEventListener('orientationchange', scheduleRecompute);
  targetWindow.visualViewport?.addEventListener('resize', scheduleRecompute);

  return {
    get current() {
      return current;
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    recompute,
    destroy() {
      if (debounceTimer !== null) clearTimeout(debounceTimer);
      targetWindow.removeEventListener('resize', scheduleRecompute);
      targetWindow.removeEventListener('orientationchange', scheduleRecompute);
      targetWindow.visualViewport?.removeEventListener('resize', scheduleRecompute);
      listeners.clear();
    },
  };
}

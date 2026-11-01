export interface Effects {
  readonly reducedMotion: boolean;
  setReducedMotion(enabled: boolean): void;
  triggerHazardNudge(): void;
  sampleOffset(nowMs?: number): { x: number; y: number };
}

/**
 * Screen-nudge effect on hazard hit. Respects `reducedMotion` (disables screen shake).
 */
export function createEffects(initialReducedMotion = false): Effects {
  let reducedMotion = initialReducedMotion;
  let nudgeUntil = 0;

  return {
    get reducedMotion() {
      return reducedMotion;
    },
    setReducedMotion(enabled) {
      reducedMotion = enabled;
    },
    triggerHazardNudge() {
      if (reducedMotion) return;
      nudgeUntil = performance.now() + 160;
    },
    sampleOffset(nowMs = performance.now()) {
      if (reducedMotion || nowMs >= nudgeUntil) return { x: 0, y: 0 };
      const rem = (nudgeUntil - nowMs) / 160;
      const amp = 6 * rem;
      return {
        x: Math.sin(nowMs * 0.08) * amp,
        y: Math.cos(nowMs * 0.11) * amp,
      };
    },
  };
}

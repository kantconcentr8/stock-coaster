import { TUNING, type Tuning } from '@/config/tuning';
import type { SimState } from '@/core/types';
import type { Track } from '@/sim/track';
import { el } from './dom';

export interface DebugOverlay {
  readonly root: HTMLElement;
  update(
    state: SimState,
    track: Track,
    visibleAheadSeconds: number,
    frameSeconds: number,
    stepsTaken: number,
  ): void;
}

const SLIDERS: { key: keyof Tuning; label: string; min: number; max: number; step: number }[] = [
  { key: 'vCruise', label: 'vCruise', min: 140, max: 320, step: 5 },
  { key: 'vMax', label: 'vMax', min: 220, max: 420, step: 5 },
  { key: 'vMaxBoost', label: 'vMaxBoost', min: 300, max: 550, step: 5 },
  { key: 'gravityK', label: 'gravityK', min: 60, max: 320, step: 5 },
  { key: 'boostAccel', label: 'boostAccel', min: 60, max: 320, step: 5 },
  { key: 'brakeDecel', label: 'brakeDecel', min: 80, max: 380, step: 5 },
  { key: 'laneChangeSeconds', label: 'laneChange (s)', min: 0.1, max: 0.5, step: 0.02 },
];

export function createDebugOverlay(): DebugOverlay {
  const statsPre = el('pre', { class: 'debug-readout', text: '' });
  const controls = el('div', { class: 'debug-sliders' });

  const mutable = TUNING as Record<string, number>;
  for (const cfg of SLIDERS) {
    const valSpan = el('span', { text: String(TUNING[cfg.key]) });
    const input = el('input', {
      type: 'range',
      min: String(cfg.min),
      max: String(cfg.max),
      step: String(cfg.step),
      value: String(TUNING[cfg.key]),
    }) as HTMLInputElement;
    input.addEventListener('input', () => {
      const v = Number(input.value);
      mutable[cfg.key] = v;
      valSpan.textContent = String(v);
    });
    controls.append(
      el('label', { class: 'debug-row' }, [el('span', { text: `${cfg.label}: ` }), valSpan, input]),
    );
  }

  const root = el('aside', { id: 'debug-overlay', class: 'debug-overlay' }, [
    el('strong', { text: 'DEBUG TUNING (?debug=1)' }),
    statsPre,
    controls,
  ]);

  let totalSteps = 0;
  let fpsSmooth = 60;

  return {
    root,
    update(state, track, visibleAheadSeconds, frameSeconds, stepsTaken) {
      totalSteps += stepsTaken;
      if (frameSeconds > 0) {
        const inst = 1 / frameSeconds;
        fpsSmooth = fpsSmooth * 0.9 + inst * 0.1;
      }
      const deg = (track.sample(state.kart.s).angle * 180) / Math.PI;
      statsPre.textContent =
        `FPS: ${fpsSmooth.toFixed(0)} | steps: ${totalSteps}\n` +
        `speed: ${state.kart.speed.toFixed(1)} wu/s | slope: ${deg.toFixed(1)}°\n` +
        `boost: ${state.kart.boost.toFixed(0)} | preview: ${visibleAheadSeconds.toFixed(2)}s\n` +
        `s: ${state.kart.s.toFixed(0)} / ${track.length.toFixed(0)} wu`;
    },
  };
}

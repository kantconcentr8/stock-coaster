import { TUNING } from '@/config/tuning';
import type { SimState } from '@/core/types';
import { el } from './dom';

export interface Hud {
  readonly root: HTMLElement;
  readonly pauseBtn: HTMLButtonElement;
  update(state: SimState, activeTime: number): void;
  setVisible(visible: boolean): void;
}

export function createHud(onPause?: () => void): Hud {
  const timeVal = el('span', { class: 'hud-value', text: '60.0s' });
  const scoreVal = el('span', { class: 'hud-value', text: '0' });
  const boostFill = el('div', { class: 'hud-boost-fill' });
  const boostBar = el(
    'div',
    {
      class: 'hud-boost-bar',
      role: 'progressbar',
      'aria-label': 'Boost meter',
      'aria-valuemin': '0',
      'aria-valuemax': String(TUNING.boostCapacity),
      'aria-valuenow': String(TUNING.boostStart),
    },
    [boostFill],
  );

  const pauseBtn = el('button', {
    id: 'btn-hud-pause',
    type: 'button',
    class: 'hud-pause-btn',
    'aria-label': 'Pause',
    text: '❚❚',
  }) as HTMLButtonElement;

  pauseBtn.addEventListener('click', () => onPause?.());

  const root = el('header', { id: 'hud', class: 'hud', hidden: '' }, [
    el('div', { class: 'hud-item' }, [el('span', { class: 'hud-label', text: 'Time' }), timeVal]),
    el('div', { class: 'hud-item' }, [el('span', { class: 'hud-label', text: 'Score' }), scoreVal]),
    el('div', { class: 'hud-item hud-boost' }, [
      el('span', { class: 'hud-label', text: 'Boost' }),
      boostBar,
    ]),
    pauseBtn,
  ]);

  let lastTimeStr = '';
  let lastScore = -1;
  let lastBoostPct = -1;

  return {
    root,
    pauseBtn,
    update(state, activeTime) {
      const rem = Math.max(0, TUNING.RUN_SECONDS - activeTime);
      const timeStr = `${rem.toFixed(1)}s`;
      if (timeStr !== lastTimeStr) {
        timeVal.textContent = timeStr;
        lastTimeStr = timeStr;
      }
      if (state.stats.score !== lastScore) {
        scoreVal.textContent = String(state.stats.score);
        lastScore = state.stats.score;
      }
      const pct = Math.max(0, Math.min(1, state.kart.boost / TUNING.boostCapacity));
      const pctRound = Math.round(pct * 100);
      if (pctRound !== lastBoostPct) {
        boostFill.style.transform = `scaleX(${pct.toFixed(3)})`;
        boostBar.setAttribute('aria-valuenow', String(Math.round(state.kart.boost)));
        lastBoostPct = pctRound;
      }
    },
    setVisible(visible) {
      if (visible) root.removeAttribute('hidden');
      else root.setAttribute('hidden', '');
    },
  };
}

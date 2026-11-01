import type { RunStats } from '@/core/types';
import { scoreBreakdown } from '@/sim/scoring';
import { el } from '../dom';

export interface ResultsScreen {
  readonly root: HTMLElement;
  show(stats: RunStats): void;
  hide(): void;
}

export function createResultsScreen(onRetry: () => void): ResultsScreen {
  const scoreEl = el('strong', { id: 'res-score', text: '0' });
  const distEl = el('span', { id: 'res-distance', text: '0 wu' });
  const pickupsEl = el('span', { id: 'res-pickups', text: '0' });
  const hazardsEl = el('span', { id: 'res-hazards', text: '0' });

  const retryBtn = el('button', {
    id: 'btn-retry',
    type: 'button',
    class: 'btn-primary',
    text: 'Retry (R)',
  }) as HTMLButtonElement;

  retryBtn.addEventListener('click', () => onRetry());

  const root = el('section', { id: 'screen-results', class: 'screen modal-card', hidden: '' }, [
    el('h1', { text: 'Run Complete' }),
    el('p', { class: 'results-score' }, ['Score: ', scoreEl]),
    el('ul', { class: 'results-stats' }, [
      el('li', {}, ['Distance: ', distEl]),
      el('li', {}, ['Pickups collected: ', pickupsEl]),
      el('li', {}, ['Hazards hit: ', hazardsEl]),
    ]),
    retryBtn,
  ]);

  return {
    root,
    show(stats) {
      const breakdown = scoreBreakdown(stats);
      scoreEl.textContent = String(breakdown.total);
      distEl.textContent = `${Math.round(stats.distance)} wu (+${breakdown.distancePoints} pts)`;
      pickupsEl.textContent = `${stats.pickups} (+${breakdown.pickupPoints} pts)`;
      hazardsEl.textContent = String(stats.hazards);
      root.removeAttribute('hidden');
      queueMicrotask(() => retryBtn.focus());
    },
    hide() {
      root.setAttribute('hidden', '');
    },
  };
}

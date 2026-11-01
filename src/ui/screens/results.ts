import { createLearningQuestion } from './learningQuestion';
import { isHttps } from '../../content/schema';
import type { GameStorage } from '@/services/storage';
import { SCORING_VERSION } from '@/config/tuning';
import { shareBriefing, type ShareMethod } from '@/services/share';
import type { Briefing, RunStats } from '@/core/types';
import { scoreBreakdown } from '@/sim/scoring';
import { el } from '../dom';

export interface ResultsScreen {
  readonly root: HTMLElement;
  show(stats: RunStats): void;
  hide(): void;
}

export function createResultsScreen(
  onRetry: () => void,
  options?: {
    briefing: Briefing;
    storage?: GameStorage;
    ctaUrl?: string;
    onCta?: () => void;
    onShare?: (method: ShareMethod) => void;
    onRead: () => void;
    onAnswer: (questionId: string, correct: boolean) => void;
  },
): ResultsScreen {
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
    el('p', { class: 'results-score' }, ['Arcade score: ', scoreEl]),
    el('ul', { class: 'results-stats' }, [
      el('li', {}, ['Distance: ', distEl]),
      el('li', {}, ['Pickups collected: ', pickupsEl]),
      el('li', {}, ['Hazards hit: ', hazardsEl]),
    ]),
    retryBtn,
  ]);

  const question = options?.briefing.learningQuestion;
  const learning = question
    ? createLearningQuestion(question, (correct) => options?.onAnswer(question.id, correct))
    : undefined;
  if (options) {
    const takeaways = el('section', { id: 'takeaways' }, [
      el('h2', { text: 'Briefing takeaways' }),
      ...options.briefing.takeaways.map((t) =>
        el('article', { class: 'takeaway' }, [
          el('strong', { class: 'classification', text: `? ${t.label}` }),
          el('p', { text: t.text }),
        ]),
      ),
    ]);
    root.insertBefore(el('p', { id: 'local-best', hidden: '', text: 'Local best' }), retryBtn);
    root.insertBefore(takeaways, retryBtn);
    if (learning) root.insertBefore(learning.root, retryBtn);
    const cta = options.briefing.cta;
    if (isHttps(cta.url))
      root.insertBefore(
        el('a', {
          id: 'briefing-cta',
          class: 'btn-primary',
          href: options.ctaUrl ?? cta.url,
          rel: 'noopener',
          text: cta.label,
        }),
        retryBtn,
      );
    root.querySelector('#briefing-cta')?.addEventListener('click', () => options.onCta?.());
    const share = el('button', {
      type: 'button',
      id: 'btn-share',
      text: 'Share briefing',
    }) as HTMLButtonElement;
    const status = el('p', { role: 'status' });
    const manual = el('input', {
      type: 'text',
      readonly: '',
      hidden: '',
      'aria-label': 'Briefing share link',
    }) as HTMLInputElement;
    share.addEventListener('click', async () => {
      share.disabled = true;
      manual.hidden = true;
      status.textContent = '';
      try {
        const result = await shareBriefing(options.briefing, (method) => options.onShare?.(method));
        if (result.method === 'manual') {
          manual.value = result.url;
          manual.hidden = false;
          manual.focus();
          manual.select();
          status.textContent = 'Copy this briefing link.';
        } else if (result.method === 'copy') status.textContent = 'Briefing link copied.';
      } finally {
        share.disabled = false;
      }
    });
    root.append(share, status, manual);
    const read = el('button', {
      type: 'button',
      class: 'btn-secondary',
      text: 'Read full briefing',
    });
    read.addEventListener('click', options.onRead);
    root.append(read);
    root.append(el('p', { text: options.briefing.disclaimer }));
  }
  return {
    root,
    show(stats) {
      learning?.reset();
      if (options?.storage) {
        const best = options.storage.submitScore(
          options.briefing.briefingId,
          options.briefing.courseVersion,
          SCORING_VERSION,
          scoreBreakdown(stats).total,
        );
        const slot = root.querySelector<HTMLElement>('#local-best');
        if (slot) {
          slot.hidden = false;
          slot.textContent = `Your best: ${best.best}${best.isNewBest ? ' - New best!' : ''}`;
        }
      }
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

import { brandMark } from '@/ui/brand';
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

  const root = el(
    'section',
    { id: 'screen-results', class: 'screen modal-card results-card', hidden: '' },
    [
      el('div', { class: 'brand-lockup' }, [brandMark(), el('h1', { text: 'Run Complete' })]),
      el('p', { class: 'results-score' }, ['Arcade score: ', scoreEl]),
      el('ul', { class: 'results-stats' }, [
        el('li', {}, ['Distance: ', distEl]),
        el('li', {}, ['Pickups collected: ', pickupsEl]),
        el('li', {}, ['Hazards hit: ', hazardsEl]),
      ]),
      retryBtn,
    ],
  );

  const question = options?.briefing.learningQuestion;
  const learning = question
    ? createLearningQuestion(question, (correct) => options?.onAnswer(question.id, correct))
    : undefined;
  if (options) {
    const takeaways = el('section', { id: 'takeaways' }, [
      el('h2', { text: 'Briefing takeaways' }),
      ...options.briefing.takeaways.map((t) =>
        el('article', { class: 'takeaway' }, [
          el('strong', { class: 'classification', text: t.label }),
          el('p', { text: t.text.split('TODO(owner):')[0]!.trim() }),
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
      class: 'btn-secondary',
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
    const disclaimer = options.briefing.disclaimer.split('TODO(owner):')[0]!.trim();
    const notes = [options.briefing.disclaimer, ...options.briefing.takeaways.map((t) => t.text)]
      .filter((text) => text.includes('TODO(owner):'))
      .map((text) => text.slice(text.indexOf('TODO(owner):') + 'TODO(owner):'.length).trim());
    const content = el(
      'div',
      {
        class: 'results-content',
        tabindex: '0',
        'aria-label': 'Briefing takeaways and optional question',
      },
      [takeaways],
    );
    if (learning) content.append(learning.root);
    content.append(el('p', { class: 'results-disclaimer', text: disclaimer }));
    if (!options.briefing.approval.approved) {
      const draft = el('details', { class: 'results-draft' }, [
        el('summary', { text: 'Editorial draft - review pending' }),
        ...notes.map((text) => el('p', { text })),
      ]);
      content.append(draft);
    }
    const actions = el('footer', { class: 'results-actions', 'aria-label': 'Run actions' });
    const ctaLink = root.querySelector('#briefing-cta');
    if (ctaLink) actions.append(ctaLink);
    actions.append(
      el('div', { class: 'results-secondary-actions' }, [retryBtn, share, read]),
      status,
      manual,
    );
    const header = el('header', { class: 'results-header' });
    for (const child of [...root.children]) header.append(child);
    // Content and actions were moved above; only the score summary remains in the header.
    root.replaceChildren(header, content, actions);
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
      const content = root.querySelector('.results-content');
      if (content) content.scrollTop = 0;
      root.scrollTop = 0;
      queueMicrotask(() => retryBtn.focus({ preventScroll: true }));
    },
    hide() {
      root.setAttribute('hidden', '');
    },
  };
}

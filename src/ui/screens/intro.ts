import { brandMark } from '@/ui/brand';
import type { Briefing } from '../../core/types';
import type { BriefingNotice } from '../../content/loader';
import { formatCoverage } from '../format';
import { el } from '../dom';
import type { GameStorage } from '@/services/storage';

export interface IntroScreen {
  readonly root: HTMLElement;
  setReady(ready: boolean): void;
  show(): void;
  hide(): void;
}

export function createIntroScreen(
  onStart: () => void,
  options?: {
    briefing: Briefing;
    storage?: GameStorage;
    notice?: BriefingNotice;
    onSound?: (muted: boolean) => void;
    onRead: () => void;
  },
): IntroScreen {
  const startBtn = el('button', {
    id: 'btn-start',
    type: 'button',
    class: 'btn-primary',
    text: 'Start Run',
  }) as HTMLButtonElement;

  startBtn.addEventListener('click', () => onStart());

  const root = el('section', { id: 'screen-intro', class: 'screen modal-card' }, [
    el('div', { class: 'brand-lockup' }, [
      brandMark(),
      el('span', { text: options?.briefing.brandName ?? 'Candlestick Coaster' }),
    ]),
    el('h1', { text: options?.briefing.title ?? 'Candlestick Coaster' }),
    el('p', {
      class: 'controls-hint',
      text:
        typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
          ? 'Tap Up/Down to switch rails; Hold Boost; Hold Brake'
          : 'Up/W & Down/S to switch rails; Hold Space to Boost; Hold Shift to Brake',
    }),
    startBtn,
  ]);

  if (options) {
    const { briefing, notice, onRead } = options;
    const read = el('button', {
      type: 'button',
      class: 'btn-secondary',
      text: 'Read the briefing',
    });
    read.addEventListener('click', onRead);
    const sound = el('input', { type: 'checkbox', id: 'sound-preference' }) as HTMLInputElement;
    sound.checked = !(options.storage?.getPrefs().muted ?? true);
    sound.addEventListener('change', () => {
      options.storage?.setPrefs({ muted: !sound.checked });
      options.onSound?.(!sound.checked);
    });
    const motion = el('input', { type: 'checkbox', id: 'motion-preference' }) as HTMLInputElement;
    motion.checked =
      options.storage?.getPrefs().reducedMotion ??
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
      false;
    motion.addEventListener('change', () => {
      options.storage?.setPrefs({ reducedMotion: motion.checked });
      window.dispatchEvent(new Event('cc-preferences'));
    });
    root.insertBefore(el('label', {}, [motion, ' Reduce motion']), startBtn);
    root.insertBefore(el('p', { text: formatCoverage(briefing) }), startBtn);
    root.insertBefore(el('p', { text: briefing.summary }), startBtn);
    root.insertBefore(el('label', {}, [sound, ' Sound (when available)']), startBtn);
    root.append(read);
    if (!briefing.approval.approved)
      root.prepend(el('p', { role: 'note', text: 'Editorial draft - awaiting owner approval.' }));
    if (notice)
      root.prepend(
        el('p', {
          role: 'status',
          text: `${notice === 'invalid-id' ? 'Invalid' : 'Unknown'} briefing link. Showing the default dated briefing.`,
        }),
      );
  }
  return {
    root,
    setReady(ready) {
      startBtn.disabled = !ready;
      startBtn.textContent = ready ? 'Start Run' : 'Loading game...';
    },
    show() {
      root.removeAttribute('hidden');
      queueMicrotask(() => startBtn.focus());
    },
    hide() {
      root.setAttribute('hidden', '');
    },
  };
}

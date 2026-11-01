import { el } from '../dom';

export interface CountdownScreen {
  readonly root: HTMLElement;
  update(secondsRemaining: number): void;
  show(): void;
  hide(): void;
}

export function createCountdownScreen(): CountdownScreen {
  const label = el('div', { class: 'countdown-number', 'aria-live': 'polite', text: '3' });
  const root = el(
    'section',
    { id: 'screen-countdown', class: 'screen countdown-overlay', hidden: '' },
    [label],
  );

  let lastText = '';

  return {
    root,
    update(secondsRemaining) {
      const n = Math.max(1, Math.ceil(secondsRemaining));
      const str = String(n);
      if (str !== lastText) {
        label.textContent = str;
        lastText = str;
      }
    },
    show() {
      lastText = '';
      root.removeAttribute('hidden');
    },
    hide() {
      root.setAttribute('hidden', '');
    },
  };
}

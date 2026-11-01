import { el } from '../dom';

export interface IntroScreen {
  readonly root: HTMLElement;
  show(): void;
  hide(): void;
}

export function createIntroScreen(onStart: () => void): IntroScreen {
  const startBtn = el('button', {
    id: 'btn-start',
    type: 'button',
    class: 'btn-primary',
    text: 'Start Run',
  }) as HTMLButtonElement;

  startBtn.addEventListener('click', () => onStart());

  const root = el('section', { id: 'screen-intro', class: 'screen modal-card' }, [
    el('h1', { text: 'Candlestick Coaster' }),
    el('p', {
      class: 'controls-hint',
      text: 'Controls: Up/W & Down/S to switch rails · Hold Space to Boost · Hold Shift to Brake',
    }),
    startBtn,
  ]);

  return {
    root,
    show() {
      root.removeAttribute('hidden');
      queueMicrotask(() => startBtn.focus());
    },
    hide() {
      root.setAttribute('hidden', '');
    },
  };
}

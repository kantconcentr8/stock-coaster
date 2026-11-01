import { el } from '../dom';

export interface PauseScreen {
  readonly root: HTMLElement;
  readonly isMuted: boolean;
  show(): void;
  hide(): void;
}

export interface PauseCallbacks {
  onResume: () => void;
  onRestart: () => void;
  onToggleSound?: (muted: boolean) => void;
  onExit: () => void;
}

/**
 * Pause dialog: Resume (focused), Restart, Sound toggle, Exit to intro.
 * Traps Tab focus inside while open; Escape triggers Resume.
 */
export function createPauseScreen(callbacks: PauseCallbacks): PauseScreen {
  let muted = false;

  const resumeBtn = el('button', {
    id: 'btn-pause-resume',
    type: 'button',
    class: 'btn-primary',
    text: 'Resume',
  }) as HTMLButtonElement;

  const restartBtn = el('button', {
    id: 'btn-pause-restart',
    type: 'button',
    class: 'btn-secondary',
    text: 'Restart Run',
  }) as HTMLButtonElement;

  const soundBtn = el('button', {
    id: 'btn-pause-sound',
    type: 'button',
    class: 'btn-secondary',
    'aria-pressed': 'false',
    text: 'Sound: On',
  }) as HTMLButtonElement;

  const exitBtn = el('button', {
    id: 'btn-pause-exit',
    type: 'button',
    class: 'btn-secondary',
    text: 'Exit to Intro',
  }) as HTMLButtonElement;

  const focusables = [resumeBtn, restartBtn, soundBtn, exitBtn];

  resumeBtn.addEventListener('click', () => callbacks.onResume());
  restartBtn.addEventListener('click', () => callbacks.onRestart());
  soundBtn.addEventListener('click', () => {
    muted = !muted;
    soundBtn.setAttribute('aria-pressed', String(muted));
    soundBtn.textContent = muted ? 'Sound: Muted' : 'Sound: On';
    callbacks.onToggleSound?.(muted);
  });
  exitBtn.addEventListener('click', () => callbacks.onExit());

  const root = el(
    'section',
    {
      id: 'screen-pause',
      class: 'screen modal-card pause-card',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'pause-title',
      hidden: '',
    },
    [
      el('h1', { id: 'pause-title', text: 'Game Paused' }),
      el('div', { class: 'pause-actions' }, focusables),
    ],
  );

  const onKeyDown = (ev: KeyboardEvent) => {
    if (root.hasAttribute('hidden')) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      callbacks.onResume();
      return;
    }
    if (ev.key === 'Tab') {
      const idx = focusables.indexOf(document.activeElement as HTMLButtonElement);
      if (ev.shiftKey) {
        if (idx <= 0) {
          ev.preventDefault();
          focusables[focusables.length - 1]!.focus();
        }
      } else {
        if (idx === focusables.length - 1) {
          ev.preventDefault();
          focusables[0]!.focus();
        }
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown);
  }

  return {
    root,
    get isMuted() {
      return muted;
    },
    show() {
      root.removeAttribute('hidden');
      queueMicrotask(() => resumeBtn.focus());
    },
    hide() {
      root.setAttribute('hidden', '');
    },
  };
}

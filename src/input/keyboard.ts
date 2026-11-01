import type { RunPhase } from '@/core/types';
import type { InputController } from './inputState';

export interface KeyboardOptions {
  /** True while the run is actively accepting gameplay controls (e.g. phase === 'running'). */
  isActive: () => boolean;
  getPhase?: () => RunPhase;
  onPause?: () => void;
  onRestart?: () => void;
}

/**
 * Attaches desktop keyboard controls:
 * - ArrowUp / W -> lane up (edge-triggered, ignores key repeat)
 * - ArrowDown / S -> lane down (edge-triggered, ignores key repeat)
 * - Space -> boost hold
 * - ShiftLeft / ShiftRight -> brake hold
 * - Escape -> onPause callback
 * - R -> onRestart callback (only when phase is 'results')
 * Calls preventDefault() ONLY for handled game keys while active (or R on results).
 */
export function attachKeyboard(
  target: Window | HTMLElement,
  input: InputController,
  options: KeyboardOptions | (() => boolean),
): () => void {
  const opts: KeyboardOptions = typeof options === 'function' ? { isActive: options } : options;

  const onKeyDown = (ev: Event) => {
    const e = ev as KeyboardEvent;
    const key = e.key;
    const code = e.code;

    if ((key === 'r' || key === 'R' || code === 'KeyR') && opts.getPhase?.() === 'results') {
      if (!e.repeat) {
        e.preventDefault();
        opts.onRestart?.();
      }
      return;
    }

    if (key === 'Escape' || code === 'Escape') {
      if (opts.isActive() && !e.repeat) {
        e.preventDefault();
        opts.onPause?.();
      }
      return;
    }

    if (!opts.isActive()) return;

    if (key === 'ArrowUp' || key === 'w' || key === 'W' || code === 'KeyW') {
      e.preventDefault();
      if (!e.repeat) input.pulseLane('up');
    } else if (key === 'ArrowDown' || key === 's' || key === 'S' || code === 'KeyS') {
      e.preventDefault();
      if (!e.repeat) input.pulseLane('down');
    } else if (key === ' ' || code === 'Space') {
      e.preventDefault();
      input.press('boost');
    } else if (key === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight') {
      e.preventDefault();
      input.press('brake');
    }
  };

  const onKeyUp = (ev: Event) => {
    const e = ev as KeyboardEvent;
    const key = e.key;
    const code = e.code;
    if (key === ' ' || code === 'Space') {
      input.release('boost');
    } else if (key === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight') {
      input.release('brake');
    }
  };

  const onBlur = () => {
    input.clearAll();
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);

  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
    target.removeEventListener('blur', onBlur);
  };
}

import type { HoldAction, InputController, LaneDir } from './inputState';
import type { TouchControlElements } from '@/ui/touchControls';

export interface TouchBindingOptions {
  isActive: () => boolean;
  targetWindow?: Window;
  onFirstTouch?: () => void;
}

/**
 * Binds Pointer Events to the four touch buttons:
 * - Tracks active pointers by `pointerId` per hold button (boost/brake) so multi-touch works cleanly.
 * - Uses `setPointerCapture` where available; releases on `pointerup`, `pointercancel`, `lostpointercapture`.
 * - Lane buttons pulse once per `pointerdown`.
 * - Global safety: `visibilitychange`, `blur`, and `orientationchange` call `input.clearAll()` and clear active pointer sets.
 */
export function attachTouch(
  controls: TouchControlElements,
  input: InputController,
  options: TouchBindingOptions | (() => boolean),
): { clearPointers: () => void; detach: () => void } {
  const opts: TouchBindingOptions = typeof options === 'function' ? { isActive: options } : options;
  const win = opts.targetWindow ?? window;

  const boostPointers = new Set<number>();
  const brakePointers = new Set<number>();

  const syncHolds = () => {
    if (boostPointers.size > 0 && opts.isActive()) input.press('boost');
    else input.release('boost');

    if (brakePointers.size > 0 && opts.isActive()) input.press('brake');
    else input.release('brake');

    controls.boostBtn.classList.toggle('is-held', boostPointers.size > 0);
    controls.brakeBtn.classList.toggle('is-held', brakePointers.size > 0);
  };

  const clearPointers = () => {
    boostPointers.clear();
    brakePointers.clear();
    controls.boostBtn.classList.remove('is-held');
    controls.brakeBtn.classList.remove('is-held');
    input.clearAll();
  };

  const bindLaneButton = (btn: HTMLButtonElement, dir: LaneDir) => {
    const onDown = (ev: PointerEvent) => {
      opts.onFirstTouch?.();
      if (!opts.isActive()) return;
      ev.preventDefault();
      input.pulseLane(dir);
    };
    btn.addEventListener('pointerdown', onDown);
    return () => btn.removeEventListener('pointerdown', onDown);
  };

  const bindHoldButton = (btn: HTMLButtonElement, action: HoldAction, set: Set<number>) => {
    const onDown = (ev: PointerEvent) => {
      opts.onFirstTouch?.();
      if (!opts.isActive()) return;
      ev.preventDefault();
      try {
        btn.setPointerCapture?.(ev.pointerId);
      } catch {
        // Ignore in synthetic test environments where pointerId is not active
      }
      set.add(ev.pointerId);
      syncHolds();
    };

    const onRelease = (ev: PointerEvent) => {
      if (set.delete(ev.pointerId)) {
        syncHolds();
      }
      if (action === 'boost' && set.size === 0) input.release('boost');
      if (action === 'brake' && set.size === 0) input.release('brake');
    };

    btn.addEventListener('pointerdown', onDown);
    btn.addEventListener('pointerup', onRelease);
    btn.addEventListener('pointercancel', onRelease);
    btn.addEventListener('lostpointercapture', onRelease);

    return () => {
      btn.removeEventListener('pointerdown', onDown);
      btn.removeEventListener('pointerup', onRelease);
      btn.removeEventListener('pointercancel', onRelease);
      btn.removeEventListener('lostpointercapture', onRelease);
    };
  };

  const unUp = bindLaneButton(controls.upBtn, 'up');
  const unDown = bindLaneButton(controls.downBtn, 'down');
  const unBoost = bindHoldButton(controls.boostBtn, 'boost', boostPointers);
  const unBrake = bindHoldButton(controls.brakeBtn, 'brake', brakePointers);

  const onFirstPointerDown = (ev: PointerEvent) => {
    if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
      opts.onFirstTouch?.();
    }
  };

  const onVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      clearPointers();
    }
  };

  win.addEventListener('pointerdown', onFirstPointerDown, { passive: true });
  win.addEventListener('blur', clearPointers);
  win.addEventListener('orientationchange', clearPointers);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  return {
    clearPointers,
    detach() {
      unUp();
      unDown();
      unBoost();
      unBrake();
      win.removeEventListener('pointerdown', onFirstPointerDown);
      win.removeEventListener('blur', clearPointers);
      win.removeEventListener('orientationchange', clearPointers);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
      clearPointers();
    },
  };
}

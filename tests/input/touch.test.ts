// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createInput } from '@/input/inputState';
import { attachTouch } from '@/input/touch';
import { createTouchControls } from '@/ui/touchControls';

function makePointerEvent(type: string, pointerId: number): PointerEvent {
  const ev = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
  Object.defineProperty(ev, 'pointerId', { value: pointerId });
  Object.defineProperty(ev, 'pointerType', { value: 'touch' });
  return ev;
}

describe('touch controls', () => {
  it('supports simultaneous boost hold and lane tap; pointercancel clears boost', () => {
    const input = createInput();
    const controls = createTouchControls();
    const binding = attachTouch(controls, input, () => true);

    // Thumb 1 holds boost (pointerId = 1)
    controls.boostBtn.dispatchEvent(makePointerEvent('pointerdown', 1));
    expect(input.state.boost).toBe(true);

    // Thumb 2 taps lane up (pointerId = 2) while boost remains held
    controls.upBtn.dispatchEvent(makePointerEvent('pointerdown', 2));
    controls.upBtn.dispatchEvent(makePointerEvent('pointerup', 2));
    expect(input.state.boost).toBe(true);
    expect(input.state.laneUp).toBe(1);

    // Pointer cancel on thumb 1 clears boost hold
    controls.boostBtn.dispatchEvent(makePointerEvent('pointercancel', 1));
    expect(input.state.boost).toBe(false);

    binding.detach();
  });

  it('clears all held inputs on orientationchange and blur', () => {
    const input = createInput();
    const controls = createTouchControls();
    const binding = attachTouch(controls, input, () => true);

    controls.brakeBtn.dispatchEvent(makePointerEvent('pointerdown', 5));
    expect(input.state.brake).toBe(true);

    window.dispatchEvent(new Event('orientationchange'));
    expect(input.state.brake).toBe(false);

    binding.detach();
  });
});

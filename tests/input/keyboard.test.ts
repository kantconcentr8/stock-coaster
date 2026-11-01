// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createInput } from '@/input/inputState';
import { attachKeyboard } from '@/input/keyboard';

describe('keyboard input', () => {
  it('held key auto-repeat produces one lane pulse; blur clears holds', () => {
    const input = createInput();
    const detach = attachKeyboard(window, input, () => true);

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false, cancelable: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: true, cancelable: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', repeat: true, cancelable: true }),
    );

    expect(input.state.laneUp).toBe(1);

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', code: 'Space', cancelable: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft', cancelable: true }),
    );
    expect(input.state.boost).toBe(true);
    expect(input.state.brake).toBe(true);

    window.dispatchEvent(new Event('blur'));
    expect(input.state.boost).toBe(false);
    expect(input.state.brake).toBe(false);
    expect(input.state.laneUp).toBe(0);

    detach();
  });

  it('Space does not call preventDefault when inactive', () => {
    const input = createInput();
    let active = false;
    const detach = attachKeyboard(window, input, () => active);

    const inactiveSpace = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      cancelable: true,
    });
    window.dispatchEvent(inactiveSpace);
    expect(inactiveSpace.defaultPrevented).toBe(false);
    expect(input.state.boost).toBe(false);

    active = true;
    const activeSpace = new KeyboardEvent('keydown', { key: ' ', code: 'Space', cancelable: true });
    window.dispatchEvent(activeSpace);
    expect(activeSpace.defaultPrevented).toBe(true);
    expect(input.state.boost).toBe(true);

    detach();
  });

  it('fires R restart callback only when phase is results', () => {
    const input = createInput();
    let phase: 'running' | 'results' = 'running';
    const onRestart = vi.fn();
    const detach = attachKeyboard(window, input, {
      isActive: () => phase === 'running',
      getPhase: () => phase,
      onRestart,
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', cancelable: true }));
    expect(onRestart).not.toHaveBeenCalled();

    phase = 'results';
    const rEv = new KeyboardEvent('keydown', { key: 'r', cancelable: true });
    window.dispatchEvent(rEv);
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(rEv.defaultPrevented).toBe(true);

    detach();
  });
});

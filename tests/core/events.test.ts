import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';

describe('event bus', () => {
  it('delivers events and supports unsubscribe', () => {
    const bus = createEventBus();
    const fn = vi.fn();
    const off = bus.on('pause', fn);
    bus.emit({ type: 'pause', t: 1 });
    off();
    bus.emit({ type: 'pause', t: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('a throwing listener does not block others or the emitter', () => {
    const bus = createEventBus();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const after = vi.fn();
    bus.on('resume', () => {
      throw new Error('boom');
    });
    bus.on('resume', after);
    expect(() => bus.emit({ type: 'resume', t: 0 })).not.toThrow();
    expect(after).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

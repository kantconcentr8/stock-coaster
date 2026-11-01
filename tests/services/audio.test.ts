// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { createAudio } from '@/services/audio';
import { createEventBus } from '@/core/events';
import { createStorage } from '@/services/storage';
it('does not construct audio until an unmuted gesture and contains blocked audio', () => {
  const constructor = vi.fn(() => {
    throw new Error('blocked');
  });
  vi.stubGlobal('AudioContext', constructor);
  const storage = createStorage(() => {
    throw new Error('blocked');
  });
  const bus = createEventBus();
  const audio = createAudio(bus, storage);
  audio.unlock();
  expect(constructor).not.toHaveBeenCalled();
  expect(() => audio.setMuted(false)).not.toThrow();
  expect(constructor).toHaveBeenCalledTimes(1);
  expect(() => bus.emit({ type: 'pickup', objectId: 'p', t: 0 })).not.toThrow();
  audio.dispose();
  vi.unstubAllGlobals();
});
it('immediately stops active voices on pause and mute', () => {
  const stops = vi.fn();
  class Context {
    state = 'running';
    currentTime = 0;
    destination = {};
    createGain() {
      return {
        gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {},
      };
    }
    createOscillator() {
      return { frequency: { value: 0 }, connect() {}, disconnect() {}, start() {}, stop: stops };
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal('AudioContext', Context);
  const storage = createStorage(() => {
    throw new Error();
  });
  storage.setPrefs({ muted: false });
  const bus = createEventBus();
  const audio = createAudio(bus, storage);
  audio.unlock();
  audio.update(true, true, 1);
  bus.emit({ type: 'pause', t: 1 });
  expect(stops).toHaveBeenCalledTimes(1);
  audio.update(true, true, 1);
  audio.setMuted(true);
  expect(stops).toHaveBeenCalledTimes(2);
  audio.dispose();
  vi.unstubAllGlobals();
});

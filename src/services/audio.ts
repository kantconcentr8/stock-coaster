import type { EventBus } from '@/core/events';
import type { GameStorage } from './storage';
/** Original synthesized effects: no network assets, autoplay or music dependency. */
export function createAudio(bus: EventBus, storage: GameStorage) {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  const voices = new Set<OscillatorNode>();
  let boost: OscillatorNode | undefined;
  let rail = 1;
  const stop = () => {
    for (const voice of voices) {
      try {
        voice.stop();
      } catch {
        /* already stopped */
      }
    }
    voices.clear();
    boost = undefined;
  };
  const tone = (frequency: number, duration: number, loop = false) => {
    if (!context || !master || context.state !== 'running' || storage.getPrefs().muted) return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = loop ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(loop ? 0.025 : 0.09, context.currentTime);
      if (!loop) gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(master);
      voices.add(oscillator);
      oscillator.onended = () => {
        voices.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start();
      if (!loop) oscillator.stop(context.currentTime + duration);
      return oscillator;
    } catch {
      return;
    }
  };
  const off = [
    bus.on('pickup', () => tone(880, 0.1)),
    bus.on('hazardHit', () => tone(110, 0.16)),
    bus.on('pause', stop),
    bus.on('restart', stop),
    bus.on('runComplete', () => {
      stop();
      tone(660, 0.5);
    }),
  ];
  const visibility = () => {
    if (document.hidden) stop();
  };
  document.addEventListener('visibilitychange', visibility);
  return {
    /** Call synchronously from Start/Resume/unmute gestures only. */
    unlock() {
      if (storage.getPrefs().muted) return;
      try {
        context ??= new AudioContext();
        if (!master) {
          master = context.createGain();
          master.gain.value = 0.65;
          master.connect(context.destination);
        }
        void context.resume().catch(() => {});
      } catch {
        /* unavailable audio never blocks the run */
      }
    },
    setMuted(muted: boolean) {
      storage.setPrefs({ muted });
      if (muted) stop();
      else this.unlock();
    },
    stop,
    update(running: boolean, boosting: boolean, currentRail: number) {
      if (!running || storage.getPrefs().muted) {
        stop();
        rail = currentRail;
        return;
      }
      if (currentRail !== rail) tone(440, 0.055);
      rail = currentRail;
      if (boosting && !boost) boost = tone(150, 0, true);
      if (!boosting && boost) {
        try {
          boost.stop();
        } catch {
          /* stopped */
        }
        voices.delete(boost);
        boost = undefined;
      }
    },
    dispose() {
      stop();
      off.forEach((unsubscribe) => unsubscribe());
      document.removeEventListener('visibilitychange', visibility);
      void context?.close().catch(() => {});
    },
  };
}

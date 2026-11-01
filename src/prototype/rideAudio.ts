/** Original synthesized passenger sound. Only gesture handlers call unlock. */
export function createRideAudio() {
  let muted = true;
  let audio: AudioContext | undefined,
    oscillator: OscillatorNode | undefined,
    gain: GainNode | undefined;
  function stop() {
    try {
      oscillator?.stop();
      oscillator?.disconnect();
      gain?.disconnect();
    } catch {
      /* stopped */
    }
    oscillator = undefined;
    gain = undefined;
  }
  function unlock() {
    if (muted) return;
    try {
      audio ??= new AudioContext();
      void audio.resume().catch(stop);
      if (!oscillator) {
        oscillator = audio.createOscillator();
        gain = audio.createGain();
        oscillator.type = 'triangle';
        gain.gain.value = 0.012;
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start();
      }
    } catch {
      stop();
    }
  }
  return {
    unlock,
    stop,
    toggle(playing: boolean) {
      muted = !muted;
      if (muted) stop();
      else if (playing) unlock();
      return muted;
    },
    update(time: number, speed: number) {
      if (!audio || !oscillator || !gain) return;
      oscillator.frequency.setTargetAtTime(55 + speed * 0.24, audio.currentTime, 0.12);
      gain.gain.setTargetAtTime(
        time < 7 ? 0.012 + Math.sin(time * 18) ** 8 * 0.018 : 0.012 + speed / 18000,
        audio.currentTime,
        0.08,
      );
    },
    dispose() {
      stop();
      void audio?.close().catch(() => {});
      audio = undefined;
    },
  };
}

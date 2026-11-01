import './prototype.css';
import { el } from '@/ui/dom';
import { createRideTrack } from './geometry';
import { drawMarketLabels, drawScenery } from './scenery';
import { drawRideTrack } from './track';
import { drawTrain } from './train';
import { createMarketBackdrop } from './marketBackdrop';

export function mountCoasterPrototype() {
  const root = el('main', {
    class: 'ride-prototype',
    'aria-label': 'Candlestick Coaster passenger prototype',
  });
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  root.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  const ctx = context;
  const title = el('header', { class: 'ride-top' }, [
    el('div', {}, [
      el('p', { class: 'ride-eyebrow', text: 'Candlestick Coaster / Passenger study 02' }),
      el('h1', { text: 'The market is a ride.' }),
    ]),
    el('a', { href: location.pathname, text: 'Back to current game' }),
  ]);
  const stage = el('div', { class: 'ride-stage', text: 'Ready to climb' });
  const ride = el('button', { type: 'button', text: 'Start ride' }) as HTMLButtonElement;
  const reset = el('button', {
    type: 'button',
    text: 'Replay',
    'aria-label': 'Replay the coaster sequence',
  }) as HTMLButtonElement;
  const sound = el('button', {
    type: 'button',
    text: 'Sound off',
    'aria-pressed': 'false',
  }) as HTMLButtonElement;
  const captionTitle = el('strong', { text: 'Experience the market.' });
  const captionText = el('span', { text: 'Take a seat for the climb, plunge and recovery.' });
  const caption = el(
    'div',
    { class: 'ride-caption', 'aria-live': 'polite', 'aria-atomic': 'true' },
    [captionTitle, captionText],
  );
  const progress = el('div', { class: 'ride-progress', 'aria-hidden': 'true' });
  root.append(
    title,
    stage,
    el('div', { class: 'ride-bottom' }, [
      el('div', {}, [
        caption,
        el('p', {
          class: 'ride-disclaimer',
          text: 'Illustrative track / Draft motion study / Not historical price data',
        }),
      ]),
      el('div', { class: 'ride-controls', 'aria-label': 'Ride controls' }, [ride, reset, sound]),
    ]),
    progress,
  );
  document.body.replaceChildren(root);
  const market = createMarketBackdrop(root);
  document.title = 'Experience the market | Candlestick Coaster';
  const track = createRideTrack();
  // Active seconds, track x, tangent speed: Hermite curves keep the pacing continuous.
  const cues = [
    [0, 620, 65],
    [7, 940, 24],
    [10, 1120, 40],
    [15, 1950, 500],
    [17, 2260, 150],
    [28, 3160, 0],
  ] as const;
  const path = cues.map(([t, x, v]) => ({ t, s: track.atX(x).s, v }));
  const start = path[0]!.s,
    finish = path.at(-1)!.s,
    duration = path.at(-1)!.t;
  let position = start,
    speed = 0,
    playing = false,
    time = 0,
    last = performance.now();
  let width = innerWidth,
    height = innerHeight;
  let cameraX = track.sample(start).x,
    cameraY = track.sample(start).y * 0.35 - 90;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let muted = true;
  let audio: AudioContext | undefined,
    oscillator: OscillatorNode | undefined,
    gain: GainNode | undefined;
  function silence() {
    try {
      oscillator?.stop();
      oscillator?.disconnect();
      gain?.disconnect();
    } catch {
      /* already stopped */
    }
    oscillator = undefined;
    gain = undefined;
  }
  function unlockAudio() {
    if (muted || !playing) return;
    try {
      audio ??= new AudioContext();
      void audio.resume().catch(silence);
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
      silence();
    } // Audio failure never interrupts the ride.
  }
  function updateButton() {
    ride.textContent = playing
      ? 'Pause ride'
      : time >= duration
        ? 'Ride again'
        : time > 0
          ? 'Resume ride'
          : 'Start ride';
    if (!playing) silence();
  }
  function restart() {
    position = start;
    speed = 0;
    time = 0;
    cameraX = track.sample(start).x;
    cameraY = track.sample(start).y * 0.35 - 90;
  }
  ride.onclick = () => {
    if (time >= duration) restart();
    playing = !playing;
    last = performance.now();
    updateButton();
    unlockAudio();
  };
  reset.onclick = () => {
    restart();
    playing = true;
    last = performance.now();
    updateButton();
    unlockAudio();
  };
  sound.onclick = () => {
    muted = !muted;
    sound.textContent = muted ? 'Sound off' : 'Sound on';
    sound.setAttribute('aria-pressed', String(!muted));
    if (muted) silence();
    else unlockAudio();
  };
  const pause = () => {
    playing = false;
    updateButton();
  };
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') pause();
  });
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  window.addEventListener('pagehide', () => {
    pause();
    void audio?.close().catch(() => {});
    audio = undefined;
  });
  const resize = () => {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  };
  resize();
  window.addEventListener('resize', resize);
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (playing) {
      time = Math.min(duration, time + dt);
      const index = Math.max(0, path.findIndex((cue) => cue.t >= time) - 1);
      const a = path[index]!,
        b = path[index + 1]!;
      const span = b.t - a.t,
        u = Math.min(1, (time - a.t) / span);
      const next =
        (2 * u ** 3 - 3 * u ** 2 + 1) * a.s +
        (u ** 3 - 2 * u ** 2 + u) * span * a.v +
        (-2 * u ** 3 + 3 * u ** 2) * b.s +
        (u ** 3 - u ** 2) * span * b.v;
      speed = Math.max(0, (next - position) / Math.max(dt, 0.001));
      position = next;
      if (time >= duration) {
        position = finish;
        speed = 0;
        playing = false;
        updateButton();
      }
    }
    const p = track.sample(position);
    const smooth = motion.matches ? 1 : playing ? 1 - Math.exp(-dt * 5) : 0;
    cameraX += (p.x - cameraX) * smooth;
    cameraY += (p.y * 0.35 - 90 - cameraY) * smooth;
    const zoom = Math.max(0.1, Math.min(width / (width < 600 ? 900 : 2000), (height - 140) / 950));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const labels = drawScenery(ctx, width, height, cameraX, time, market.candles);
    ctx.save();
    ctx.translate(width * (width < 600 ? 0.43 : 0.34), height * 0.45);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);
    drawRideTrack(ctx, track, cameraX - (width * 0.5) / zoom, cameraX + width / zoom);
    drawTrain(ctx, track, position, speed, time, motion.matches);
    ctx.restore();
    drawMarketLabels(
      ctx,
      labels,
      width * (width < 600 ? 0.43 : 0.34) + (p.x - cameraX) * zoom,
      height * 0.45 + (p.y - cameraY) * zoom,
    );
    const vignette = ctx.createLinearGradient(0, 0, 0, height);
    vignette.addColorStop(0, '#040c1be6');
    vignette.addColorStop(0.23, '#040c1b00');
    vignette.addColorStop(0.72, '#040c1b00');
    vignette.addColorStop(1, '#040c1be6');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    const section =
      time >= duration
        ? [
            'Sequence complete',
            'A moment to breathe.',
            'The ride ends here. This illustrative recovery does not predict what comes next.',
          ]
        : time >= 17
          ? [
              'The recovery',
              'Finding a steadier pace.',
              'The climb back is slower than the fall. A rebound can still feel uncertain.',
            ]
          : time >= 15
            ? [
                'Through the trough',
                'The rush begins to ease.',
                'At the low point, the pace changes before the climb back.',
              ]
            : time >= 10
              ? [
                  'The plunge',
                  'Volatility feels different from inside.',
                  'The drop gathers speed. Experience the swing from the passenger seat.',
                ]
              : time >= 7
                ? [
                    'At the crest',
                    'A pause before the turn.',
                    'The train hesitates at the top. The next move is still out of view.',
                  ]
                : time > 0
                  ? [
                      'The climb',
                      'Anticipation builds.',
                      'Each rise carries the train higher. From here, the crest hides the drop ahead.',
                    ]
                  : [
                      'Ready to climb',
                      'Experience the market.',
                      'Take a seat for the climb, plunge and recovery.',
                    ];
    if (stage.textContent !== section[0]) {
      stage.textContent = section[0]!;
      captionTitle.textContent = section[1]!;
      captionText.textContent = section[2]!;
    }
    if (audio && oscillator && gain) {
      oscillator.frequency.setTargetAtTime(55 + speed * 0.24, audio.currentTime, 0.12);
      gain.gain.setTargetAtTime(
        time < 7 ? 0.012 + Math.sin(time * 18) ** 8 * 0.018 : 0.012 + speed / 18000,
        audio.currentTime,
        0.08,
      );
    }
    progress.style.width = `${((position - start) / (finish - start)) * 100}%`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

import './prototype.css';
import { el } from '@/ui/dom';
import { createRideTrack } from './geometry';
import { drawScenery } from './scenery';
import { drawRideTrack } from './track';
import { drawTrain } from './train';
export function mountCoasterPrototype() {
  const root = el('main', {
    class: 'ride-prototype',
    'aria-label': 'Candlestick Coaster visual prototype',
  });
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  root.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  const ctx = context;
  const title = el('header', { class: 'ride-top' }, [
    el('div', {}, [
      el('p', { class: 'ride-eyebrow', text: 'Candlestick Coaster / Ride study 01' }),
      el('h1', { text: 'The market is a ride.' }),
    ]),
    el('a', { href: location.pathname, text: 'Back to current game' }),
  ]);
  const stage = el('div', { class: 'ride-stage', 'aria-live': 'polite', text: 'At the crest' });
  const ride = el('button', { type: 'button', text: 'Ride the drop' }) as HTMLButtonElement;
  const boost = el('button', {
    type: 'button',
    text: 'Hold to boost',
    'aria-pressed': 'false',
  }) as HTMLButtonElement;
  const brake = el('button', {
    type: 'button',
    text: 'Hold to brake',
    'aria-pressed': 'false',
  }) as HTMLButtonElement;
  const reset = el('button', {
    type: 'button',
    text: 'Replay',
    'aria-label': 'Replay the coaster sequence',
  }) as HTMLButtonElement;
  const bars = Array.from({ length: 7 }, () => el('span', { 'aria-hidden': 'true' }));
  const meter = el('div', { class: 'ride-meter', 'aria-label': 'Momentum' }, [
    el('b', { text: 'Momentum' }),
    ...bars,
  ]);
  const progress = el('div', { class: 'ride-progress', 'aria-hidden': 'true' });
  root.append(
    title,
    stage,
    el('div', { class: 'ride-bottom' }, [
      el('div', { class: 'ride-caption' }, [
        el('strong', { text: 'One train. Every twist of the market.' }),
        innerWidth < 600
          ? 'An illustrative market ride. Hold boost or brake to control momentum.'
          : 'An illustrative climb, plunge and recovery. Hold Space to boost or Shift to brake.',
      ]),
      el('div', { class: 'ride-controls', 'aria-label': 'Ride controls' }, [
        ride,
        boost,
        brake,
        reset,
        meter,
      ]),
    ]),
    progress,
  );
  document.body.replaceChildren(root);
  document.title = 'The market is a ride | Candlestick Coaster';
  const track = createRideTrack(),
    start = track.atX(1100).s,
    finish = track.atX(3500).s;
  let position = start,
    speed = 95,
    playing = false,
    boosting = false,
    braking = false,
    time = 0,
    last = performance.now();
  let width = innerWidth,
    height = innerHeight;
  let cameraX = track.sample(start).x,
    cameraY = track.sample(start).y * 0.35 - 90;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const resize = () => {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  };
  resize();
  window.addEventListener('resize', resize);
  function clearHolds() {
    boosting = false;
    braking = false;
    boost.setAttribute('aria-pressed', 'false');
    brake.setAttribute('aria-pressed', 'false');
  }
  function updateButton() {
    ride.textContent = playing ? 'Pause ride' : position >= finish ? 'Ride again' : 'Ride the drop';
  }
  const toggle = () => {
    if (position >= finish) {
      position = start;
      speed = 95;
      time = 0;
    }
    playing = !playing;
    updateButton();
  };
  ride.onclick = toggle;
  reset.onclick = () => {
    position = start;
    speed = 95;
    time = 0;
    playing = false;
    cameraX = track.sample(start).x;
    cameraY = track.sample(start).y * 0.35 - 90;
    clearHolds();
    updateButton();
  };
  const hold = (button: HTMLButtonElement, action: (value: boolean) => void) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      action(true);
      button.setAttribute('aria-pressed', 'true');
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      button.addEventListener(event, () => {
        action(false);
        button.setAttribute('aria-pressed', 'false');
      });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        action(true);
        button.setAttribute('aria-pressed', 'true');
      }
    });
    button.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        action(false);
        button.setAttribute('aria-pressed', 'false');
      }
    });
  };
  hold(boost, (value) => (boosting = value));
  hold(brake, (value) => (braking = value));
  window.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Shift') {
      event.preventDefault();
      if (event.key === ' ') boosting = true;
      else braking = true;
    }
    if (event.key === 'Escape' && playing) {
      playing = false;
      clearHolds();
      updateButton();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.key === ' ') boosting = false;
    if (event.key === 'Shift') braking = false;
  });
  const pause = () => {
    playing = false;
    clearHolds();
    updateButton();
  };
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.04);
    last = now;
    if (playing) {
      time += dt;
      const p = track.sample(position);
      const gravity = Math.sin(p.angle) * 540,
        acceleration = braking ? -560 : boosting ? gravity + 270 : gravity - 32;
      speed = Math.max(braking ? 55 : 95, Math.min(640, speed + acceleration * dt));
      position = Math.min(finish, position + speed * dt);
      if (position >= finish) {
        playing = false;
        clearHolds();
        updateButton();
      }
    }
    const p = track.sample(position);
    const smooth = reduced ? 1 : 1 - Math.exp(-dt * 4);
    cameraX += (p.x - cameraX) * smooth;
    cameraY += (p.y * 0.35 - 90 - cameraY) * smooth;
    const zoom = Math.min(width / (width < 600 ? 900 : 2000), (height - 140) / 950);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScenery(ctx, width, height, cameraX, time);
    ctx.save();
    ctx.translate(width * (width < 600 ? 0.43 : 0.34), height * 0.45);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);
    const left = cameraX - (width * 0.5) / zoom,
      right = cameraX + width / zoom;
    drawRideTrack(ctx, track, left, right);
    drawTrain(
      ctx,
      track,
      position,
      speed,
      time,
      playing && boosting && !braking,
      playing && braking,
      reduced,
    );
    ctx.restore();
    const vignette = ctx.createLinearGradient(0, 0, 0, height);
    vignette.addColorStop(0, '#040c1be6');
    vignette.addColorStop(0.23, '#040c1b00');
    vignette.addColorStop(0.72, '#040c1b00');
    vignette.addColorStop(1, '#040c1be6');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    const label =
      position >= finish
        ? 'Recovery / sequence complete'
        : p.x < 1250
          ? 'At the crest'
          : p.x < 2050
            ? 'The plunge'
            : p.x < 2400
              ? 'Through the trough'
              : 'The recovery';
    if (stage.textContent !== label) stage.textContent = label;
    bars.forEach(
      (bar, index) => (bar.style.opacity = index < Math.ceil((speed / 640) * 7) ? '1' : '.2'),
    );
    boost.setAttribute('aria-pressed', String(boosting));
    brake.setAttribute('aria-pressed', String(braking));
    progress.style.width = `${((position - start) / (finish - start)) * 100}%`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

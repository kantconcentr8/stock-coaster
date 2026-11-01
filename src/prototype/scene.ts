import type { MarketCandle } from '@/content/marketSnapshot';
import { createRideTrack } from './geometry';
import { drawMarketLabels, drawScenery } from './scenery';
import { drawRideTrack } from './track';
import { drawTrain } from './train';
import { createRideAudio } from './rideAudio';
import { RIDE_DURATION } from './recapTimeline';

export function createPassengerScene(
  canvas: HTMLCanvasElement,
  candles: () => MarketCandle[],
  onFrame: (time: number, playing: boolean) => void,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const track = createRideTrack();
  const cues = [
    [0, 620, 65],
    [7, 940, 24],
    [10, 1120, 40],
    [15, 1950, 500],
    [17, 2260, 150],
    [RIDE_DURATION, 3160, 0],
  ];
  const path = cues.map(([t, x, v]) => ({ t: t!, s: track.atX(x!).s, v: v! }));
  const start = path[0]!.s,
    finish = path.at(-1)!.s;
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
  const audio = createRideAudio();
  const pause = () => {
    playing = false;
    audio.stop();
    onFrame(time, playing);
  };
  const restart = () => {
    position = start;
    speed = 0;
    time = 0;
    cameraX = track.sample(start).x;
    cameraY = track.sample(start).y * 0.35 - 90;
  };
  const play = () => {
    if (time >= RIDE_DURATION) restart();
    playing = true;
    last = performance.now();
    audio.unlock();
    onFrame(time, playing);
  };
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  window.addEventListener('pagehide', () => {
    pause();
    audio.dispose();
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
      time = Math.min(RIDE_DURATION, time + dt);
      const index = Math.max(0, path.findIndex((cue) => cue.t >= time) - 1);
      const a = path[index]!,
        b = path[index + 1]!,
        span = b.t - a.t,
        u = Math.min(1, (time - a.t) / span);
      const next =
        (2 * u ** 3 - 3 * u ** 2 + 1) * a.s +
        (u ** 3 - 2 * u ** 2 + u) * span * a.v +
        (-2 * u ** 3 + 3 * u ** 2) * b.s +
        (u ** 3 - u ** 2) * span * b.v;
      speed = Math.max(0, (next - position) / Math.max(dt, 0.001));
      position = next;
      if (time >= RIDE_DURATION) {
        position = finish;
        speed = 0;
        playing = false;
        audio.stop();
      }
    }
    const p = track.sample(position);
    const smooth = motion.matches ? 1 : playing ? 1 - Math.exp(-dt * 5) : 0;
    cameraX += (p.x - cameraX) * smooth;
    cameraY += (p.y * 0.35 - 90 - cameraY) * smooth;
    const zoom = Math.max(0.1, Math.min(width / (width < 600 ? 900 : 2000), (height - 140) / 950));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const labels = drawScenery(ctx!, width, height, cameraX, time, candles());
    ctx!.save();
    ctx!.translate(width * (width < 600 ? 0.43 : 0.34), height * 0.45);
    ctx!.scale(zoom, zoom);
    ctx!.translate(-cameraX, -cameraY);
    drawRideTrack(ctx!, track, cameraX - (width * 0.5) / zoom, cameraX + width / zoom);
    drawTrain(ctx!, track, position, speed, time, motion.matches);
    ctx!.restore();
    drawMarketLabels(
      ctx!,
      labels,
      width * (width < 600 ? 0.43 : 0.34) + (p.x - cameraX) * zoom,
      height * 0.45 + (p.y - cameraY) * zoom,
    );
    const vignette = ctx!.createLinearGradient(0, 0, 0, height);
    vignette.addColorStop(0, '#040c1be6');
    vignette.addColorStop(0.23, '#040c1b00');
    vignette.addColorStop(0.72, '#040c1b00');
    vignette.addColorStop(1, '#040c1be6');
    ctx!.fillStyle = vignette;
    ctx!.fillRect(0, 0, width, height);
    audio.update(time, speed);
    onFrame(time, playing);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    play,
    pause,
    replay: () => {
      restart();
      play();
    },
    toggleSound: () => audio.toggle(playing),
  };
}

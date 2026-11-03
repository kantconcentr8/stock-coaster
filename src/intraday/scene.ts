import { drawRideTrack } from '@/prototype/track';
import { drawTrain } from '@/prototype/train';
import { drawScenery } from '@/prototype/scenery';
import { createPriceTrack } from './track';
import { DURATION, type IntradayRide } from './data';

export function createIntradayScene(
  canvas: HTMLCanvasElement,
  ride: IntradayRide,
  onFrame: (seconds: number, playing: boolean) => void,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const track = createPriceTrack(ride);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let time = 0,
    playing = false,
    last = performance.now(),
    frameId = 0,
    previousS = track.atX(0).s;
  const pause = () => {
    playing = false;
    onFrame(time, false);
  };
  const hidden = () => {
    if (document.hidden) pause();
  };
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', hidden);
  function frame(now: number) {
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.1));
    last = now;
    if (playing) time = Math.min(DURATION, time + dt);
    if (time === DURATION) playing = false;
    const width = innerWidth,
      height = innerHeight,
      dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    const progress = time / DURATION;
    const p = track.atX(progress * ride.bars.length * 150);
    const speed = playing && dt > 0 ? Math.abs(p.s - previousS) / dt : 0;
    previousS = p.s;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScenery(ctx!, width, height, reduced.matches ? 0 : p.x, time);
    const camera = reduced.matches ? track.atX(ride.bars.length * 75) : p;
    const zoom = reduced.matches
      ? Math.min(width / (ride.bars.length * 150 + 900), height / 1800)
      : Math.min(width < 600 ? width / 850 : width / 1800, (height - 160) / 800);
    ctx!.save();
    ctx!.translate(width * 0.4, height * 0.46);
    ctx!.scale(zoom, zoom);
    ctx!.translate(-camera.x, -camera.y);
    drawRideTrack(ctx!, track, camera.x - width / zoom, camera.x + width / zoom);
    if (!reduced.matches) drawTrain(ctx!, track, p.s, speed, time, false);
    ctx!.restore();
    onFrame(time, playing);
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);
  return {
    play() {
      if (time === DURATION) {
        time = 0;
        previousS = track.atX(0).s;
      }
      playing = true;
      last = performance.now();
    },
    pause,
    replay() {
      time = 0;
      previousS = track.atX(0).s;
      playing = true;
      last = performance.now();
    },
    destroy() {
      cancelAnimationFrame(frameId);
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', hidden);
    },
  };
}

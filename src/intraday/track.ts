import type { Point, RideTrack } from '@/prototype/geometry';
import { priceAt, type IntradayRide } from './data';

/** Piecewise-linear close path: no invented high/low ordering, spline overshoot or extra peaks. */
export function createPriceTrack(ride: IntradayRide): RideTrack {
  const baseline = ride.bars[0]!.open;
  const span = ride.bars.length * 150;
  const yAt = (progress: number) => -((priceAt(ride, progress) / baseline - 1) * 100) * 220;
  const points: Point[] = [];
  let length = 0;
  for (let x = -450; x <= span + 450; x += 5) {
    const y = yAt(Math.max(0, Math.min(1, x / span)));
    const last = points.at(-1);
    if (last) length += Math.hypot(x - last.x, y - last.y);
    points.push({ x, y, s: length, angle: last ? Math.atan2(y - last.y, x - last.x) : 0 });
  }
  const atX = (x: number) => {
    const cursor = Math.max(0, Math.min(points.length - 1, (x + 450) / 5));
    const a = points[Math.floor(cursor)]!,
      b = points[Math.ceil(cursor)]!;
    const t = cursor - Math.floor(cursor);
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      s: a.s + (b.s - a.s) * t,
      angle: b.angle,
    };
  };
  const sample = (s: number): Point => {
    let low = 0,
      high = points.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (points[mid]!.s < s) low = mid + 1;
      else high = mid;
    }
    const b = points[low]!,
      a = points[Math.max(0, low - 1)]!;
    const t = Math.max(0, Math.min(1, (s - a.s) / Math.max(0.001, b.s - a.s)));
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s, angle: b.angle };
  };
  return { points, length, atX, sample };
}

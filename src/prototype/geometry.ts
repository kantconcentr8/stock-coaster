export interface Point {
  x: number;
  y: number;
  s: number;
  angle: number;
}
// A deliberately theatrical, illustrative profile. It is not historical market data.
const controls = [
  [-700, 140],
  [-240, 45],
  [200, -120],
  [620, -430],
  [950, -510],
  [1230, -430],
  [1600, 20],
  [1950, 235],
  [2260, 250],
  [2620, 35],
  [2920, -230],
  [3160, -300],
  [3460, -100],
  [3800, 175],
  [4260, 105],
  [4800, -130],
] as const;
export function createRideTrack() {
  const points: Point[] = [];
  let length = 0;
  for (let i = 0; i < controls.length - 1; i++) {
    const a = controls[Math.max(0, i - 1)]!,
      b = controls[i]!,
      c = controls[i + 1]!,
      d = controls[Math.min(controls.length - 1, i + 2)]!;
    const count = Math.ceil((c[0] - b[0]) / 5);
    for (let step = 0; step < count; step++) {
      const t = step / count;
      const cubic = (axis: 0 | 1) =>
        0.5 *
        (2 * b[axis] +
          (-a[axis] + c[axis]) * t +
          (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * t * t +
          (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * t * t * t);
      const x = cubic(0),
        y = cubic(1),
        last = points.at(-1);
      if (last) length += Math.hypot(x - last.x, y - last.y);
      points.push({ x, y, s: length, angle: last ? Math.atan2(y - last.y, x - last.x) : 0 });
    }
  }
  const sample = (s: number): Point => {
    s = Math.max(0, Math.min(length, s));
    let low = 0,
      high = points.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (points[mid]!.s < s) low = mid + 1;
      else high = mid;
    }
    const b = points[low]!,
      a = points[Math.max(0, low - 1)]!,
      t = (s - a.s) / Math.max(0.001, b.s - a.s);
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
      s,
    };
  };
  const atX = (x: number) =>
    points.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best), points[0]!);
  return { points, length, sample, atX };
}
export type RideTrack = ReturnType<typeof createRideTrack>;

import type { RideTrack } from './geometry';
export function drawRideTrack(
  ctx: CanvasRenderingContext2D,
  track: RideTrack,
  left: number,
  right: number,
) {
  const ground = 520;
  // Deep steel trestles, rendered behind the rails.
  for (let x = Math.floor(left / 135) * 135; x < right + 135; x += 135) {
    const a = track.atX(x),
      b = track.atX(x + 135);
    if (a.y > ground - 30) continue;
    ctx.fillStyle = '#071221';
    ctx.beginPath();
    ctx.moveTo(x - 10, a.y + 14);
    ctx.lineTo(x + 11, a.y + 14);
    ctx.lineTo(x + 12, ground);
    ctx.lineTo(x - 12, ground);
    ctx.fill();
    ctx.strokeStyle = '#71839166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 9, a.y + 22);
    ctx.lineTo(x + 9, ground);
    ctx.stroke();
    for (let y = Math.max(a.y, b.y) + 30; y < ground; y += 120) {
      const bottom = Math.min(y + 120, ground);
      ctx.strokeStyle = '#060f1d';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 135, bottom);
      ctx.moveTo(x + 135, y);
      ctx.lineTo(x, bottom);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 135, y);
      ctx.stroke();
      ctx.strokeStyle = '#7d879b44';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = '#9ca3a538';
    ctx.fillRect(x - 26, ground, 52, 12);
  }
  const visible = track.points.filter((p) => p.x > left - 60 && p.x < right + 60);
  const rail = (dx: number, dy: number, color: string, lineWidth: number) => {
    ctx.beginPath();
    visible.forEach((p, i) =>
      i ? ctx.lineTo(p.x + dx, p.y + dy) : ctx.moveTo(p.x + dx, p.y + dy),
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  rail(0, 18, '#020811', 21);
  rail(0, 18, '#405269', 3);
  // Far rail, then cross ties, then the near rail create a clear track deck.
  rail(13, -12, '#07101d', 11);
  rail(13, -14, '#aab6ba', 3);
  for (let s = 0; s < track.length; s += 24) {
    const p = track.sample(s);
    if (p.x < left - 40 || p.x > right + 40) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#101b2b';
    ctx.fillRect(-4, -3, 8, 19);
    ctx.strokeStyle = '#b6a785';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(14, -13);
    ctx.stroke();
    ctx.restore();
  }
  rail(0, 0, '#030a13', 12);
  rail(0, -3, '#cbd0c7', 4);
  rail(0, 3, '#586d7d', 3);
  rail(0, 23, '#fca31144', 2);
}

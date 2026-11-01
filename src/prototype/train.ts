import type { RideTrack } from './geometry';
export function drawTrain(
  ctx: CanvasRenderingContext2D,
  track: RideTrack,
  position: number,
  speed: number,
  time: number,
  boosting: boolean,
  braking: boolean,
  reduced: boolean,
) {
  const cars = 4,
    spacing = 88;
  // Couplings connect sampled cars along the same arc-length path.
  ctx.strokeStyle = '#8d9aa5';
  ctx.lineWidth = 5;
  for (let car = 0; car < cars - 1; car++) {
    const a = track.sample(position - car * spacing - 35),
      b = track.sample(position - (car + 1) * spacing + 35);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 12);
    ctx.lineTo(b.x, b.y - 12);
    ctx.stroke();
  }
  for (let car = cars - 1; car >= 0; car--) {
    const s = position - car * spacing,
      rear = track.sample(s - 27),
      front = track.sample(s + 27);
    const x = (rear.x + front.x) / 2,
      y = (rear.y + front.y) / 2,
      angle = Math.atan2(front.y - rear.y, front.x - rear.x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = '#0009';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 8;
    // Wheel assemblies visibly grip the near rail.
    for (const wx of [-27, 27]) {
      ctx.fillStyle = '#060e18';
      ctx.beginPath();
      ctx.arc(wx, -1, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#97a5b0';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#243849';
      ctx.beginPath();
      ctx.arc(wx, -1, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ddd4be';
    ctx.beginPath();
    ctx.moveTo(-40, -17);
    ctx.lineTo(-35, -55);
    ctx.lineTo(-23, -57);
    ctx.lineTo(-17, -32);
    ctx.lineTo(16, -32);
    ctx.lineTo(20, -58);
    ctx.lineTo(33, -57);
    ctx.quadraticCurveTo(45, -48, 43, -18);
    ctx.closePath();
    ctx.fill();
    // Passengers and seats sit behind the orange body lip.
    for (let person = 0; person < 2; person++) {
      const px = -20 + person * 32,
        skin = ['#ba805b', '#e1ae7a', '#a5694c', '#d0a082'][(car + person) % 4]!;
      ctx.fillStyle = '#14213d';
      ctx.beginPath();
      ctx.roundRect(px - 9, -59, 19, 29, 5);
      ctx.fill();
      ctx.fillStyle = person === 0 ? '#e5dfcf' : '#41616b';
      ctx.beginPath();
      ctx.roundRect(px - 7, -65, 14, 28, 5);
      ctx.fill();
      ctx.strokeStyle = skin;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px - 5, -59);
      ctx.lineTo(px - 12, -76);
      ctx.lineTo(px - 14, -87);
      ctx.moveTo(px + 5, -59);
      ctx.lineTo(px + 13, -73);
      ctx.lineTo(px + 17, -84);
      ctx.stroke();
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(px, -75, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#201d22';
      ctx.beginPath();
      ctx.ellipse(px - 1, -80, 7, 5, -0.2, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#182333';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, -58, 9, Math.PI, Math.PI * 2);
      ctx.lineTo(px + 9, -42);
      ctx.stroke();
    }
    const body = ctx.createLinearGradient(0, -38, 0, -7);
    body.addColorStop(0, '#ffca72');
    body.addColorStop(0.3, '#fca311');
    body.addColorStop(1, '#ac5a18');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-41, -34);
    ctx.lineTo(31, -34);
    ctx.quadraticCurveTo(47, -31, 43, -13);
    ctx.lineTo(-36, -13);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffe0a2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-38, -34);
    ctx.lineTo(32, -34);
    ctx.stroke();
    ctx.fillStyle = '#e4e0ce';
    ctx.fillRect(-35, -14, 72, 5);
    ctx.fillStyle = '#152738';
    ctx.fillRect(-33, -9, 65, 4);
    ctx.fillStyle = '#18283c';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('CC', -6, -21);
    if (car === 0) {
      ctx.fillStyle = '#fff3ce';
      ctx.shadowColor = boosting ? '#80e9ff' : '#ffce79';
      ctx.shadowBlur = boosting ? 25 : 12;
      ctx.fillRect(37, -25, 7, 5);
      ctx.shadowBlur = 0;
    }
    // Braking/boost feedback appears only while those controls are held.
    if (!reduced && (boosting || braking)) {
      ctx.strokeStyle = braking ? '#ffd69a' : '#8ee9ef';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const phase = (time * 4 + i * 0.19) % 1;
        ctx.globalAlpha = 1 - phase;
        ctx.beginPath();
        ctx.moveTo(-30, -1);
        ctx.lineTo(-30 - phase * (30 + speed * 0.04), 3 + Math.sin(i * 12) * phase * 20);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

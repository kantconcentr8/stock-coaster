import type { MarketCandle } from '@/content/marketSnapshot';

interface CandleLabel {
  x: number;
  y: number;
  symbol: string;
  change: number;
}

export function drawScenery(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  time: number,
  candles: readonly MarketCandle[] = [],
) {
  const labels: CandleLabel[] = [];
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#060e20');
  sky.addColorStop(0.55, '#172c43');
  sky.addColorStop(1, '#495257');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  const halo = ctx.createRadialGradient(
    width * 0.67,
    height * 0.67,
    0,
    width * 0.67,
    height * 0.67,
    width * 0.65,
  );
  halo.addColorStop(0, '#b580382b');
  halo.addColorStop(1, '#b5803800');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#9cd6e511';
  const drift = (cameraX * 0.045) % 80;
  for (let x = -80; x < width + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x - drift, 0);
    ctx.lineTo(x - drift, height);
    ctx.stroke();
  }
  for (let y = 20; y < height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let layer = 0; layer < 3; layer++) {
    const spacing = layer === 2 ? 200 : 68;
    const movement = cameraX * [0.035, 0.08, 0.14][layer]!;
    const start = Math.floor(movement / spacing) - 3;
    for (let index = start; index < start + width / spacing + 7; index++) {
      const seed = Math.abs(Math.sin(index * 127.1 + layer * 311.7));
      const x = index * spacing - movement;
      const candle =
        layer === 2 && candles.length
          ? candles[((index % candles.length) + candles.length) % candles.length]
          : undefined;
      const extent = Math.min(240, height * 0.28);
      const top = height * (0.35 + layer * 0.06) + Math.sin(index * 1.33 + layer) * height * 0.15;
      const priceY = (price: number) =>
        top + ((candle!.high - price) / Math.max(candle!.high - candle!.low, 0.00001)) * extent;
      const body = candle
        ? Math.max(2, Math.abs(priceY(candle.open) - priceY(candle.close)))
        : 55 + seed * height * 0.26;
      const y = candle ? Math.min(priceY(candle.open), priceY(candle.close)) : top;
      const w = layer === 2 ? 35 : 19;
      ctx.globalAlpha = candle ? 0.8 : [0.12, 0.24, 0.55][layer]!;
      const orange = candle ? candle.close < candle.open : seed > 0.53,
        cream = candle ? candle.close >= candle.open : seed < 0.19;
      const color = cream ? '#d9cdb4' : orange ? '#fca311' : '#274354';
      ctx.strokeStyle = color;
      ctx.lineWidth = layer === 2 ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, candle ? priceY(candle.high) : y - 32 - seed * 35);
      ctx.lineTo(x + w / 2, candle ? priceY(candle.low) : y + body + 28);
      ctx.stroke();
      if (candle && x >= 16 && x + 152 <= width - 16) {
        labels.push({
          x: x - 4,
          y: top - 39,
          symbol: candle.symbol,
          change: ((candle.close - candle.open) / candle.open) * 100,
        });
      }
      const fill = ctx.createLinearGradient(x, y, x + w, y);
      fill.addColorStop(0, color);
      fill.addColorStop(0.24, orange ? '#f6be63' : cream ? '#e5dece' : '#335267');
      fill.addColorStop(1, orange ? '#9f5c20' : cream ? '#8c918a' : '#12263a');
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, y, w, body, 3);
      ctx.fill();
      ctx.strokeStyle = orange ? '#ffca7366' : '#f2ead22b';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const haze = ctx.createLinearGradient(0, height * 0.58, 0, height);
  haze.addColorStop(0, '#14213d00');
  haze.addColorStop(1, '#102035dd');
  ctx.fillStyle = haze;
  ctx.fillRect(0, height * 0.58, width, height * 0.42);
  // Quiet, deterministic lights; no flashing or strobing.
  ctx.fillStyle = '#f8d89a';
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 24; i++) {
    const x = (i * 179.3 - cameraX * 0.03 + width * 20) % width;
    const y = (Math.sin(i * 71) * 0.5 + 0.5) * height * 0.7;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  void time;
  return labels;
}

/** Labels remain readable over trestles; leave space around the train itself. */
export function drawMarketLabels(
  ctx: CanvasRenderingContext2D,
  labels: CandleLabel[],
  trainX: number,
  trainY: number,
) {
  for (const label of labels) {
    if (Math.abs(label.x - trainX) < 130 && Math.abs(label.y - trainY) < 65) continue;
    ctx.fillStyle = '#0a1729eb';
    ctx.beginPath();
    ctx.roundRect(label.x, label.y - 18, 152, 58, 6);
    ctx.fill();
    ctx.font = '700 20px sans-serif';
    ctx.fillStyle = '#f1e7d5';
    ctx.fillText(label.symbol, label.x + 10, label.y + 5);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = label.change < 0 ? '#ff8585' : label.change > 0 ? '#6ee7a0' : '#c8d3de';
    ctx.fillText(
      `O/C ${label.change >= 0 ? '+' : ''}${label.change.toFixed(2)}%`,
      label.x + 10,
      label.y + 29,
    );
  }
}

import Phaser from 'phaser';
import { PALETTE } from './palette';
import type { Track } from '@/sim/track';

const CHUNK_WU = 1200;
const STEP_WU = 12;

export interface TrackView {
  updateVisible(centerS: number, visibleRadiusWu: number): void;
  destroy(): void;
}

/**
 * Pre-renders track chunks into Phaser Graphics objects and toggles visibility by distance.
 * Upper/middle/lower rails are distinguished by line style + thickness (not color alone):
 * - Upper rail (0, offset -1): dashed, 2px, light cyan/white
 * - Middle rail (1, offset 0): solid, 4px, bright orange
 * - Lower rail (2, offset +1): dotted/short-dash, 2.5px, alabaster grey
 */
export function createTrackView(scene: Phaser.Scene, track: Track): TrackView {
  const chunks: { s0: number; s1: number; gfx: Phaser.GameObjects.Graphics }[] = [];
  const totalChunks = Math.ceil(track.length / CHUNK_WU);

  for (let c = 0; c < totalChunks; c++) {
    const s0 = c * CHUNK_WU;
    const s1 = Math.min(track.length, (c + 1) * CHUNK_WU);
    const gfx = scene.add.graphics();
    gfx.setDepth(1);
    drawChunk(gfx, track, s0, s1);
    chunks.push({ s0, s1, gfx });
  }

  return {
    updateVisible(centerS, visibleRadiusWu) {
      const minS = centerS - visibleRadiusWu * 0.6;
      const maxS = centerS + visibleRadiusWu * 1.4;
      for (const ch of chunks) {
        const vis = ch.s1 >= minS && ch.s0 <= maxS;
        if (ch.gfx.visible !== vis) ch.gfx.setVisible(vis);
      }
    },
    destroy() {
      for (const ch of chunks) ch.gfx.destroy();
    },
  };
}

function drawChunk(gfx: Phaser.GameObjects.Graphics, track: Track, s0: number, s1: number): void {
  // Subtle vertical candlestick-like grid bars every 240 wu
  gfx.lineStyle(1, PALETTE.white, 0.08);
  const firstGrid = Math.ceil(s0 / 240) * 240;
  for (let s = firstGrid; s <= s1; s += 240) {
    const p = track.sample(s);
    const topY = track.railY(s, -1.6);
    const botY = track.railY(s, 1.6);
    gfx.lineBetween(p.x, topY, p.x, botY);
  }

  // Rail cross-ties every 120 wu
  gfx.lineStyle(1, PALETTE.alabaster, 0.16);
  const firstTie = Math.ceil(s0 / 120) * 120;
  for (let s = firstTie; s <= s1; s += 120) {
    const p = track.sample(s);
    gfx.lineBetween(p.x, track.railY(s, -1), p.x, track.railY(s, 1));
  }

  // Upper rail (-1): long-dashed, 2px
  drawRailSegment(gfx, track, s0, s1, -1, 2, PALETTE.cyan, 0.85, 24, 12);
  // Middle rail (0): solid, 4px
  drawRailSegment(gfx, track, s0, s1, 0, 4, PALETTE.orange, 1.0, 0, 0);
  // Lower rail (+1): short-dashed, 2.5px
  drawRailSegment(gfx, track, s0, s1, 1, 2.5, PALETTE.alabaster, 0.85, 10, 10);
}

function drawRailSegment(
  gfx: Phaser.GameObjects.Graphics,
  track: Track,
  s0: number,
  s1: number,
  railOffset: number,
  width: number,
  color: number,
  alpha: number,
  dashWu: number,
  gapWu: number,
): void {
  gfx.lineStyle(width, color, alpha);
  const period = dashWu + gapWu;
  let penDown = false;
  gfx.beginPath();
  for (let s = s0; s <= s1; s += STEP_WU) {
    const p = track.sample(s);
    const y = p.y + railOffset * track.railSpacing;
    const drawHere = period === 0 || s % period <= dashWu;
    if (drawHere) {
      if (!penDown) {
        gfx.moveTo(p.x, y);
        penDown = true;
      } else {
        gfx.lineTo(p.x, y);
      }
    } else {
      penDown = false;
    }
  }
  gfx.strokePath();
}

import Phaser from 'phaser';
import { PALETTE } from './palette';
import { gameStorage } from '@/services/storage';
import type { CourseObject } from '@/core/types';
import type { Track } from '@/sim/track';

export interface ObjectView {
  update(consumed: ReadonlySet<string>, centerS: number, visibleRadiusWu: number): void;
  /** Triggers a brief pop animation on a collected pickup. */
  popPickup(objectId: string): void;
  destroy(): void;
}

/**
 * Pickups and hazards are distinguishable by shape + symbol (not color alone):
 * - Pickup: diamond/circle orb in cyan (#00f5d4) with a bold '+' symbol inside.
 * - Hazard: angular warning triangle/octagon barrier in high-contrast amber/magenta (#ff6b35) with '!' mark.
 * Uses a fixed pre-allocated pool of Graphics nodes per course object (no per-frame create/destroy).
 */
export function createObjectView(
  scene: Phaser.Scene,
  objects: readonly CourseObject[],
  track: Track,
): ObjectView {
  const nodes = new Map<
    string,
    { obj: CourseObject; gfx: Phaser.GameObjects.Graphics; popUntil: number }
  >();

  for (const obj of objects) {
    const gfx = scene.add.graphics();
    gfx.setDepth(5);
    const sample = track.sample(obj.s);
    const y = sample.y + (obj.rail - 1) * track.railSpacing;
    gfx.setPosition(sample.x, y);
    if (obj.kind === 'pickup') {
      drawPickup(gfx);
    } else {
      drawHazard(gfx);
    }
    nodes.set(obj.id, { obj, gfx, popUntil: 0 });
  }

  return {
    update(consumed, centerS, visibleRadiusWu) {
      const now = performance.now();
      const minS = centerS - visibleRadiusWu * 0.5;
      const maxS = centerS + visibleRadiusWu * 1.4;
      for (const item of nodes.values()) {
        const inRange = item.obj.s >= minS && item.obj.s <= maxS;
        if (item.popUntil > now) {
          const t = 1 - (item.popUntil - now) / 180;
          item.gfx.setVisible(true);
          item.gfx.setScale(1 + 0.6 * t);
          item.gfx.setAlpha(1 - t);
          continue;
        }
        const isConsumed = consumed.has(item.obj.id);
        const visible = inRange && !isConsumed;
        if (item.gfx.visible !== visible) {
          item.gfx.setVisible(visible);
          if (visible) {
            item.gfx.setScale(1);
            item.gfx.setAlpha(1);
          }
        }
      }
    },
    popPickup(objectId) {
      if (
        gameStorage.getPrefs().reducedMotion ??
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      )
        return;
      const item = nodes.get(objectId);
      if (item) {
        item.popUntil = performance.now() + 180;
      }
    },
    destroy() {
      for (const item of nodes.values()) item.gfx.destroy();
    },
  };
}

function drawPickup(gfx: Phaser.GameObjects.Graphics): void {
  // Diamond outer ring + circle + '+' symbol (cyan + white, high contrast in grayscale)
  gfx.fillStyle(PALETTE.pickup, 0.9);
  gfx.lineStyle(2.5, PALETTE.white, 1);
  gfx.beginPath();
  gfx.moveTo(0, -13);
  gfx.lineTo(13, 0);
  gfx.lineTo(0, 13);
  gfx.lineTo(-13, 0);
  gfx.closePath();
  gfx.fillPath();
  gfx.strokePath();

  // '+' glyph
  gfx.lineStyle(3, PALETTE.ink, 1);
  gfx.lineBetween(-5, 0, 5, 0);
  gfx.lineBetween(0, -5, 0, 5);
}

function drawHazard(gfx: Phaser.GameObjects.Graphics): void {
  // Angular warning triangle with stripes / '!' mark
  gfx.fillStyle(PALETTE.orange, 0.95);
  gfx.lineStyle(2.5, PALETTE.black, 1);
  gfx.beginPath();
  gfx.moveTo(0, -15);
  gfx.lineTo(15, 12);
  gfx.lineTo(-15, 12);
  gfx.closePath();
  gfx.fillPath();
  gfx.strokePath();

  // Outer white border for dark-background readability
  gfx.lineStyle(1.5, PALETTE.white, 0.9);
  gfx.strokeTriangle(0, -16, 16, 13, -16, 13);

  // '!' glyph inside triangle
  gfx.fillStyle(PALETTE.black, 1);
  gfx.fillRect(-2, -7, 4, 9);
  gfx.fillCircle(0, 6, 2.2);
}

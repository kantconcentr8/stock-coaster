import Phaser from 'phaser';
import type { KartState } from '@/core/types';
import { railOffset } from '@/sim/lanes';
import type { Track } from '@/sim/track';

export interface KartView {
  readonly x: number;
  readonly y: number;
  update(kart: KartState, track: Track, simTime: number): void;
  destroy(): void;
}

export function createKartView(scene: Phaser.Scene): KartView {
  const gfx = scene.add.graphics();
  gfx.setDepth(10);

  // Draw vector kart body centered at (0, 0)
  gfx.fillStyle(0xfca311, 1);
  gfx.lineStyle(2, 0xffffff, 1);
  gfx.beginPath();
  gfx.moveTo(20, 0);
  gfx.lineTo(-14, -11);
  gfx.lineTo(-10, 0);
  gfx.lineTo(-14, 11);
  gfx.closePath();
  gfx.fillPath();
  gfx.strokePath();

  // Cockpit accent
  gfx.fillStyle(0x14213d, 1);
  gfx.fillCircle(2, 0, 4);

  let x = 0;
  let y = 0;

  return {
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    update(kart, track, simTime) {
      const sample = track.sample(kart.s);
      const offset = railOffset(kart);
      x = sample.x;
      y = sample.y + offset * track.railSpacing;
      gfx.setPosition(x, y);
      gfx.setRotation(sample.angle);

      // Invulnerability pulse <= 3 Hz (2.5 Hz cosine wave between 0.35 and 1.0 alpha)
      if (simTime < kart.invulnUntil) {
        const phase = Math.cos(simTime * 2.5 * Math.PI * 2);
        gfx.setAlpha(0.675 + 0.325 * phase);
      } else {
        gfx.setAlpha(1);
      }
    },
    destroy() {
      gfx.destroy();
    },
  };
}

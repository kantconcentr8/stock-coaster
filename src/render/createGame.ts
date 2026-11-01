import Phaser from 'phaser';
import type { App } from '@/app';
import { GameScene } from './GameScene';

export function createGame(
  app: App,
  parent: string,
  onFrame?: (visibleAheadSec: number, frameSec: number, steps: number) => void,
): Phaser.Game {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
      zoom: 1 / dpr,
    },
    scene: [new GameScene(app, onFrame)],
  });
}

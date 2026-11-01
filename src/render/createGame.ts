import Phaser from 'phaser';
import type { App } from '@/app';
import { GameScene } from './GameScene';

export function createGame(app: App, parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: true,
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene: [new GameScene(app)],
  });
}


import Phaser from 'phaser';
import type { App } from '@/app';

export class GameScene extends Phaser.Scene {
  constructor(private readonly app: App) {
    super('GameScene');
  }

  update(_time: number, delta: number): void {
    this.app.tick(delta / 1000);
  }
}

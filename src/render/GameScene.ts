import Phaser from 'phaser';
import type { App } from '@/app';
import type { LayoutRegion } from '@/ui/layout';
import { createCameraRig, type CameraRig } from './camera';
import { createEffects, type Effects } from './effects';
import { createKartView, type KartView } from './kartView';
import { createObjectView, type ObjectView } from './objectView';
import { createTrackView, type TrackView } from './trackView';

export class GameScene extends Phaser.Scene {
  private trackView?: TrackView;
  private kartView?: KartView;
  private objectView?: ObjectView;
  private readonly cameraRig: CameraRig;
  private readonly effects: Effects;
  private trackRegion?: LayoutRegion;
  private readonly onFrame?: (visibleAheadSec: number, frameSec: number, steps: number) => void;

  constructor(
    private readonly app: App,
    onFrame?: (visibleAheadSec: number, frameSec: number, steps: number) => void,
  ) {
    super('GameScene');
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraRig = createCameraRig();
    this.effects = createEffects(reduced);
    this.onFrame = onFrame;
  }

  setTrackRegion(region: LayoutRegion): void {
    this.trackRegion = region;
    if (this.scale) {
      this.cameraRig.resize(this.scale.width, this.scale.height, this.trackRegion);
    }
  }

  create(): void {
    this.trackView = createTrackView(this, this.app.track);
    this.objectView = createObjectView(this, this.app.course.objects, this.app.track);
    this.kartView = createKartView(this);

    this.app.bus.on('pickup', (e) => this.objectView?.popPickup(e.objectId));
    this.app.bus.on('hazardHit', () => this.effects.triggerHazardNudge());

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.cameraRig.resize(gameSize.width, gameSize.height, this.trackRegion);
    });
    this.cameraRig.resize(this.scale.width, this.scale.height, this.trackRegion);
    this.syncViews();
  }

  update(_time: number, delta: number): void {
    const frameSec = delta / 1000;
    const steps = this.app.tick(frameSec);
    this.syncViews();
    this.onFrame?.(this.cameraRig.visibleAheadSeconds(), frameSec, steps);
  }

  private syncViews(): void {
    const { state } = this.app.sim;
    this.trackView?.updateVisible(state.kart.s, this.cameraRig.visibleAheadWu);
    this.objectView?.update(state.consumed, state.kart.s, this.cameraRig.visibleAheadWu);
    this.kartView?.update(state.kart, this.app.track, state.t);

    if (this.kartView) {
      const cam = this.cameras.main;
      cam.setZoom(this.cameraRig.zoom);
      const shake = this.effects.sampleOffset();
      const { scrollX, scrollY } = this.cameraRig.computeScroll(
        this.kartView.x,
        this.kartView.y,
        this.scale.width,
        this.scale.height,
        shake.x,
        shake.y,
      );
      cam.setScroll(scrollX, scrollY);
    }
  }
}

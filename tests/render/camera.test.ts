import { describe, expect, it } from 'vitest';
import { createCameraRig } from '@/render/camera';

describe('camera rig', () => {
  it('guarantees visibleAheadSeconds >= 2.0 at 360x640 mobile viewport', () => {
    const cam = createCameraRig(360, 640);
    expect(cam.visibleAheadSeconds()).toBeGreaterThanOrEqual(2.0);
  });

  it('guarantees visibleAheadSeconds >= 2.0 at 1280x720 desktop viewport', () => {
    const cam = createCameraRig(1280, 720);
    expect(cam.visibleAheadSeconds()).toBeGreaterThanOrEqual(2.0);
  });
});

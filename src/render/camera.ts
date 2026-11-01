import { TUNING } from '@/config/tuning';

export interface CameraRig {
  readonly zoom: number;
  readonly visibleAheadWu: number;
  visibleAheadSeconds(): number;
  resize(viewportWidth: number, viewportHeight: number): void;
  /** Returns camera scroll { scrollX, scrollY } so kart sits at ~28% from left and 50% vertically. */
  computeScroll(
    kartX: number,
    kartY: number,
    viewportWidth: number,
    viewportHeight: number,
    shakeOffsetX?: number,
    shakeOffsetY?: number,
  ): { scrollX: number; scrollY: number };
}

const ANCHOR_X = 0.28;
const ANCHOR_Y = 0.5;

export function createCameraRig(initialWidth = 1280, initialHeight = 720): CameraRig {
  let zoom = 1;
  let visibleAheadWu = 1000;

  const resize = (viewportWidth: number, viewportHeight: number) => {
    const w = Math.max(1, viewportWidth);
    const h = Math.max(1, viewportHeight);
    const minAheadWu = TUNING.vMaxBoost * TUNING.previewSeconds * 1.05; // >= 2.0 s preview with 5% buffer
    const maxZoomForPreview = (w * (1 - ANCHOR_X)) / minAheadWu;
    const heightScale = Math.min(1, h / 640);
    zoom = Math.min(maxZoomForPreview, Math.max(0.25, Math.min(1.0, heightScale)));
    visibleAheadWu = (w * (1 - ANCHOR_X)) / zoom;
  };

  resize(initialWidth, initialHeight);

  return {
    get zoom() {
      return zoom;
    },
    get visibleAheadWu() {
      return visibleAheadWu;
    },
    visibleAheadSeconds() {
      return visibleAheadWu / TUNING.vMaxBoost;
    },
    resize,
    computeScroll(kartX, kartY, viewportWidth, viewportHeight, shakeX = 0, shakeY = 0) {
      // Phaser camera with zoom Z and origin (0.5, 0.5) maps world point (wx, wy) to screen:
      // sx = (wx - scrollX - w/2) * zoom + w/2
      // Solving for sx = ANCHOR_X * w, sy = ANCHOR_Y * h:
      const scrollX =
        kartX - viewportWidth * 0.5 - ((ANCHOR_X - 0.5) * viewportWidth) / zoom + shakeX;
      const scrollY =
        kartY - viewportHeight * 0.5 - ((ANCHOR_Y - 0.5) * viewportHeight) / zoom + shakeY;
      return { scrollX, scrollY };
    },
  };
}

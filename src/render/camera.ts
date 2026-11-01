import { TUNING } from '@/config/tuning';
import type { LayoutRegion } from '@/ui/layout';

export interface CameraRig {
  readonly zoom: number;
  readonly visibleAheadWu: number;
  visibleAheadSeconds(): number;
  resize(viewportWidth: number, viewportHeight: number, trackRegion?: LayoutRegion): void;
  /** Returns camera scroll { scrollX, scrollY } so kart sits at ~28% from left and centered in the track region. */
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

export function createCameraRig(initialWidth = 1280, initialHeight = 720): CameraRig {
  let zoom = 1;
  let visibleAheadWu = 1000;
  let anchorY = 0.5;

  const resize = (viewportWidth: number, viewportHeight: number, trackRegion?: LayoutRegion) => {
    const w = Math.max(1, viewportWidth);
    const h = Math.max(1, viewportHeight);
    const effW = trackRegion ? Math.max(1, trackRegion.width) : w;
    const effH = trackRegion ? Math.max(1, trackRegion.height) : h;

    anchorY = trackRegion ? (trackRegion.top + trackRegion.height * 0.5) / h : 0.5;

    const minAheadWu = TUNING.vMaxBoost * TUNING.previewSeconds * 1.05; // >= 2.0 s preview with 5% buffer
    const maxZoomForPreview = (effW * (1 - ANCHOR_X)) / minAheadWu;
    const heightScale = Math.min(1, effH / 480);
    zoom = Math.min(maxZoomForPreview, Math.max(0.25, Math.min(1.0, heightScale)));
    visibleAheadWu = (effW * (1 - ANCHOR_X)) / zoom;

    if (import.meta.env?.DEV && visibleAheadWu / TUNING.vMaxBoost < TUNING.previewSeconds) {
      console.warn(
        `Camera preview below ${TUNING.previewSeconds}s: ${(visibleAheadWu / TUNING.vMaxBoost).toFixed(2)}s`,
      );
    }
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
      const scrollX =
        kartX - viewportWidth * 0.5 - ((ANCHOR_X - 0.5) * viewportWidth) / zoom + shakeX;
      const scrollY =
        kartY - viewportHeight * 0.5 - ((anchorY - 0.5) * viewportHeight) / zoom + shakeY;
      return { scrollX, scrollY };
    },
  };
}

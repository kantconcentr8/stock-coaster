// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createCameraRig } from '@/render/camera';
import { createInAppBrowserBanner, isInAppBrowser } from '@/ui/inAppBrowser';
import { computeLayoutMetrics } from '@/ui/layout';

describe('mobile layout and preview distance', () => {
  const sizes: [number, number, boolean][] = [
    [360, 640, true],
    [390, 844, true],
    [412, 915, true],
    [844, 390, true],
    [1280, 720, false],
  ];

  for (const [w, h, coarse] of sizes) {
    it(`maintains >= 2.0s preview and non-overlapping track region at ${w}x${h}`, () => {
      const m = computeLayoutMetrics(w, h, 3, coarse);
      expect(m.dpr).toBeLessThanOrEqual(2);
      expect(m.trackRegion.top).toBeGreaterThanOrEqual(m.hudBandHeight);
      expect(m.trackRegion.height).toBeGreaterThan(150);

      const cam = createCameraRig(w, h);
      cam.resize(w, h, m.trackRegion);
      expect(cam.visibleAheadSeconds()).toBeGreaterThanOrEqual(2.0);
    });
  }
});

describe('in-app browser detection', () => {
  it('detects X/Twitter, Instagram, and Facebook in-app user agents only', () => {
    expect(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Twitter for iPhone')).toBe(
      true,
    );
    expect(isInAppBrowser('Mozilla/5.0 Instagram 300.0.0.0.0')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 [FBAN/FBIOS;FBAV/400.0]')).toBe(true);
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(false);
  });

  it('renders a dismissible banner without blocking', () => {
    const banner = createInAppBrowserBanner('https://example.com');
    expect(banner.hasAttribute('hidden')).toBe(false);
    const dismiss = banner.querySelector('.inapp-dismiss-btn') as HTMLButtonElement;
    dismiss.click();
    expect(banner.hasAttribute('hidden')).toBe(true);
  });
});

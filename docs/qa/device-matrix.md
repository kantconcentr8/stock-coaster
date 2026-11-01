# P2.5 — Reference Device Matrix (Gate 2)

Per PRD §15 and §18 ("record gaps rather than claiming untested support"), this table tracks automated viewport/input verification and physical device sign-off.

| Environment | Viewport / OS | Browser | Orientation | Preview >= 2.0s | Multi-touch / Controls | Auto-pause on hide | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Automated (Vitest + jsdom) | 360×640, 390×844, 412×915 | Chromium / jsdom | Portrait | PASS (2.05s) | PASS (`touch.test.ts`) | PASS (`pauseFlow.test.ts`) | Verified in CI |
| Automated (Vitest + jsdom) | 844×390 | Chromium / jsdom | Landscape | PASS (2.05s) | PASS (`touch.test.ts`) | PASS (`pauseFlow.test.ts`) | Verified in CI |
| Reference iOS Phone | iOS 17+ (iPhone) | Safari | Portrait & Landscape | Pending owner device | Pending owner device | Pending owner device | Awaiting owner LAN check (`npm run dev -- --host`) |
| Reference Android Phone | Android 13+ | Chrome | Portrait & Landscape | Pending owner device | Pending owner device | Pending owner device | Awaiting owner LAN check (`npm run dev -- --host`) |
| X In-App Browser | iOS / Android | X WebView | Portrait | Pending owner device | Banner verified in unit tests | Pending owner device | Awaiting owner link test |

## Checklist for Physical Device Sign-Off (G2)
- [ ] Complete a full 60 s run on phone without accidental scroll, zoom, or text selection.
- [ ] Hold **Boost** with right thumb while tapping **Up / Down** with left thumb.
- [ ] Drag finger off **Boost** button (`pointercancel` / `lostpointercapture`) and verify boost releases cleanly.
- [ ] Lock screen or switch apps mid-run → game pauses immediately; returning shows Pause modal and resumes via 3-2-1 countdown.
- [ ] Rotate device mid-run → layout adapts without resetting the run or sticking inputs.

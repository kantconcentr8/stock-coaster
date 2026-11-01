# Performance - local Phase 5 build

Before splitting: approximately 374.71 KB gzip monolithic JS after Phase 4 UI cleanup.
After splitting: approximately 20.3 KB gzip initial HTML/CSS/JS, approximately 378.1 KB gzip including dynamically loaded renderer.
These are local Vite manifest and gzip measurements; final build console is authoritative.
`npm run build` automatically runs `scripts/check-bundle.ts`, failing above 3,000,000 bytes for initial or playable payload.
The intro and text access render before Phaser loads; Start is disabled until the renderer import completes.
Audio uses original synthesis with zero downloaded sound assets; system fonts have no network dependency.

No physical-phone FPS or fast-4G/Lighthouse timing result is claimed. Those measurements remain pending the release audit.

## Deployed measurements (2026-10-31)

Target: https://stock-coaster-seven.vercel.app/ on Windows host Chromium mobile emulation.
Lighthouse simulated mobile: performance 79/100, accessibility 100/100, FCP 2.0s, LCP 2.5s,
TBT 660ms, CLS 0.001. Settings override simulated RTT to 40ms, throughput to 9000 Kbps,
CPU slowdown 4x; full settings and all defaults are preserved in the JSON report.
Direct CDP run, disabled cache: 40ms latency, 9 Mbps down/1.5 Mbps up, CPU 4x, Pixel 5 viewport.
Start ready 1302ms; FCP 604ms. One run, not a statistically stable guarantee.
Reports: p5-live/lighthouse.report.{json,html}, p5-live/start-ready.json.
Physical-phone 30 FPS acceptance remains unverified; no claim is made from emulation.

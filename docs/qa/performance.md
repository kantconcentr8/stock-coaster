# Performance - local Phase 5 build

Before splitting: approximately 374.71 KB gzip monolithic JS after Phase 4 UI cleanup.
After splitting: approximately 20.3 KB gzip initial HTML/CSS/JS, approximately 378.1 KB gzip including dynamically loaded renderer.
These are local Vite manifest and gzip measurements; final build console is authoritative.
`npm run build` automatically runs `scripts/check-bundle.ts`, failing above 3,000,000 bytes for initial or playable payload.
The intro and text access render before Phaser loads; Start is disabled until the renderer import completes.
Audio uses original synthesis with zero downloaded sound assets; system fonts have no network dependency.

No physical-phone FPS or fast-4G/Lighthouse timing result is claimed. Those measurements remain pending the release audit.

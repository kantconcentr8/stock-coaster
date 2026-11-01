# Brand and contrast evidence

Original assets and rights are documented in `../../assets-attribution.md`.
`contrast.json` records WCAG relative-luminance calculations from the CSS brand tokens and representative rendered backgrounds.
All eight recorded text/control pairs pass their thresholds (text >=4.5:1; graphics/control outlines >=3:1).
Run `npx tsx scripts/check-contrast.ts` to regenerate.
The fallback CTA now uses black text on orange (10.39:1); primary link styling previously inherited white.
Automated axe scans additionally check actual intro, pause, briefing and results DOM states.
Pickups remain diamonds with a plus and hazards triangles with an exclamation; rails retain different dash patterns/widths.
Live screenshots are under `../p5-live/`; physical grayscale/device review remains pending.

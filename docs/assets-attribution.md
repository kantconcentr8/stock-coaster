# Asset attribution

All new game art and effects are original project assets. No external fonts, market chart images, excerpts, samples or music are used.

| Asset | Source / rights | Notes |
| --- | --- | --- |
| `public/brand/mark.svg` | Original geometric vector drawn for this project | Orange track + kart mark; decorative logo |
| `public/brand/icon-180.png`, `icon-192.png`, `icon-512.png` | Original raster exports of the same project design | App icons, no PWA/offline claim |
| `public/social/default-1200x630.png` | Original composed artwork drawn for this project | Final branded illustration; no market data |
| `src/services/audio.ts` | Original oscillator synthesis written for this project | Pickup 880 Hz, hazard 110 Hz, lane 440 Hz, boost 150 Hz, bell 660 Hz; 0 bytes downloaded audio |
| `src/render/*` | Original procedural track, kart and object geometry | No trading chart or exact price path |
| Phaser and tooling | Third-party packages under their respective package licenses | Retain package license notices; asset ownership does not replace dependency licenses |

Audio is optional and defaults to muted. Synthesizing effects replaces fetching encoded sound files, avoiding 404/loading and codec risks. Total external audio transfer is 0 KB (under the 300 KB budget).

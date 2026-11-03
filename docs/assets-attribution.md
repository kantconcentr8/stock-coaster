# Asset attribution

Game art and effects are original project assets. The passenger briefing also uses four owner-supplied thinkorswim screenshots, authorized for publication by the owner on November 1, 2026. Images retain their original platform labels; no third-party ownership or redistribution rights are inferred beyond that owner authorization. No external fonts, samples or music are used.

| Asset | Source / rights | Notes |
| --- | --- | --- |
| `public/brand/mark.svg` | Original geometric vector drawn for this project | Orange track + kart mark; decorative logo |
| `public/brand/icon-180.png`, `icon-192.png`, `icon-512.png` | Original raster exports of the same project design | App icons, no PWA/offline claim |
| `public/social/default-1200x630.png` | Original composed artwork drawn for this project | Final branded illustration; no market data |
| `src/services/audio.ts` | Original oscillator synthesis written for this project | Pickup 880 Hz, hazard 110 Hz, lane 440 Hz, boost 150 Hz, bell 660 Hz; 0 bytes downloaded audio |
| `src/render/*` | Original procedural track, kart and object geometry | No trading chart or exact price path |
| Phaser and tooling | Third-party packages under their respective package licenses | Retain package license notices; asset ownership does not replace dependency licenses |
| `public/charts/october-30-{es,participation,ndx,spx}.jpg` | Owner-supplied thinkorswim screenshots; owner authorized use | Unchanged originals from ES.jpg, 6 charts.jpg, NDX.jpg, SPX.jpg. Plain-language captions are separate editorial interpretations. |

Audio is optional and defaults to muted. Synthesizing effects replaces fetching encoded sound files, avoiding 404/loading and codec risks. Total external audio transfer is 0 KB (under the 300 KB budget).

November 2 prototype: `public/charts/november-2-{es,add-1m,add-hourly}.jpg` and `november-2-aapl.png` are unchanged owner-supplied thinkorswim screenshots supplied with authorization to build the intraday prototype. ES/AAPL intraday snapshots are separately sourced from Yahoo Finance (exact ESZ26.CME future) and Twelve Data (AAPL common stock); see `intraday-prototype.md`. Supplied NDX/SPX images remain contextual attachments and are not mislabeled as the selected ES/AAPL 15-minute data.

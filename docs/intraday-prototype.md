# November 2 intraday ride prototype

Owner requested one futures instrument and one Mag 7 stock at 15-minute resolution. This is a separate review prototype, not a replacement of the approved October 30 passenger pilot and not Phase 6 evaluation.

Review `/intraday.html?symbol=ES` and `/intraday.html?symbol=AAPL`. The dedicated HTML entry supplies November 2 preview metadata instead of reusing the default October recap's social description. The earlier `/?experience=intraday&symbol=...` route is also accepted, but Share uses the dedicated preview URL. Selecting an instrument resets time and preserves only that route's allowlisted parameters.

## Selection and data

- **ES:** exact December 2026 CME contract `ESZ26.CME`, normalized to `ES` with required `contract: ESZ26`; 26 complete 15-minute bars from the public Yahoo Finance chart response.
- **AAPL:** Nasdaq common stock; 26 complete 15-minute bars from the existing Twelve Data connection.
- Both cover **November 2, 2026, 09:30–16:00 America/New_York** (UTC−05:00). Futures overnight trading is excluded deliberately to compare the same cash-session window. This is not an ES settlement-price series.
- Stored in `public/intraday/2026-11-02-{es,aapl}-15m.json`. Browser playback and builds never contact providers. No provider credentials are published.
- ES response contained a 16:00 placeholder with null OHLC. Import excludes bar-open timestamps at/after 16:00 and validates all 26 completed bars; it does not fill missing candles.

Importer checks provider symbol, instrument type, exchange, interval, timezone and ES contract identity before normalizing. Runtime validation rejects wrong instruments, dates, contract, missing/duplicate intervals and invalid OHLC. Import refuses overwrite and requires the cash session to have closed. Existing saved snapshots make the retrieval scripts skip all provider requests.

Source references: [Twelve Data time series](https://twelvedata.com/docs), [Yahoo Finance exact ES December contract](https://sg.finance.yahoo.com/quote/ESZ26.CME/history/). The provider data is separate from the supplied thinkorswim captures; no prices were extracted from screenshot pixels.

## How the ride maps data

54 active seconds represent the full 390-minute session. Equal market time gets equal playback time. The track connects the session open to each successive 15-minute close using straight segments. Track height uses the same percentage-from-open scale for both symbols; price units and baseline remain instrument-specific. It does not impose the old climb/plunge/recovery template or force a bullish ending.

OHLC highs and lows are available in a readable table but are not animated in an invented intrabar sequence. Displayed in-between prices are explicitly marked interpolated. Train pitch follows the piecewise-linear track and passenger motion uses the resulting path speed. Scenery is illustrative; no distant candle is presented as intraday source data.

Switching instrument resets playback and context. Pause/Resume, Replay, visibility/blur pause, selected-instrument sharing and no-canvas text access are supported. Reduced motion uses a stationary track overview and changing text/progress rather than a traveling train/camera.

## Research corrections

The supplied November 2 note correctly identifies distinct NYSE and Nasdaq panels in the new $ADD screenshots. However, its comparison with Friday's purported NYSE approximately -45K reading inherits the prior mislabel: the supplied October 30 ES lower panel was Nasdaq. That cross-exchange absolute comparison is not used in prototype captions.

The note says **1:40 PM PT** while also discussing approximately 80 minutes remaining before the close. Those statements do not establish a consistent regular-session cutoff. The supplied screenshots show mixed capture times/timeframes; the AAPL image itself is hourly/daily/weekly, and ES is five-minute. We preserve the originals and do not label them 15-minute exports or synchronize their capture time with a particular saved bar. The prototype uses complete provider bars after cash close instead.

Original analysis is archived at `docs/editorial/november-2/original-analysis.md`. Public screenshots are copied with date-specific filenames, preserving the October 30 assets. The short ES context describes failed repair with positive breadth; AAPL context discusses its own leadership weakness. Automatically timed bar captions describe each selected instrument's actual close direction, not ES-specific causal claims on AAPL.

## Reproduce import

```powershell
npx tsx scripts/probe-intraday.ts
npm run ride:import -- AAPL test-results/intraday/aapl-provider.json
npx tsx scripts/probe-es-intraday.ts
npm run ride:import -- ES test-results/intraday/es-provider.json
```

These date-specific scripts are for this proof of concept, not a general authoring CMS. Fetch scripts skip when final snapshots exist; import is exclusive-write, so an existing snapshot must be deliberately reviewed rather than overwritten. A provider access error is a missing-data condition, not permission to substitute a related ETF/stock or generate prices.

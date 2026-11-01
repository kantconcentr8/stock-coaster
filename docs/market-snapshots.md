# Recap market snapshots

Market data is imported when preparing a recap, never while someone watches the ride.
The browser reads a saved same-origin JSON file once per page; Replay reuses it.
There is no live polling, WebSocket, scheduled job, or runtime provider endpoint.

## Prepare a recap

1. Add the recap JSON under `src/content/briefings/` with its `briefingId` and an explicit `coverageEnd` including the time-zone offset.
2. Keep `TWELVE_DATA_API_KEY` in the Git-ignored `.env.local`. Do not use a `VITE_` prefix.
3. After the session closes, run:

   ```powershell
   npm run recap:snapshot -- 2026-10-31-lower-value
   ```

   Replace the ID for a new recap. Without an argument, the command uses the default briefing.
   The session date comes from `coverageEnd` in America/New_York, not the publication date or the machine's local date.
4. Review `public/market/<briefingId>.json`, including its `unavailable` list, then include it with that recap's deployment.
5. Open `/?prototype=coaster&b=<briefingId>`. The data disclosure shows the session date, provider, instrument types, and daily OHLC table.

The importer waits until at least 16:15 New York time and 15 minutes beyond the editorial cutoff. On early-close days it conservatively waits until 16:15; it does not guess exchange holidays. It requires an exact-date bar, so a weekend or holiday does not silently substitute a different session.

Each symbol is requested once during an import, spaced nine seconds apart. A complete 14-symbol attempt takes about two minutes. No automatic retries occur. A saved, matching snapshot skips all provider calls on subsequent invocations. Existing snapshots are not overwritten; changing a recap's coverage date requires explicit review. Authentication/quota failure stops the import without publishing a partial file. Other unavailable symbols are omitted and recorded; a snapshot needs at least one verified candle.

## Current coverage

The October 30 session snapshot for `2026-10-31-lower-value` contains AAPL, MSFT, AMZN, GOOGL, META, NVDA, TSLA, SPY, QQQ and IWM.
NDX, SPX, VIX and ES did not yield matching index/futures daily bars. Symbol discovery returned unrelated listings for NDX/SPX, VIX-linked ETFs, and Eversource stock for ES; these are not substitutes. Exact provider index/futures identifiers and access remain unresolved. No index/futures candles are claimed.

## Rendering and integrity

Labeled candles use the saved daily open, high, low and close, with each symbol scaled independently. Body/wick proportions reflect that bar; candle heights are not a shared dollar axis. `O/C` is the open-to-close percentage move, not the change from the previous close. Cream means close at or above open; orange means close below open.
The unlabelled distant scenery and coaster geometry remain illustrative. The train does not follow the saved price data. The data disclosure has an accessible HTML table in addition to canvas labels. Missing or invalid snapshots retain an explicitly illustrative background and never block Start.

Only validated prices and fixed metadata are saved. The API key is sent to Twelve Data in an Authorization header from the local Node importer, never stored in a snapshot or browser code. Vercel needs no API secret for playback. Publishing a new recap includes its saved file; importing is deliberately separate from page loading and from builds.

API references: [Twelve Data time series and authentication](https://twelvedata.com/docs), [historical date-range behavior](https://support.twelvedata.com/en/articles/5214728-getting-historical-data).

This data integration does not approve the draft editorial briefing, close the release gate, enable analytics, or start Phase 6.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { loadEnv } from 'vite';
import {
  MARKET_SYMBOLS,
  isMarketSnapshot,
  parseMarketCandle,
  type MarketSnapshot,
} from '../src/content/marketSnapshot';
import { defaultBriefingId } from '../src/content/loader';

class ImportError extends Error {}

async function main() {
  const id = process.argv[2] ?? defaultBriefingId;
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(id)) throw new ImportError('Invalid recap ID.');
  const output = resolve('public/market', `${id}.json`);
  const briefing = JSON.parse(
    await readFile(resolve('src/content/briefings', `${id}.json`), 'utf8'),
  );
  const cutoff = new Date(briefing.coverageEnd);
  if (!Number.isFinite(cutoff.getTime())) throw new ImportError('Recap needs a valid coverageEnd.');
  const sessionDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(cutoff);
  let saved: string | undefined;
  try {
    saved = await readFile(output, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (saved !== undefined) {
    const existing: unknown = JSON.parse(saved);
    if (!isMarketSnapshot(existing, id) || existing.sessionDate !== sessionDate)
      throw new ImportError(
        'Existing snapshot does not match recap metadata. Review it before importing again.',
      );
    console.log(`Snapshot already saved for ${id}; no API requests made.`);
    return;
  }
  // Conservative early-close policy: wait for the normal close rather than guess a calendar.
  const localNow = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (type: string) => localNow.find((p) => p.type === type)!.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  if (
    today < sessionDate ||
    (today === sessionDate && `${part('hour')}:${part('minute')}` < '16:15')
  )
    throw new ImportError('Wait until 16:15 America/New_York after the session closes.');
  if (Date.now() < cutoff.getTime() + 15 * 60_000)
    throw new ImportError('Wait until 15 minutes after the recap coverage cutoff.');
  const key = loadEnv('development', process.cwd(), '').TWELVE_DATA_API_KEY;
  if (!key) throw new ImportError('Set TWELVE_DATA_API_KEY in .env.local.');
  const snapshot: MarketSnapshot = {
    version: 1,
    briefingId: id,
    sessionDate,
    fetchedAt: new Date().toISOString(),
    source: 'Twelve Data',
    candles: [],
    unavailable: [],
  };
  for (const [index, [symbol, kind]] of MARKET_SYMBOLS.entries()) {
    // Conservative pacing: fewer than eight requests/minute, no background polling or retries.
    if (index > 0) await delay(9000);
    const url = new URL('https://api.twelvedata.com/time_series');
    url.search = new URLSearchParams({
      symbol,
      interval: '1day',
      start_date: sessionDate,
      end_date: `${sessionDate} 23:59:59`,
      outputsize: '1',
      prepost: 'false',
      adjust: 'none',
      ...(kind === 'stock' || kind === 'etf' ? { country: 'United States' } : {}),
    }).toString();
    try {
      const response = await fetch(url, {
        headers: { Authorization: `apikey ${key}` },
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (response.status === 401 || data.code === 401) throw new ImportError('AUTH');
      if (response.status === 429 || data.code === 429) throw new ImportError('LIMIT');
      const candle = response.ok ? parseMarketCandle(data, symbol, kind, sessionDate) : undefined;
      if (candle) {
        snapshot.candles.push(candle);
        console.log(`${symbol}: saved ${sessionDate} daily OHLC.`);
      } else {
        snapshot.unavailable.push(symbol);
        console.log(`${symbol}: no matching daily bar or account access; omitted.`);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH')
        throw new ImportError('API authentication failed; check the key. No snapshot written.', {
          cause: error,
        });
      if (error instanceof Error && error.message === 'LIMIT')
        throw new ImportError(
          'API rate/quota limit reached. No snapshot written; no automatic retry.',
          { cause: error },
        );
      snapshot.unavailable.push(symbol);
      console.log(`${symbol}: request failed; omitted.`);
    }
  }
  if (!snapshot.candles.length)
    throw new ImportError('No verified candles returned. No snapshot written.');
  await mkdir(resolve('public/market'), { recursive: true });
  // Exclusive write: a recap snapshot is never silently replaced.
  await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' });
  console.log(
    `Saved ${snapshot.candles.length}/${MARKET_SYMBOLS.length} candles to public/market/${id}.json. No credentials stored.`,
  );
}
main().catch((error) => {
  // Never print transport errors, request objects, environment or credentials.
  console.error(
    error instanceof ImportError
      ? error.message
      : 'Snapshot import stopped. Check recap content or network access. No existing snapshot was changed.',
  );
  process.exitCode = 1;
});

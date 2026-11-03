import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  validateIntraday,
  SESSION,
  type Instrument,
  type IntradayRide,
} from '../src/intraday/data';

const symbol = process.argv[2] as Instrument;
const input = process.argv[3];
if (!['AAPL', 'ES'].includes(symbol) || !input)
  throw new Error('Usage: npm run ride:import -- AAPL|ES <JSON file>');
const raw = JSON.parse(await readFile(resolve(input), 'utf8'));
let candidate: unknown = raw;
if (raw.chart) {
  const result = raw.chart.result?.[0];
  if (
    symbol !== 'ES' ||
    result?.meta?.symbol !== 'ESZ26.CME' ||
    result.meta.instrumentType !== 'FUTURE' ||
    result.meta.exchangeName !== 'CME' ||
    result.meta.shortName !== 'E-Mini S&P 500 Dec 26' ||
    result.meta.dataGranularity !== '15m' ||
    result.meta.exchangeTimezoneName !== 'America/New_York'
  )
    throw new Error(
      'Public provider response is not the exact ES December 2026 CME contract at 15 minutes.',
    );
  const quote = result.indicators?.quote?.[0];
  if (!quote || !Array.isArray(result.timestamp)) throw new Error('Missing futures OHLC.');
  const start = Date.parse(`${SESSION}T09:30:00-05:00`) / 1000;
  const end = Date.parse(`${SESSION}T16:00:00-05:00`) / 1000;
  candidate = {
    version: 1,
    symbol,
    kind: 'future',
    contract: 'ESZ26',
    sessionDate: SESSION,
    intervalMinutes: 15,
    timezone: 'America/New_York',
    session: 'US cash hours',
    source: 'Yahoo Finance / CME ESZ26.CME',
    fetchedAt: new Date().toISOString(),
    bars: result.timestamp.flatMap((timestamp: number, index: number) =>
      timestamp >= start && timestamp < end
        ? [
            {
              time: new Date(timestamp * 1000).toISOString(),
              open: quote.open[index],
              high: quote.high[index],
              low: quote.low[index],
              close: quote.close[index],
            },
          ]
        : [],
    ),
  } satisfies IntradayRide;
}
if (raw.meta && raw.values) {
  if (
    symbol !== 'AAPL' ||
    raw.meta.symbol !== 'AAPL' ||
    raw.meta.type !== 'Common Stock' ||
    raw.meta.interval !== '15min' ||
    raw.meta.exchange_timezone !== 'America/New_York' ||
    raw.meta.exchange !== 'NASDAQ'
  )
    throw new Error(
      'Provider identity/interval/timezone does not match AAPL. Futures require an explicit ESZ26 export.',
    );
  candidate = {
    version: 1,
    symbol,
    kind: 'stock',
    sessionDate: SESSION,
    intervalMinutes: 15,
    timezone: 'America/New_York',
    session: 'US cash hours',
    source: 'Twelve Data',
    fetchedAt: new Date().toISOString(),
    bars: raw.values
      .map((bar: Record<string, string>) => ({
        time: `${bar.datetime!.replace(' ', 'T')}-05:00`,
        open: Number(bar.open),
        high: Number(bar.high),
        low: Number(bar.low),
        close: Number(bar.close),
      }))
      .sort((a: { time: string }, b: { time: string }) => a.time.localeCompare(b.time)),
  } satisfies IntradayRide;
}
const ride = validateIntraday(candidate, symbol);
const close = Date.parse(`${SESSION}T16:00:00-05:00`);
if (Date.now() < close) throw new Error('Only complete, closed cash sessions can be imported.');
await mkdir('public/intraday', { recursive: true });
const output = resolve('public/intraday', `${SESSION}-${symbol.toLowerCase()}-15m.json`);
await writeFile(output, `${JSON.stringify(ride, null, 2)}\n`, { flag: 'wx' });
console.log(
  `Saved ${ride.bars.length} verified ${symbol} bars; playback makes no provider requests.`,
);

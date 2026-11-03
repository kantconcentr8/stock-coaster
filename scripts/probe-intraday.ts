import { loadEnv } from 'vite';
import { existsSync } from 'node:fs';
if (existsSync('public/intraday/2026-11-02-aapl-15m.json')) {
  console.log('AAPL snapshot already saved; no API requests made.');
  process.exit(0);
}
if (Date.now() < Date.parse('2026-11-02T16:00:00-05:00'))
  throw new Error('Wait until the cash session closes.');
const key = loadEnv('development', process.cwd(), '').TWELVE_DATA_API_KEY;
if (!key) throw new Error('Existing Twelve Data key is unavailable.');
const url = new URL('https://api.twelvedata.com/time_series');
url.search = new URLSearchParams({
  symbol: 'AAPL',
  interval: '15min',
  start_date: '2026-11-02 09:30:00',
  end_date: '2026-11-02 16:00:00',
  timezone: 'America/New_York',
  order: 'asc',
  outputsize: '30',
  prepost: 'false',
  adjust: 'none',
  country: 'United States',
}).toString();
const response = await fetch(url, {
  headers: { Authorization: `apikey ${key}` },
  signal: AbortSignal.timeout(20000),
});
const data = await response.json();
console.log(
  JSON.stringify({
    http: response.status,
    status: data.status,
    code: data.code,
    symbol: data.meta?.symbol,
    type: data.meta?.type,
    interval: data.meta?.interval,
    timezone: data.meta?.exchange_timezone,
    count: data.values?.length,
    first: data.values?.[0]?.datetime,
    last: data.values?.at(-1)?.datetime,
  }),
);
if (
  response.ok &&
  data.meta?.symbol === 'AAPL' &&
  data.meta?.interval === '15min' &&
  data.values?.length
) {
  const { mkdir, writeFile } = await import('node:fs/promises');
  await mkdir('test-results/intraday', { recursive: true });
  await writeFile('test-results/intraday/aapl-provider.json', JSON.stringify(data, null, 2));
}

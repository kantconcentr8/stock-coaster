import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
if (existsSync('public/intraday/2026-11-02-es-15m.json')) {
  console.log('ES snapshot already saved; no API requests made.');
  process.exit(0);
}
if (Date.now() < Date.parse('2026-11-02T16:00:00-05:00')) throw new Error('Wait until cash close.');
const url = new URL('https://query1.finance.yahoo.com/v8/finance/chart/ESZ26.CME');
url.search = new URLSearchParams({
  period1: String(Date.parse('2026-11-02T09:30:00-05:00') / 1000),
  period2: String(Date.parse('2026-11-02T16:00:00-05:00') / 1000),
  interval: '15m',
}).toString();
const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
console.log(`Public ES contract data request: HTTP ${response.status}`);
if (response.ok) {
  const raw = await response.json();
  const result = raw.chart?.result?.[0];
  console.log(
    JSON.stringify({
      symbol: result?.meta?.symbol,
      type: result?.meta?.instrumentType,
      exchange: result?.meta?.exchangeName,
      name: result?.meta?.shortName,
      interval: result?.meta?.dataGranularity,
      count: result?.timestamp?.length,
    }),
  );
  if (result) {
    await mkdir('test-results/intraday', { recursive: true });
    await writeFile('test-results/intraday/es-provider.json', JSON.stringify(raw, null, 2));
  }
}

export type Instrument = 'AAPL' | 'ES';
export interface Bar {
  time: string; // Bar-open ISO timestamp with explicit offset; UTC is also accepted.
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface IntradayRide {
  version: 1;
  symbol: Instrument;
  kind: 'stock' | 'future';
  contract?: string;
  sessionDate: string;
  intervalMinutes: 15;
  timezone: 'America/New_York';
  session: 'US cash hours';
  source: string;
  fetchedAt: string;
  bars: Bar[];
}
export const SESSION = '2026-11-02';
export const DURATION = 54;

/** Full, contiguous cash-session bars. Never substitute stocks for futures or infer OHLC from pixels. */
export function validateIntraday(value: unknown, symbol: Instrument): IntradayRide {
  const data = value as IntradayRide;
  if (
    !data ||
    data.version !== 1 ||
    data.symbol !== symbol ||
    data.sessionDate !== SESSION ||
    data.intervalMinutes !== 15 ||
    data.timezone !== 'America/New_York' ||
    data.session !== 'US cash hours' ||
    data.kind !== (symbol === 'ES' ? 'future' : 'stock') ||
    (symbol === 'ES' && data.contract !== 'ESZ26') ||
    typeof data.source !== 'string' ||
    !data.source.trim() ||
    !Number.isFinite(Date.parse(data.fetchedAt)) ||
    !Array.isArray(data.bars) ||
    data.bars.length !== 26
  )
    throw new Error(
      'Expected verified November 2 cash-session 15-minute bars for this instrument.',
    );
  const start = Date.parse(`${SESSION}T09:30:00-05:00`);
  data.bars.forEach((bar, index) => {
    if (
      !bar ||
      typeof bar.time !== 'string' ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(bar.time) ||
      Date.parse(bar.time) !== start + index * 900000 ||
      ![bar.open, bar.high, bar.low, bar.close].every((n) => Number.isFinite(n) && n > 0) ||
      bar.low > Math.min(bar.open, bar.close) ||
      bar.high < Math.max(bar.open, bar.close) ||
      bar.low > bar.high
    )
      throw new Error('Bars must be contiguous, correctly timed and valid OHLC.');
  });
  return data;
}

export async function loadIntraday(symbol: Instrument): Promise<IntradayRide> {
  const response = await fetch(`/intraday/${SESSION}-${symbol.toLowerCase()}-15m.json`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('No saved intraday series');
  return validateIntraday(await response.json(), symbol);
}

export function priceAt(ride: IntradayRide, progress: number) {
  const values = [ride.bars[0]!.open, ...ride.bars.map((bar) => bar.close)];
  const cursor = Math.max(0, Math.min(1, progress)) * ride.bars.length;
  const index = Math.min(Math.floor(cursor), values.length - 2);
  return values[index]! + (values[index + 1]! - values[index]!) * (cursor - index);
}

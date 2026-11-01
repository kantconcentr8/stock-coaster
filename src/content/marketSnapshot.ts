export interface MarketCandle {
  symbol: string;
  kind: 'stock' | 'etf' | 'index' | 'future';
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface MarketSnapshot {
  version: 1;
  briefingId: string;
  sessionDate: string;
  fetchedAt: string;
  source: 'Twelve Data';
  candles: MarketCandle[];
  unavailable: string[];
}
export const MARKET_SYMBOLS = [
  ['AAPL', 'stock'],
  ['MSFT', 'stock'],
  ['AMZN', 'stock'],
  ['GOOGL', 'stock'],
  ['META', 'stock'],
  ['NVDA', 'stock'],
  ['TSLA', 'stock'],
  ['SPY', 'etf'],
  ['QQQ', 'etf'],
  ['IWM', 'etf'],
  ['NDX', 'index'],
  ['SPX', 'index'],
  ['VIX', 'index'],
  ['ES', 'future'],
] as const;

/** Only exact-date, correctly identified daily bars become public candles. */
export function parseMarketCandle(
  payload: unknown,
  symbol: string,
  kind: MarketCandle['kind'],
  date: string,
): MarketCandle | undefined {
  if (!payload || typeof payload !== 'object') return;
  const data = payload as Record<string, unknown>;
  const meta = data.meta as Record<string, unknown> | undefined;
  const types = {
    stock: /^(Common Stock|Stock)$/i,
    etf: /^ETF$/i,
    index: /^Index$/i,
    future: /^(Future|Futures)$/i,
  };
  if (
    !meta ||
    meta.symbol !== symbol ||
    meta.interval !== '1day' ||
    typeof meta.type !== 'string' ||
    !types[kind].test(meta.type)
  )
    return;
  // Restrict stocks and ETFs to their US listing; do not silently accept a foreign namesake.
  if ((kind === 'stock' || kind === 'etf') && meta.exchange_timezone !== 'America/New_York') return;
  if (!Array.isArray(data.values)) return;
  const bar = data.values.find((v: Record<string, unknown>) => v?.datetime === date);
  if (!bar) return;
  const values = ['open', 'high', 'low', 'close'].map((key) => {
    const value = bar[key];
    return (typeof value === 'string' && value.trim() !== '') || typeof value === 'number'
      ? Number(value)
      : NaN;
  });
  const [open, high, low, close] = values as [number, number, number, number];
  if (
    !values.every((v) => Number.isFinite(v) && v > 0) ||
    high < Math.max(open, close) ||
    low > Math.min(open, close) ||
    high < low
  )
    return;
  return { symbol, kind, date, open, high, low, close };
}

export function isMarketSnapshot(value: unknown, briefingId: string): value is MarketSnapshot {
  if (!value || typeof value !== 'object') return false;
  const data = value as MarketSnapshot;
  return (
    data.version === 1 &&
    data.briefingId === briefingId &&
    data.source === 'Twelve Data' &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.sessionDate) &&
    Number.isFinite(Date.parse(data.fetchedAt)) &&
    Array.isArray(data.unavailable) &&
    data.unavailable.every((s) => typeof s === 'string') &&
    Array.isArray(data.candles) &&
    data.candles.length > 0 &&
    data.candles.every((c) => c && typeof c === 'object') &&
    new Set(data.candles.map((c) => c.symbol)).size === data.candles.length &&
    data.candles.every(
      (c) =>
        MARKET_SYMBOLS.some(([s, k]) => s === c.symbol && k === c.kind) &&
        c.date === data.sessionDate &&
        [c.open, c.high, c.low, c.close].every(
          (v) => typeof v === 'number' && Number.isFinite(v) && v > 0,
        ) &&
        c.high >= Math.max(c.open, c.close) &&
        c.low <= Math.min(c.open, c.close),
    )
  );
}

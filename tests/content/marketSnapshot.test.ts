import { describe, expect, it } from 'vitest';
import { isMarketSnapshot, parseMarketCandle } from '../../src/content/marketSnapshot';

const date = '2026-10-30';
const id = '2026-10-31-lower-value';
const payload = {
  meta: {
    symbol: 'AAPL',
    interval: '1day',
    type: 'Common Stock',
    exchange_timezone: 'America/New_York',
  },
  values: [{ datetime: date, open: '100', high: '110', low: '95', close: '105' }],
};
describe('dated daily market snapshots', () => {
  it('retains actual daily OHLC and instrument identity', () => {
    expect(parseMarketCandle(payload, 'AAPL', 'stock', date)).toEqual({
      symbol: 'AAPL',
      kind: 'stock',
      date,
      open: 100,
      high: 110,
      low: 95,
      close: 105,
    });
  });
  it('rejects wrong session, foreign namesake, interval and instrument type', () => {
    expect(parseMarketCandle(payload, 'AAPL', 'stock', '2026-10-29')).toBeUndefined();
    expect(parseMarketCandle(payload, 'ES', 'future', date)).toBeUndefined();
    for (const meta of [
      { ...payload.meta, exchange_timezone: 'Europe/London' },
      { ...payload.meta, type: 'ETF' },
      { ...payload.meta, interval: '1min' },
      { ...payload.meta, symbol: 'SPY' },
    ])
      expect(parseMarketCandle({ ...payload, meta }, 'AAPL', 'stock', date)).toBeUndefined();
  });
  it('rejects invalid prices, API errors and out-of-range bodies', () => {
    for (const bar of [
      { ...payload.values[0], high: '99' },
      { ...payload.values[0], low: '106' },
      { ...payload.values[0], close: 'NaN' },
      { ...payload.values[0], open: '' },
      { ...payload.values[0], low: '-1' },
    ])
      expect(
        parseMarketCandle({ ...payload, values: [bar] }, 'AAPL', 'stock', date),
      ).toBeUndefined();
    expect(
      parseMarketCandle({ status: 'error', code: 429 }, 'AAPL', 'stock', date),
    ).toBeUndefined();
    expect(parseMarketCandle(null, 'AAPL', 'stock', date)).toBeUndefined();
  });
  it('validates saved identity, session, duplicates and numeric values', () => {
    const candle = parseMarketCandle(payload, 'AAPL', 'stock', date)!;
    const snapshot = {
      version: 1,
      briefingId: id,
      sessionDate: date,
      fetchedAt: '2026-11-01T12:00:00Z',
      source: 'Twelve Data',
      candles: [candle],
      unavailable: ['ES'],
    };
    expect(isMarketSnapshot(snapshot, id)).toBe(true);
    expect(isMarketSnapshot(snapshot, 'other-recap')).toBe(false);
    for (const change of [
      { sessionDate: '2026-11-02' },
      { source: 'other' },
      { candles: [] },
      { candles: [candle, candle] },
      { candles: [{ ...candle, close: '105' }] },
      { candles: [null] },
      { fetchedAt: 'invalid' },
    ])
      expect(isMarketSnapshot({ ...snapshot, ...change }, id)).toBe(false);
  });
});

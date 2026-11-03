import { expect, it } from 'vitest';
import saved from '../../public/intraday/2026-11-02-aapl-15m.json';
import esSaved from '../../public/intraday/2026-11-02-es-15m.json';
import { priceAt, validateIntraday } from '@/intraday/data';
import { createPriceTrack } from '@/intraday/track';

it('uses all saved bars with exact open and close endpoints and no spline overshoot', () => {
  const ride = validateIntraday(saved, 'AAPL');
  const track = createPriceTrack(ride);
  expect(priceAt(ride, 0)).toBe(ride.bars[0]!.open);
  expect(priceAt(ride, 1)).toBe(ride.bars.at(-1)!.close);
  const open = ride.bars[0]!.open;
  for (let index = 0; index < 26; index++) {
    const from = index === 0 ? open : ride.bars[index - 1]!.close;
    const to = ride.bars[index]!.close;
    const middle = priceAt(ride, (index + 0.5) / 26);
    expect(middle).toBeCloseTo((from + to) / 2);
    expect(track.atX((index + 1) * 150).y).toBeCloseTo(-(to / open - 1) * 100 * 220);
  }
  expect(track.atX(3900).y).toBeGreaterThan(track.atX(0).y);
});

it('rejects wrong instruments, missing bars, wrong sessions, invalid OHLC and incomplete contracts', () => {
  for (const mutate of [
    (value: typeof saved) => {
      value.bars.pop();
    },
    (value: typeof saved) => {
      value.bars[1]!.time = value.bars[0]!.time;
    },
    (value: typeof saved) => {
      value.bars[0]!.high = 1;
    },
    (value: typeof saved) => {
      value.sessionDate = '2026-10-30';
    },
    (value: typeof saved) => {
      value.intervalMinutes = 5;
    },
  ]) {
    const value = structuredClone(saved);
    mutate(value);
    expect(() => validateIntraday(value, 'AAPL')).toThrow();
  }
  expect(() => validateIntraday(saved, 'ES')).toThrow();
  expect(() => validateIntraday({ ...saved, symbol: 'ES', kind: 'future' }, 'ES')).toThrow();
});

it('uses the exact futures contract and its independent price path', () => {
  const es = validateIntraday(esSaved, 'ES');
  expect(es.contract).toBe('ESZ26');
  expect(priceAt(es, 0)).toBe(7649);
  expect(priceAt(es, 1)).toBe(7576.25);
  expect(createPriceTrack(es).atX(3900).y).not.toBeCloseTo(
    createPriceTrack(validateIntraday(saved, 'AAPL')).atX(3900).y,
  );
  expect(() => validateIntraday({ ...esSaved, contract: 'ESU26' }, 'ES')).toThrow();
});

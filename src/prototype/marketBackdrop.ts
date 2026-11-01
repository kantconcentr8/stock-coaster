import { el } from '@/ui/dom';
import { defaultBriefingId } from '@/content/loader';
import { isMarketSnapshot, type MarketCandle } from '@/content/marketSnapshot';

/** One same-origin saved-file read per page. Never contacts the market-data provider. */
export function createMarketBackdrop(root: HTMLElement) {
  const state: { candles: MarketCandle[] } = { candles: [] };
  const id = new URLSearchParams(location.search).get('b') ?? defaultBriefingId;
  const status = el('details', { class: 'ride-market' });
  const summary = el('summary', { text: 'Illustrative candles / No saved recap data' });
  status.append(summary);
  root.append(status);
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(id)) return state;
  void fetch(`/market/${encodeURIComponent(id)}.json`, { signal: AbortSignal.timeout(5000) })
    .then(async (response) => {
      if (!response.ok) return;
      const snapshot: unknown = await response.json();
      if (!isMarketSnapshot(snapshot, id)) return;
      state.candles = snapshot.candles;
      summary.textContent = `${snapshot.sessionDate} close / ${snapshot.candles.length} ${snapshot.candles.length === 1 ? 'symbol' : 'symbols'} / Twelve Data`;
      const panel = el('div', { class: 'ride-market-panel' }, [
        el('p', {
          text: 'Labeled candles use saved daily OHLC, scaled independently. O/C is the open-to-close move. Cream: close at or above open. Orange: close below open. Unlabeled scenery and coaster track remain illustrative.',
        }),
      ]);
      const table = el('table');
      const head = el('tr');
      for (const label of ['Symbol', 'Type', 'Open', 'High', 'Low', 'Close'])
        head.append(el('th', { scope: 'col', text: label }));
      table.append(el('thead', {}, [head]));
      const body = el('tbody');
      for (const candle of snapshot.candles) {
        const row = el('tr');
        for (const value of [
          candle.symbol,
          candle.kind,
          ...[candle.open, candle.high, candle.low, candle.close].map((n) => n.toFixed(2)),
        ]) {
          row.append(el('td', { text: value }));
        }
        body.append(row);
      }
      table.append(body);
      panel.append(table);
      if (snapshot.unavailable.length)
        panel.append(
          el('p', {
            text: `Unavailable in this snapshot: ${snapshot.unavailable.join(', ')}. No substitute data used.`,
          }),
        );
      panel.append(
        el('a', {
          href: 'https://twelvedata.com',
          target: '_blank',
          rel: 'noopener noreferrer',
          text: 'Data: Twelve Data',
        }),
      );
      status.append(panel);
    })
    .catch(() => {
      /* Missing or invalid snapshot leaves the illustrative ride available. */
    });
  return state;
}

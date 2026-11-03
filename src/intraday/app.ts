import { el } from '@/ui/dom';
import { DURATION, loadIntraday, priceAt, type Instrument, type IntradayRide } from './data';
import { createIntradayScene } from './scene';
import './style.css';

const research: Record<Instrument, string> = {
  ES: 'The supplied November 2 analysis describes an opening repair attempt that failed while $ADD remained positive. Positive breadth alone did not repair price structure.',
  AAPL: 'The supplied AAPL screenshot shows leadership weakness. This ride uses a separately saved, complete cash-session series; it is not a reconstruction of that screenshot or an ES-specific narrative.',
};
export function mountIntraday() {
  const root = el('main', {
    class: 'intraday',
    'aria-label': 'November 2 intraday ride prototype',
  });
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const title = el('h1', { text: 'Ride the session.' });
  const selectors = el('div', { class: 'instrument-selectors', 'aria-label': 'Select instrument' });
  const buttons = new Map<Instrument, HTMLButtonElement>();
  const heading = el('h2');
  const status = el('p', { role: 'status' });
  const explanation = el('p');
  const clock = el('p', { class: 'intraday-clock' });
  const caption = el('p', { class: 'intraday-caption' });
  const progress = el('progress', {
    max: String(DURATION),
    value: '0',
    'aria-label': 'Ride progress',
  }) as HTMLProgressElement;
  const start = el('button', { type: 'button', text: 'Start ride' }) as HTMLButtonElement;
  const replay = el('button', { type: 'button', text: 'Replay' }) as HTMLButtonElement;
  const share = el('button', { type: 'button', text: 'Share selected ride' });
  const shareStatus = el('p', { role: 'status' });
  const shareInput = el('input', {
    readonly: '',
    hidden: '',
    'aria-label': 'Selected ride link',
  }) as HTMLInputElement;
  const read = el('button', { type: 'button', text: 'Read context & bars' });
  const panel = el('dialog', { 'aria-labelledby': 'intraday-context-title' }) as HTMLDialogElement;
  const close = el('button', { type: 'button', text: 'Back to ride' });
  const panelBody = el('div');
  panel.append(
    el('h2', { id: 'intraday-context-title', text: 'November 2 — charts, context & bars' }),
    close,
    panelBody,
  );
  root.append(
    canvas,
    el('header', {}, [
      el('p', { class: 'eyebrow', text: '15-minute ride / prototype' }),
      title,
      el('p', { text: 'November 2, 2026 · 09:30–16:00 New York · 54-second playback' }),
      selectors,
      read,
    ]),
    el('section', { class: 'intraday-summary', 'aria-label': 'Selected session' }, [
      heading,
      status,
      explanation,
    ]),
    el('footer', {}, [
      clock,
      caption,
      progress,
      el('div', { class: 'intraday-controls' }, [start, replay, share]),
      shareStatus,
      shareInput,
    ]),
    panel,
  );
  document.body.replaceChildren(root);
  let selected: Instrument = 'AAPL',
    data: IntradayRide | undefined;
  let scene: ReturnType<typeof createIntradayScene>,
    running = false,
    generation = 0;
  const cache = new Map<Instrument, Promise<IntradayRide>>();
  const displayTime = (progress: number) => {
    const minute = 570 + Math.floor(progress * 390);
    return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')} NY`;
  };
  function render(time: number, playing: boolean) {
    root.dataset.phase = time > 0 || playing ? 'ride' : 'intro';
    running = playing;
    progress.value = time;
    const complete = time >= DURATION;
    start.textContent = playing
      ? 'Pause ride'
      : complete
        ? 'Ride again'
        : time > 0
          ? 'Resume ride'
          : 'Start ride';
    if (!data) return;
    const price = priceAt(data, time / DURATION);
    const quote = (value: number) =>
      selected === 'ES' ? `${value.toFixed(2)} pts` : `$${value.toFixed(2)}`;
    clock.textContent = `${selected} · ${displayTime(time / DURATION)} · interpolated path ${quote(price)}`;
    const index = Math.max(0, Math.min(25, Math.floor((time / DURATION) * 26)));
    const bar = data.bars[index]!;
    const prior = index === 0 ? bar.open : data.bars[index - 1]!.close;
    caption.textContent = complete
      ? `${selected} session complete. The ending follows its final saved close; no forecast is drawn.`
      : `${selected} ${displayTime(index / 26).slice(0, 5)}–${displayTime((index + 1) / 26).slice(0, 5)}: close ${bar.close > prior ? 'above' : bar.close < prior ? 'below' : 'equal to'} the prior path point. ${quote(bar.close)}.`;
  }
  function buildContext() {
    panelBody.replaceChildren(
      el('p', { text: research[selected] }),
      el('p', {
        text: 'The track connects the session open to each 15-minute close with straight segments. Highs and lows are listed below, but their unknown order inside a bar is not animated. Equal market time gets equal playback time. Track height represents percentage change from the open; scenery is illustrative.',
      }),
      el('p', {
        text: 'The research labels its update 1:40 PM PT while also referring to time remaining before the close. Those timing statements are inconsistent. We do not infer a synchronized cutoff; this prototype uses a complete 09:30–16:00 New York session when saved bars are available.',
      }),
      el('p', {
        text: 'Correction: the prior October 30 ES lower panel was Nasdaq, not NYSE. The new notes’ comparison of a prior roughly -45K NYSE reading with November 2 NYSE breadth is not supported. Different exchange/window cumulative totals are not directly compared here. Price and breadth remain distinct.',
      }),
      el('p', {
        text: 'Source images are reproduced unchanged. They show mixed 1-minute, 5-minute, hourly, daily and weekly views; none is represented as a 15-minute export.',
      }),
    );
    for (const [label, path] of [
      ['ES / December 2026 futures — 5-minute screenshot', 'es.jpg'],
      ['AAPL — mixed-timeframe screenshot', 'aapl.png'],
      ['$ADD — 1-minute and cumulative panels', 'add-1m.jpg'],
      ['$ADD — 20-day hourly and cumulative panels', 'add-hourly.jpg'],
    ])
      panelBody.append(
        el('p', {}, [
          el('a', {
            href: `/charts/november-2-${path}`,
            target: '_blank',
            rel: 'noopener noreferrer',
            text: label!,
          }),
        ]),
      );
    panelBody.append(
      el('p', {
        text: 'Charts: owner-supplied thinkorswim screenshots. Context: supplied November 2 analysis. Educational prototype, not investment advice. Playback never contacts a data provider.',
      }),
    );
    if (!data) {
      panelBody.append(
        el('p', {
          text: 'Verified 15-minute bars are not available for this selection. No substitute path is drawn.',
        }),
      );
      return;
    }
    panelBody.append(
      el('p', {
        text: `${data.source} · ${data.symbol}${data.contract ? ` / ${data.contract}` : ''} · ${data.bars.length} closed bars · ${data.timezone}. Cash-session comparison excludes futures overnight trading. Displayed price between bar endpoints is interpolated, not an observed tick.`,
      }),
    );
    const table = el('table'),
      head = el('tr');
    for (const label of ['Bar open (NY)', 'Open', 'High', 'Low', 'Close'])
      head.append(el('th', { scope: 'col', text: label }));
    table.append(el('thead', {}, [head]));
    const body = el('tbody');
    for (const bar of data.bars)
      body.append(
        el(
          'tr',
          {},
          [
            new Intl.DateTimeFormat('en-GB', {
              timeZone: 'America/New_York',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(bar.time)),
            ...[bar.open, bar.high, bar.low, bar.close].map((n) => n.toFixed(2)),
          ].map((text) => el('td', { text })),
        ),
      );
    table.append(body);
    panelBody.append(
      el(
        'div',
        { class: 'bars-scroll', tabindex: '0', 'aria-label': 'Saved 15-minute OHLC bars' },
        [table],
      ),
    );
  }
  async function select(symbol: Instrument) {
    const ticket = ++generation;
    scene?.destroy();
    scene = undefined;
    data = undefined;
    selected = symbol;
    running = false;
    start.textContent = 'Start ride';
    start.disabled = true;
    replay.disabled = true;
    progress.value = 0;
    clock.textContent = '';
    caption.textContent = '';
    shareStatus.textContent = '';
    shareInput.hidden = true;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    for (const [key, button] of buttons)
      button.setAttribute('aria-pressed', String(key === symbol));
    root.dataset.phase = 'intro';
    heading.textContent = symbol === 'ES' ? 'Futures · ES / December 2026' : 'Mag 7 · AAPL';
    explanation.textContent = research[symbol];
    status.textContent = 'Loading saved 15-minute bars…';
    const url = new URL(location.href);
    url.search = new URLSearchParams({ experience: 'intraday', symbol }).toString();
    url.hash = '';
    history.replaceState(null, '', url);
    document.title = `${symbol} · November 2 / 15-minute ride prototype`;
    try {
      if (!cache.has(symbol)) cache.set(symbol, loadIntraday(symbol));
      const loaded = await cache.get(symbol)!;
      if (ticket !== generation) return;
      data = loaded;
      scene = createIntradayScene(canvas, data, render);
      status.textContent = scene
        ? `${data.bars.length} saved 15-minute bars · ${data.source}`
        : 'Graphics unavailable. Read the saved bars and context.';
      start.disabled = !scene;
      replay.disabled = !scene;
      render(0, false);
    } catch {
      if (ticket !== generation) return;
      status.textContent =
        symbol === 'ES'
          ? 'Awaiting verified ESZ26 15-minute export. ES is a futures contract; no stock or index substitute is used.'
          : 'Saved AAPL 15-minute bars are unavailable. No synthetic price path is shown.';
    }
    buildContext();
  }
  for (const [symbol, label] of [
    ['ES', 'Futures · ES'],
    ['AAPL', 'Mag 7 · AAPL'],
  ] as const) {
    const button = el('button', {
      type: 'button',
      text: label,
      'aria-pressed': 'false',
    }) as HTMLButtonElement;
    button.onclick = () => {
      if (selected !== symbol) void select(symbol);
    };
    selectors.append(button);
    buttons.set(symbol, button);
  }
  start.onclick = () => (running ? scene?.pause() : scene?.play());
  replay.onclick = () => scene?.replay();
  read.onclick = () => {
    scene?.pause();
    buildContext();
    panel.showModal();
  };
  close.onclick = () => panel.close();
  panel.addEventListener('close', () => read.focus());
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') scene?.pause();
  });
  share.onclick = async () => {
    const url = new URL('/intraday.html', location.origin);
    url.search = new URLSearchParams({ experience: 'intraday', symbol: selected }).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: url.href });
        return;
      }
      await navigator.clipboard.writeText(url.href);
      shareStatus.textContent = 'Selected ride link copied.';
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      shareStatus.textContent = 'Copy this selected ride link:';
      shareInput.value = url.href;
      shareInput.hidden = false;
      shareInput.focus();
      shareInput.select();
    }
  };
  const initial = new URLSearchParams(location.search).get('symbol') === 'ES' ? 'ES' : 'AAPL';
  void select(initial);
}

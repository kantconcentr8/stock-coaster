import './prototype.css';
import { el } from '@/ui/dom';
import { loadBriefing } from '@/content';
import { createMarketBackdrop } from './marketBackdrop';
import { createRecapFlow } from './recapFlow';
import { createPassengerScene } from './scene';

export function mountCoasterPrototype() {
  const { briefing, notice } = loadBriefing(location.search);
  const root = el('main', {
    class: 'ride-prototype',
    'aria-label': 'Candlestick Coaster passenger recap',
  });
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  root.append(canvas);
  document.body.replaceChildren(root);
  const flow = createRecapFlow(
    root,
    briefing,
    {
      play: () => scene?.play(),
      pause: () => scene?.pause(),
      replay: () => scene?.replay(),
      toggleSound: () => scene?.toggleSound(),
    },
    notice,
  );
  const sessionDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(briefing.coverageEnd));
  const market = createMarketBackdrop(root, briefing.briefingId, sessionDate);
  const scene = createPassengerScene(
    canvas,
    () => market.candles,
    (time, playing) => flow.render(time, playing),
  );
  flow.render(0, false);
  if (!scene) flow.unavailable();
}

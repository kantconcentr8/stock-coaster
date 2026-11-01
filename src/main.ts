import './styles.css';
import { createApp } from '@/app';
import { createEventBus } from '@/core/events';
import { createRunClock } from '@/core/runClock';
import { createRunMachine } from '@/core/stateMachine';
import { createGame } from '@/render/createGame';
import { el } from '@/ui/dom';
import { renderFallback } from '@/ui/screens/fallback';

function supportsGraphics(): boolean {
  if (typeof requestAnimationFrame !== 'function') return false;
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl') ?? canvas.getContext('2d'));
}

const ui = document.getElementById('ui');
if (!ui) throw new Error('Missing #ui container');

const app = createApp({
  bus: createEventBus(),
  machine: createRunMachine(),
  clock: createRunClock(),
});

if (supportsGraphics()) {
  ui.append(el('h1', { id: 'title', class: 'screen', text: 'Candlestick Coaster' }));
  createGame(app, 'game');
} else {
  renderFallback(ui);
}

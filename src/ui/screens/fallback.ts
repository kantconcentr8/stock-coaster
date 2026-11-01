import { el } from '../dom';

export function renderFallback(root: HTMLElement): void {
  const screen = el('section', { id: 'screen-fallback', class: 'screen' }, [
    el('h1', { text: 'Candlestick Coaster' }),
    el('p', { text: 'This game needs a newer browser — read the briefing instead.' }),
    el('a', { href: '#briefing', text: 'Read the briefing (coming soon)' }),
  ]);
  root.replaceChildren(screen);
}

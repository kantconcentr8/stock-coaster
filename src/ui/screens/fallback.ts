import { el } from '../dom';

export function renderFallback(root: HTMLElement, contentError = false): void {
  const screen = el('section', { id: 'screen-fallback', class: 'screen' }, [
    el('h1', { text: 'Candlestick Coaster' }),
    el('p', { text: 'This game needs a newer browser — read the briefing instead.' }),
    el('a', { href: '#briefing', text: 'Read the briefing' }),
  ]);
  if (contentError)
    screen.append(
      el('section', { id: 'briefing' }, [
        el('h2', { text: 'Draft briefing context' }),
        el('p', {
          text: 'The campaign examines lower-value acceptance and whether a bounce establishes repair. Interpretations and hypothetical scenarios require owner review. Approved dated content is temporarily unavailable.',
        }),
        el('p', {
          text: 'An illustrative briefing and arcade game, not a trading simulation. No market levels or future outcomes are asserted here.',
        }),
      ]),
    );
  root.replaceChildren(screen);
}

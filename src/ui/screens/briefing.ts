import type { Briefing } from '../../core/types';
import { isHttps } from '../../content/schema';
import { el } from '../dom';
import { formatCoverage } from '../format';

export function createBriefingPanel(
  briefing: Briefing,
  onOpen: (entry: 'intro' | 'results' | 'fallback') => void = () => {},
) {
  const close = el('button', { type: 'button', class: 'btn-secondary', text: 'Close briefing' });
  const root = el('dialog', {
    id: 'briefing',
    class: 'screen modal-card briefing-panel',
    'aria-labelledby': 'briefing-title',
  }) as HTMLDialogElement;
  root.append(el('h2', { id: 'briefing-title', text: briefing.title }), close);
  const section = (title: string, children: HTMLElement[]) =>
    root.append(el('section', {}, [el('h3', { text: title }), ...children]));
  section('Summary', [el('p', { text: briefing.summary })]);
  section(
    'What the course shows',
    briefing.chapters.map((ch) =>
      el('article', {}, [
        el('h3', { text: ch.label }),
        el('p', { text: ch.caption }),
        el('p', { text: ch.summary }),
      ]),
    ),
  );
  section(
    'Key terms',
    briefing.glossary.map((g) =>
      el('p', {}, [el('strong', { text: `${g.term}: ` }), g.definition]),
    ),
  );
  section(
    'Sources',
    briefing.sources.length
      ? briefing.sources
          .filter((s) => isHttps(s.url))
          .map((s) =>
            el('p', {}, [
              el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', text: s.title }),
            ]),
          )
      : [
          el('p', {
            text: 'TODO(owner): approved public research links are pending. This draft is unapproved.',
          }),
        ],
  );
  section('Coverage & publication', [el('p', { text: formatCoverage(briefing) })]);
  section('Disclaimer', [el('p', { text: briefing.disclaimer })]);
  if (isHttps(briefing.cta.url))
    root.append(el('a', { href: briefing.cta.url, rel: 'noopener', text: briefing.cta.label }));
  let opener: HTMLElement | null = null;
  let siblings: { node: HTMLElement; inert: boolean }[] = [];
  const restore = () => {
    for (const { node, inert } of siblings) node.inert = inert;
    siblings = [];
    opener?.focus();
  };
  const hide = () => {
    if (typeof root.close === 'function') root.close();
    else root.removeAttribute('open');
    restore();
  };
  close.addEventListener('click', hide);
  root.addEventListener('close', () => { if (!root.open) restore(); });
  root.addEventListener('cancel', (event) => {
    event.preventDefault();
    hide();
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      hide();
    }
    if (event.key !== 'Tab') return;
    const nodes = [...root.querySelectorAll<HTMLElement>('button, a[href]')];
    const first = nodes[0],
      last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  return {
    root,
    open(entry: 'intro' | 'results' | 'fallback') {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      siblings = [...(root.parentElement?.children ?? [])]
        .filter((n): n is HTMLElement => n instanceof HTMLElement && n !== root)
        .map((node) => ({ node, inert: node.inert }));
      for (const { node } of siblings) node.inert = true;
      if (typeof root.showModal === 'function') root.showModal();
      else root.setAttribute('open', '');
      close.focus();
      onOpen(entry);
    },
    close: hide,
  };
}

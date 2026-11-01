import type { Chapter } from '../core/types';
import { el } from './dom';
export function createCaptions() {
  const label = el('strong', { class: 'classification' });
  const caption = el('span');
  const root = el(
    'div',
    { class: 'chapter-caption', 'aria-live': 'polite', 'aria-atomic': 'true', hidden: '' },
    [label, caption],
  );
  let current: string | undefined;
  return {
    root,
    update(chapter?: Chapter) {
      root.hidden = !chapter;
      if (chapter?.id === current) return;
      current = chapter?.id;
      label.textContent = chapter ? `◇ ${chapter.label}` : '';
      caption.textContent = chapter?.caption ?? '';
    },
  };
}

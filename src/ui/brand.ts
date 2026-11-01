import { el } from './dom';
export function brandMark() {
  return el('img', {
    src: `${import.meta.env.BASE_URL}brand/mark.svg`,
    alt: '',
    width: '40',
    height: '40',
    class: 'brand-mark',
    'aria-hidden': 'true',
  });
}

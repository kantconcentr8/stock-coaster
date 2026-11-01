import { el } from './dom';

export interface TouchControlElements {
  readonly root: HTMLElement;
  readonly upBtn: HTMLButtonElement;
  readonly downBtn: HTMLButtonElement;
  readonly boostBtn: HTMLButtonElement;
  readonly brakeBtn: HTMLButtonElement;
  setVisible(visible: boolean): void;
}

/**
 * Four real <button> elements with aria-labels, >= 44x44 CSS px, >= 8px gaps,
 * distinct shapes/icons plus text labels.
 */
export function createTouchControls(): TouchControlElements {
  const upBtn = el(
    'button',
    {
      id: 'touch-up',
      type: 'button',
      class: 'touch-btn touch-btn-lane',
      'aria-label': 'Move up a rail',
    },
    [
      el('span', { class: 'touch-icon', 'aria-hidden': 'true', text: '▲' }),
      el('span', { class: 'touch-text', text: 'Up' }),
    ],
  ) as HTMLButtonElement;

  const downBtn = el(
    'button',
    {
      id: 'touch-down',
      type: 'button',
      class: 'touch-btn touch-btn-lane',
      'aria-label': 'Move down a rail',
    },
    [
      el('span', { class: 'touch-icon', 'aria-hidden': 'true', text: '▼' }),
      el('span', { class: 'touch-text', text: 'Down' }),
    ],
  ) as HTMLButtonElement;

  const brakeBtn = el(
    'button',
    {
      id: 'touch-brake',
      type: 'button',
      class: 'touch-btn touch-btn-brake',
      'aria-label': 'Brake (hold)',
    },
    [
      el('span', { class: 'touch-icon', 'aria-hidden': 'true', text: '■' }),
      el('span', { class: 'touch-text', text: 'Brake' }),
    ],
  ) as HTMLButtonElement;

  const boostBtn = el(
    'button',
    {
      id: 'touch-boost',
      type: 'button',
      class: 'touch-btn touch-btn-boost',
      'aria-label': 'Boost (hold)',
    },
    [
      el('span', { class: 'touch-icon', 'aria-hidden': 'true', text: '◆' }),
      el('span', { class: 'touch-text', text: 'Boost' }),
    ],
  ) as HTMLButtonElement;

  const leftPad = el('div', { class: 'touch-pad touch-pad-lanes' }, [upBtn, downBtn]);
  const rightPad = el('div', { class: 'touch-pad touch-pad-actions' }, [brakeBtn, boostBtn]);

  const root = el(
    'nav',
    { id: 'touch-controls', class: 'touch-controls', 'aria-label': 'Game controls', hidden: '' },
    [leftPad, rightPad],
  );

  return {
    root,
    upBtn,
    downBtn,
    boostBtn,
    brakeBtn,
    setVisible(visible) {
      if (visible) root.removeAttribute('hidden');
      else root.setAttribute('hidden', '');
    },
  };
}

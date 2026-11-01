import type { LearningQuestion } from '../../core/types';
import { el } from '../dom';
export function createLearningQuestion(
  question: LearningQuestion,
  onAnswer: (correct: boolean) => void,
) {
  const explanation = el('p', { 'aria-live': 'polite' });
  const root = el('fieldset', {}, [el('legend', { text: `${question.prompt} (optional)` })]);
  const buttons = question.answers.map((answer, index) => {
    const button = el('button', {
      type: 'button',
      class: 'btn-secondary',
      text: answer,
    }) as HTMLButtonElement;
    button.addEventListener('click', () => {
      const correct = index === question.correctIndex;
      explanation.textContent = `${correct ? 'Correct.' : 'Consider this:'} ${question.explanation}`;
      buttons.forEach((b) => {
        b.disabled = true;
      });
      onAnswer(correct);
    });
    return button;
  });
  root.append(...buttons, explanation);
  return {
    root,
    reset() {
      explanation.textContent = '';
      buttons.forEach((b) => {
        b.disabled = false;
      });
    },
  };
}

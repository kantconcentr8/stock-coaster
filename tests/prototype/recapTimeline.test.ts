import { expect, it } from 'vitest';
import data from '@/content/briefings/2026-10-31-lower-value.json';
import type { Briefing } from '@/core/types';
import { recapChapter, rideStage } from '@/prototype/recapTimeline';

const briefing = data as Briefing;
it('ties the recap to plunge and recovery without changing editorial timing or text', () => {
  expect(recapChapter(briefing, 0).chapter).toBe(briefing.chapters[0]);
  expect(recapChapter(briefing, 16.99).chapter.id).toBe('lower-value');
  expect(recapChapter(briefing, 17).chapter.id).toBe('bounce');
  expect(recapChapter(briefing, 23.99).chapter.id).toBe('bounce');
  expect(recapChapter(briefing, 24).chapter.forwardLooking).toBe(true);
  expect(recapChapter(briefing, 28).chapter.classification).toBe('hypothetical');
  expect(briefing.chapters[1]!.startSec).toBe(20);
});
it('handles a single editorial chapter and reaches an explicit completion state', () => {
  expect(recapChapter({ ...briefing, chapters: [briefing.chapters[0]!] }, 25).index).toBe(0);
  expect(rideStage(0)).toBe('Ready to climb');
  expect(rideStage(10)).toBe('The plunge');
  expect(rideStage(28)).toBe('Recap complete');
});

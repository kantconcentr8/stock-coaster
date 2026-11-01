import { describe, expect, it, vi } from 'vitest';
import { createChapterScheduler } from '@/sim/chapters';
import { validateBriefing } from '@/content/schema';
import valid from '../fixtures/briefings/valid.json';
import { createApp } from '@/app';
import { createEventBus } from '@/core/events';
import { createRunClock } from '@/core/runClock';
import { createRunMachine } from '@/core/stateMachine';

describe('chapter scheduler', () => {
  it('integrates with pause, resume countdown and restart without duplicate events', () => {
    const bus = createEventBus(),
      seen = vi.fn();
    bus.on('chapterSeen', seen);
    const app = createApp({
      bus,
      clock: createRunClock(),
      machine: createRunMachine(),
      chapters: validateBriefing(valid).briefing.chapters,
    });
    const advance = (seconds: number) => {
      for (let i = 0; i < seconds * 4; i++) app.tick(0.25);
    };
    app.startRun();
    advance(3);
    advance(21);
    expect(seen.mock.calls.map(([event]) => event.chapterId)).toEqual(['lower-value', 'bounce']);
    app.pauseRun();
    advance(30);
    expect(app.clock.activeTime).toBeCloseTo(21);
    app.resumeRun();
    advance(3);
    advance(1);
    expect(seen).toHaveBeenCalledTimes(2);
    app.pauseRun();
    app.restartRun();
    advance(3);
    advance(1);
    expect(seen).toHaveBeenCalledTimes(3);
    expect(seen.mock.calls[2]![0].chapterId).toBe('lower-value');
  });
  it('follows active-time boundaries, announces once across pauses, and rearms on restart', () => {
    const seen = vi.fn();
    const scheduler = createChapterScheduler(validateBriefing(valid).briefing.chapters, seen);
    expect(scheduler.update(0)?.id).toBe('lower-value');
    scheduler.update(0);
    scheduler.update(19.99);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(scheduler.update(20)?.id).toBe('bounce');
    scheduler.update(20); // active time held during pause
    expect(seen).toHaveBeenCalledTimes(2);
    expect(scheduler.update(40)?.classification).toBe('hypothetical');
    expect(scheduler.update(59.99)?.label).toContain('Hypothetical');
    expect(scheduler.update(60)).toBeUndefined();
    scheduler.reset();
    scheduler.update(0);
    expect(seen).toHaveBeenCalledTimes(4);
  });
});

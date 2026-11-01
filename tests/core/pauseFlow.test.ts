// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createApp } from '@/app';
import { createEventBus } from '@/core/events';
import { createRunClock } from '@/core/runClock';
import { createRunMachine } from '@/core/stateMachine';
import { createSim } from '@/sim/simulation';

describe('pause and visibility flow', () => {
  it('auto-pauses on document hidden; 30s hidden consumes 0 active time; requires explicit resume + countdown', () => {
    const app = createApp({
      bus: createEventBus(),
      machine: createRunMachine(),
      clock: createRunClock(),
    });
    const unbind = app.bindVisibilityPause(document, window);

    app.startRun();
    // Finish 3s start countdown
    for (let i = 0; i < 12; i++) app.tick(0.25);
    expect(app.machine.phase).toBe('running');

    // Run for 10s
    for (let i = 0; i < 40; i++) app.tick(0.25);
    expect(app.clock.activeTime).toBeCloseTo(10, 4);

    // Simulate page hidden
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(app.machine.phase).toBe('paused');

    // 30s wall time passes while hidden
    for (let i = 0; i < 120; i++) app.tick(0.25);
    expect(app.clock.activeTime).toBeCloseTo(10, 4);

    // Returning to visible does NOT auto-resume
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(app.machine.phase).toBe('paused');

    // Explicit resume goes through 3s countdown before running
    app.resumeRun();
    expect(app.machine.phase).toBe('countdown');
    for (let i = 0; i < 11; i++) app.tick(0.25);
    expect(app.machine.phase).toBe('countdown');
    app.tick(0.25);
    expect(app.machine.phase).toBe('running');

    unbind();
  });

  it('restart from paused yields a fresh run state', () => {
    const app = createApp({
      bus: createEventBus(),
      machine: createRunMachine(),
      clock: createRunClock(),
    });

    app.startRun();
    for (let i = 0; i < 12; i++) app.tick(0.25);
    app.input.press('boost');
    for (let i = 0; i < 40; i++) app.tick(0.25);

    app.pauseRun();
    expect(app.machine.phase).toBe('paused');

    app.restartRun();
    expect(app.machine.phase).toBe('countdown');
    expect(app.clock.activeTime).toBe(0);
    expect(app.sim.state).toEqual(createSim(app.track, app.course).state);
  });
});

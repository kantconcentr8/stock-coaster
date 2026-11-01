import { describe, expect, it } from 'vitest';
import { createApp } from '@/app';
import { createEventBus } from '@/core/events';
import { createRunClock } from '@/core/runClock';
import { createRunMachine } from '@/core/stateMachine';
import type { GameEvent } from '@/core/types';

describe('app run lifecycle', () => {
  it('emits runComplete exactly once per run, including after pause and resume', () => {
    const bus = createEventBus();
    const events: GameEvent[] = [];
    bus.on('runComplete', (e) => events.push(e));
    bus.on('runStart', (e) => events.push(e));
    bus.on('pause', (e) => events.push(e));
    bus.on('resume', (e) => events.push(e));

    const app = createApp({
      bus,
      machine: createRunMachine(),
      clock: createRunClock(),
    });

    app.startRun();
    expect(app.machine.phase).toBe('countdown');

    // Finish 3s countdown in 12 frames of 0.25s
    for (let i = 0; i < 12; i++) app.tick(0.25);
    expect(app.machine.phase).toBe('running');

    // Advance 20s of active time (80 frames of 0.25s)
    for (let i = 0; i < 80; i++) app.tick(0.25);
    expect(app.clock.activeTime).toBeCloseTo(20, 4);

    // Pause for 10s wall time
    app.pauseRun();
    expect(app.machine.phase).toBe('paused');
    for (let i = 0; i < 40; i++) app.tick(0.25);
    expect(app.clock.activeTime).toBeCloseTo(20, 4);

    // Resume + 3s resume countdown
    app.resumeRun();
    expect(app.machine.phase).toBe('countdown');
    for (let i = 0; i < 12; i++) app.tick(0.25);
    expect(app.machine.phase).toBe('running');

    // Finish remaining 40s + extra frames
    for (let i = 0; i < 200; i++) app.tick(0.25);

    expect(app.machine.phase).toBe('results');
    expect(app.clock.activeTime).toBe(60);
    expect(events.filter((e) => e.type === 'runComplete')).toHaveLength(1);
  });
});

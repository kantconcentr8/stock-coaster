import type { EventBus } from '@/core/events';
import type { RunClock } from '@/core/runClock';
import type { RunMachine } from '@/core/stateMachine';

export interface App {
  readonly bus: EventBus;
  readonly machine: RunMachine;
  readonly clock: RunClock;
  /** Called once per render frame with elapsed seconds. */
  tick(frameSeconds: number): void;
}

export interface AppDeps {
  bus: EventBus;
  machine: RunMachine;
  clock: RunClock;
}

export function createApp({ bus, machine, clock }: AppDeps): App {
  // Stub: the real simulation step arrives in Phase 1.
  const stepFn = (): void => {};

  return {
    bus,
    machine,
    clock,
    tick(frameSeconds) {
      if (machine.phase !== 'running') return;
      const result = clock.advance(frameSeconds, stepFn);
      if (result.finished) machine.send('timeUp');
    },
  };
}

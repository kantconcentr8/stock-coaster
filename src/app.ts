import { TUNING } from '@/config/tuning';
import type { CourseDef } from '@/core/types';
import type { EventBus } from '@/core/events';
import type { RunClock } from '@/core/runClock';
import type { RunMachine } from '@/core/stateMachine';
import { createInput, type InputController } from '@/input/inputState';
import { createSim, type Sim } from '@/sim/simulation';
import { buildTrack, type Track } from '@/sim/track';
import devCourseJson from '@/content/courses/dev-course.json';

export interface App {
  readonly bus: EventBus;
  readonly machine: RunMachine;
  readonly clock: RunClock;
  readonly course: CourseDef;
  readonly track: Track;
  readonly sim: Sim;
  readonly input: InputController;
  readonly countdownRemaining: number;
  startRun(): void;
  restartRun(): void;
  pauseRun(): void;
  resumeRun(): void;
  /** Called once per render frame with elapsed seconds; returns steps executed this frame. */
  tick(frameSeconds: number): number;
}

export interface AppDeps {
  bus: EventBus;
  machine: RunMachine;
  clock: RunClock;
  course?: CourseDef;
  input?: InputController;
}

export function createApp({
  bus,
  machine,
  clock,
  course = devCourseJson as CourseDef,
  input = createInput(),
}: AppDeps): App {
  const track = buildTrack(course);
  const sim = createSim(track, course, (ev) => bus.emit(ev));
  let countdownRemaining = 0;

  return {
    bus,
    machine,
    clock,
    course,
    track,
    sim,
    input,
    get countdownRemaining() {
      return countdownRemaining;
    },
    startRun() {
      if (!machine.send('start')) return;
      sim.reset();
      clock.reset();
      input.clearAll();
      countdownRemaining = TUNING.COUNTDOWN_SECONDS;
    },
    restartRun() {
      if (!machine.send('restart')) return;
      sim.reset();
      clock.reset();
      input.clearAll();
      countdownRemaining = TUNING.COUNTDOWN_SECONDS;
      bus.emit({ type: 'restart', t: 0 });
    },
    pauseRun() {
      if (!machine.send('pause')) return;
      input.clearAll();
      bus.emit({ type: 'pause', t: clock.activeTime });
    },
    resumeRun() {
      if (!machine.send('resume')) return;
      input.clearAll();
      countdownRemaining = TUNING.RESUME_COUNTDOWN_SECONDS;
    },
    tick(frameSeconds) {
      const clamped = Math.min(Math.max(frameSeconds, 0), TUNING.MAX_FRAME);

      if (machine.phase === 'countdown') {
        countdownRemaining = Math.max(0, countdownRemaining - clamped);
        if (countdownRemaining <= 0) {
          if (machine.isResumeCountdown) {
            if (machine.send('resumeCountdownDone')) {
              bus.emit({ type: 'resume', t: clock.activeTime });
            }
          } else {
            if (machine.send('countdownDone')) {
              bus.emit({ type: 'runStart', t: 0 });
            }
          }
        }
        return 0;
      }

      if (machine.phase !== 'running') return 0;

      const result = clock.advance(frameSeconds, (dt) => {
        sim.step(input.consumeLanes(), dt);
      });
      if (result.finished) {
        sim.state.done = true;
        if (machine.send('timeUp')) {
          bus.emit({ type: 'runComplete', score: sim.state.stats.score, t: clock.activeTime });
        }
      }
      return result.steps;
    },
  };
}

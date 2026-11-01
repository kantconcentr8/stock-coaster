import { createChapterScheduler } from '@/sim/chapters';
import { TUNING } from '@/config/tuning';
import type { Chapter, CourseDef } from '@/core/types';
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
  exitRun(): void;
  /** Wires visibilitychange (hidden) and pagehide to pauseRun() without auto-resuming. */
  bindVisibilityPause(doc?: Document, win?: Window): () => void;
  /** Called once per render frame with elapsed seconds; returns steps executed this frame. */
  tick(frameSeconds: number): number;
}

export interface AppDeps {
  bus: EventBus;
  machine: RunMachine;
  clock: RunClock;
  course?: CourseDef;
  chapters?: Chapter[];
  input?: InputController;
}

function syncPlayingClass(phase: string): void {
  if (typeof document === 'undefined' || !document.body) return;
  const active = phase === 'running' || phase === 'countdown';
  document.body.classList.toggle('is-playing', active);
}

export function createApp({
  bus,
  machine,
  clock,
  course = devCourseJson as CourseDef,
  input = createInput(),
  chapters = [],
}: AppDeps): App {
  const track = buildTrack(course);
  const sim = createSim(track, course, (ev) => bus.emit(ev));
  const scheduler = createChapterScheduler(chapters, (chapter, t) =>
    bus.emit({ type: 'chapterSeen', chapterId: chapter.id, t }),
  );
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
      scheduler.reset();
      clock.reset();
      input.clearAll();
      countdownRemaining = TUNING.COUNTDOWN_SECONDS;
      syncPlayingClass(machine.phase);
    },
    restartRun() {
      if (!machine.send('restart')) return;
      sim.reset();
      scheduler.reset();
      clock.reset();
      input.clearAll();
      countdownRemaining = TUNING.COUNTDOWN_SECONDS;
      syncPlayingClass(machine.phase);
      bus.emit({ type: 'restart', t: 0 });
    },
    pauseRun() {
      if (!machine.send('pause')) return;
      input.clearAll();
      syncPlayingClass(machine.phase);
      bus.emit({ type: 'pause', t: clock.activeTime });
    },
    resumeRun() {
      if (!machine.send('resume')) return;
      input.clearAll();
      countdownRemaining = TUNING.RESUME_COUNTDOWN_SECONDS;
      syncPlayingClass(machine.phase);
    },
    exitRun() {
      if (!machine.send('exit')) return;
      sim.reset();
      scheduler.reset();
      clock.reset();
      input.clearAll();
      countdownRemaining = 0;
      syncPlayingClass(machine.phase);
    },
    bindVisibilityPause(
      doc = typeof document !== 'undefined' ? document : undefined,
      win = typeof window !== 'undefined' ? window : undefined,
    ) {
      const onVis = () => {
        if (doc?.visibilityState === 'hidden') {
          this.pauseRun();
        }
      };
      const onPageHide = () => {
        this.pauseRun();
      };
      doc?.addEventListener('visibilitychange', onVis);
      win?.addEventListener('pagehide', onPageHide);
      return () => {
        doc?.removeEventListener('visibilitychange', onVis);
        win?.removeEventListener('pagehide', onPageHide);
      };
    },
    tick(frameSeconds) {
      const clamped = Math.min(Math.max(frameSeconds, 0), TUNING.MAX_FRAME);

      if (machine.phase === 'countdown') {
        countdownRemaining = Math.max(0, countdownRemaining - clamped);
        if (countdownRemaining <= 0) {
          if (machine.isResumeCountdown) {
            if (machine.send('resumeCountdownDone')) {
              input.clearAll();
              syncPlayingClass(machine.phase);
              bus.emit({ type: 'resume', t: clock.activeTime });
            }
          } else {
            if (machine.send('countdownDone')) {
              input.clearAll();
              syncPlayingClass(machine.phase);
              bus.emit({ type: 'runStart', t: 0 });
            }
          }
        }
        return 0;
      }

      if (machine.phase !== 'running') return 0;

      const result = clock.advance(frameSeconds, (dt) => {
        scheduler.update(sim.state.t);
        sim.step(input.consumeLanes(), dt);
      });
      if (result.finished) {
        sim.state.done = true;
        if (machine.send('timeUp')) {
          syncPlayingClass(machine.phase);
          bus.emit({ type: 'runComplete', score: sim.state.stats.score, t: clock.activeTime });
        }
      }
      return result.steps;
    },
  };
}

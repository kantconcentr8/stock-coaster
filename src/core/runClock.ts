import { TUNING } from '@/config/tuning';

export interface ClockResult {
  steps: number;
  finished: boolean;
}

export interface RunClock {
  readonly activeTime: number;
  readonly finished: boolean;
  /**
   * Advance by a render-frame duration, calling stepFn(dt) per fixed step.
   * The caller must only call this while the run phase is `running`;
   * the clock itself has no knowledge of pause.
   */
  advance(frameSeconds: number, stepFn: (dt: number) => void): ClockResult;
  reset(): void;
}

const EPS = 1e-9;

export function createRunClock(): RunClock {
  let accumulator = 0;
  let steps = 0; // total whole+partial steps taken
  let finished = false;

  // Active time derived from integer step count to avoid float drift.
  const totalFullSteps = Math.floor(TUNING.RUN_SECONDS / TUNING.SIM_DT + EPS);
  const tail = TUNING.RUN_SECONDS - totalFullSteps * TUNING.SIM_DT;

  const timeAt = (n: number): number =>
    n >= totalFullSteps + (tail > EPS ? 1 : 0) ? TUNING.RUN_SECONDS : n * TUNING.SIM_DT;

  return {
    get activeTime() {
      return timeAt(steps);
    },
    get finished() {
      return finished;
    },
    advance(frameSeconds, stepFn) {
      if (finished) return { steps: 0, finished: false };
      accumulator += Math.min(Math.max(frameSeconds, 0), TUNING.MAX_FRAME);
      let taken = 0;
      let justFinished = false;
      while (accumulator + EPS >= TUNING.SIM_DT) {
        if (steps < totalFullSteps) {
          stepFn(TUNING.SIM_DT);
          steps++;
          accumulator -= TUNING.SIM_DT;
          taken++;
        }
        if (steps >= totalFullSteps) {
          if (tail > EPS) {
            stepFn(tail);
            steps++;
            taken++;
          }
          finished = true;
          justFinished = true;
          accumulator = 0;
          break;
        }
      }
      return { steps: taken, finished: justFinished };
    },
    reset() {
      accumulator = 0;
      steps = 0;
      finished = false;
    },
  };
}

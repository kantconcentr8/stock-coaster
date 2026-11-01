import type { RunPhase } from './types';

export type RunAction =
  | 'start'
  | 'countdownDone'
  | 'pause'
  | 'resume'
  | 'resumeCountdownDone'
  | 'timeUp'
  | 'restart'
  | 'exit';

export interface RunMachine {
  readonly phase: RunPhase;
  /** True while the current countdown is a post-pause resume countdown. */
  readonly isResumeCountdown: boolean;
  /** Returns false (no-op) for illegal transitions. */
  send(action: RunAction): boolean;
}

export function createRunMachine(): RunMachine {
  let phase: RunPhase = 'intro';
  let resumeCountdown = false;

  const go = (next: RunPhase, resume = false): boolean => {
    phase = next;
    resumeCountdown = resume;
    return true;
  };

  return {
    get phase() {
      return phase;
    },
    get isResumeCountdown() {
      return resumeCountdown;
    },
    send(action) {
      switch (action) {
        case 'start':
          return phase === 'intro' ? go('countdown') : false;
        case 'countdownDone':
          return phase === 'countdown' && !resumeCountdown ? go('running') : false;
        case 'pause':
          return phase === 'running' ? go('paused') : false;
        case 'resume':
          return phase === 'paused' ? go('countdown', true) : false;
        case 'resumeCountdownDone':
          return phase === 'countdown' && resumeCountdown ? go('running') : false;
        case 'timeUp':
          return phase === 'running' ? go('results') : false;
        case 'restart':
          return phase === 'results' || phase === 'paused' ? go('countdown') : false;
        case 'exit':
          return phase !== 'intro' ? go('intro') : false;
      }
    },
  };
}

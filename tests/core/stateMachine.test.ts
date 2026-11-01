import { describe, expect, it } from 'vitest';
import { createRunMachine, type RunAction } from '@/core/stateMachine';

const ALL: RunAction[] = [
  'start',
  'countdownDone',
  'pause',
  'resume',
  'resumeCountdownDone',
  'timeUp',
  'restart',
  'exit',
];

function toRunning() {
  const m = createRunMachine();
  m.send('start');
  m.send('countdownDone');
  return m;
}

describe('run state machine', () => {
  it('happy path intro → countdown → running → results', () => {
    const m = createRunMachine();
    expect(m.phase).toBe('intro');
    expect(m.send('start')).toBe(true);
    expect(m.phase).toBe('countdown');
    expect(m.send('countdownDone')).toBe(true);
    expect(m.phase).toBe('running');
    expect(m.send('timeUp')).toBe(true);
    expect(m.phase).toBe('results');
  });

  it('resume goes paused → countdown → running', () => {
    const m = toRunning();
    m.send('pause');
    expect(m.phase).toBe('paused');
    m.send('resume');
    expect(m.phase).toBe('countdown');
    expect(m.send('countdownDone')).toBe(false); // wrong countdown kind
    expect(m.send('resumeCountdownDone')).toBe(true);
    expect(m.phase).toBe('running');
  });

  it('restart from results and paused returns to countdown', () => {
    const a = toRunning();
    a.send('timeUp');
    expect(a.send('restart')).toBe(true);
    expect(a.phase).toBe('countdown');
    const b = toRunning();
    b.send('pause');
    expect(b.send('restart')).toBe(true);
    expect(b.phase).toBe('countdown');
    expect(b.isResumeCountdown).toBe(false);
  });

  it('rejects every illegal transition without changing phase', () => {
    const legal: Record<string, RunAction[]> = {
      intro: ['start'],
      countdown: ['countdownDone', 'exit'],
      running: ['pause', 'timeUp', 'exit'],
      paused: ['resume', 'restart', 'exit'],
      results: ['restart', 'exit'],
    };
    const setups: Record<string, () => ReturnType<typeof createRunMachine>> = {
      intro: () => createRunMachine(),
      countdown: () => {
        const m = createRunMachine();
        m.send('start');
        return m;
      },
      running: toRunning,
      paused: () => {
        const m = toRunning();
        m.send('pause');
        return m;
      },
      results: () => {
        const m = toRunning();
        m.send('timeUp');
        return m;
      },
    };
    for (const [phase, make] of Object.entries(setups)) {
      for (const action of ALL.filter((a) => !legal[phase]!.includes(a))) {
        const m = make();
        expect(m.send(action), `${phase}/${action}`).toBe(false);
        expect(m.phase).toBe(phase);
      }
    }
  });
});

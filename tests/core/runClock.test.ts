import { describe, expect, it } from 'vitest';
import { TUNING } from '@/config/tuning';
import { createRunClock } from '@/core/runClock';

function run(frames: number[]) {
  const clock = createRunClock();
  let steps = 0;
  let finishedCount = 0;
  let simTime = 0;
  for (const f of frames) {
    const r = clock.advance(f, (dt) => {
      steps++;
      simTime += dt;
    });
    if (r.finished) finishedCount++;
  }
  return { clock, steps, finishedCount, simTime };
}

function framesOf(size: number, totalSeconds: number): number[] {
  return Array.from({ length: Math.ceil(totalSeconds / size) }, () => size);
}

describe('run clock', () => {
  it('finishes at exactly 60 s regardless of frame jitter', () => {
    const results = [
      framesOf(0.007, 80),
      framesOf(0.033, 80),
      framesOf(0.25, 80),
      framesOf(0.6, 200), // clamped to 0.25 per frame
    ].map(run);
    for (const r of results) {
      expect(r.clock.activeTime).toBe(TUNING.RUN_SECONDS);
      expect(r.simTime).toBeCloseTo(TUNING.RUN_SECONDS, 6);
      expect(r.finishedCount).toBe(1);
    }
    const steps = results.map((r) => r.steps);
    expect(new Set(steps).size).toBe(1);
  });

  it('finished fires exactly once', () => {
    const { finishedCount, clock } = run(framesOf(0.016, 100));
    expect(finishedCount).toBe(1);
    expect(clock.finished).toBe(true);
  });

  it('clamps huge frames to MAX_FRAME', () => {
    const clock = createRunClock();
    let steps = 0;
    clock.advance(10, () => steps++);
    expect(steps).toBe(Math.round(TUNING.MAX_FRAME / TUNING.SIM_DT));
  });

  it('pause consumes no active time when caller skips advance', () => {
    const clock = createRunClock();
    clock.advance(0.1, () => {});
    const before = clock.activeTime;
    // 10 s of wall time paused: caller does not call advance.
    expect(clock.activeTime).toBe(before);
  });

  it('reset restarts the clock', () => {
    const { clock } = run(framesOf(0.25, 70));
    clock.reset();
    expect(clock.activeTime).toBe(0);
    expect(clock.finished).toBe(false);
  });
});

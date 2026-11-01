import { describe, expect, it } from 'vitest';
import course01 from '@/content/courses/course-01.json';
import type { CourseDef } from '@/core/types';
import { evaluateCourseFairness } from '../../scripts/check-fairness';

describe('fairness checker', () => {
  it('passes for course-01.json including the brake-zone check', () => {
    const res = evaluateCourseFairness(course01 as CourseDef);
    for (const c of res.checks) {
      expect(c.passed, `${c.name}: ${c.detail}`).toBe(true);
    }
    expect(res.passed).toBe(true);
  });

  it('fails with a readable reason when all 3 rails are blocked', () => {
    const blocked: CourseDef = {
      ...(course01 as CourseDef),
      objects: [
        { id: 'b0', kind: 'hazard', rail: 0, s: 2000 },
        { id: 'b1', kind: 'hazard', rail: 1, s: 2000 },
        { id: 'b2', kind: 'hazard', rail: 2, s: 2000 },
      ],
    };
    const res = evaluateCourseFairness(blocked);
    expect(res.passed).toBe(false);
    const safeCheck = res.checks.find((c) => c.name === 'safe-rail');
    expect(safeCheck?.passed).toBe(false);
    expect(safeCheck?.detail).toMatch(/All 3 rails blocked/);
  });

  it('fails reachability when a 2-rail jump is too close outside a brake zone', () => {
    const unreachable: CourseDef = {
      ...(course01 as CourseDef),
      segments: [],
      objects: [
        // Force player onto rail 0 at s=2000
        { id: 'h1', kind: 'hazard', rail: 1, s: 2000 },
        { id: 'h2', kind: 'hazard', rail: 2, s: 2000 },
        // Immediately demand rail 2 just 100 wu later (impossible at vMaxBoost)
        { id: 'h3', kind: 'hazard', rail: 0, s: 2100 },
        { id: 'h4', kind: 'hazard', rail: 1, s: 2100 },
      ],
    };
    const res = evaluateCourseFairness(unreachable);
    expect(res.passed).toBe(false);
    const reachCheck = res.checks.find((c) => c.name === 'reachability');
    expect(reachCheck?.passed).toBe(false);
    expect(reachCheck?.detail).toMatch(/Unreachable safe rail/);
  });
});

import { describe, expect, it } from 'vitest';
import { TUNING } from '@/config/tuning';
import devCourse from '@/content/courses/dev-course.json';
import type { CourseDef } from '@/core/types';
import { assertCourseLength, buildTrack } from '@/sim/track';
import { slopeCourse } from '../fixtures/tracks';

const course = devCourse as CourseDef;

describe('track', () => {
  const track = buildTrack(course);

  it('dev course passes the length assertion and has no slope warnings', () => {
    expect(() => assertCourseLength(track)).not.toThrow();
    expect(track.warnings).toEqual([]);
  });

  it('sample is continuous and clamps at both ends', () => {
    const prev = track.sample(0);
    let px = prev.x;
    let py = prev.y;
    for (let s = 0.5; s < track.length; s += 0.5) {
      const p = track.sample(s);
      expect(Math.hypot(p.x - px, p.y - py)).toBeLessThan(0.75);
      px = p.x;
      py = p.y;
    }
    expect(track.sample(-50)).toEqual(track.sample(0));
    expect(track.sample(track.length + 500)).toEqual(track.sample(track.length + 1000));
  });

  it('rails keep constant spacing and never cross', () => {
    for (let s = 0; s < track.length; s += 37) {
      const up = track.railY(s, -1);
      const mid = track.railY(s, 0);
      const low = track.railY(s, 1);
      expect(mid - up).toBeCloseTo(course.railSpacing, 9);
      expect(low - mid).toBeCloseTo(course.railSpacing, 9);
      expect(up).toBeLessThan(mid);
      expect(mid).toBeLessThan(low);
    }
  });

  it('a short course fails assertCourseLength', () => {
    const short = buildTrack(slopeCourse(0, 5000));
    expect(() => assertCourseLength(short)).toThrow(/below required/);
  });

  it('flags and clamps slopes steeper than maxSlopeDeg', () => {
    const steep = buildTrack(slopeCourse(50, 5000));
    expect(steep.warnings.length).toBeGreaterThan(0);
    const maxRad = (TUNING.maxSlopeDeg * Math.PI) / 180;
    expect(Math.max(...steep.angle)).toBeLessThanOrEqual(maxRad + 1e-12);
  });
});

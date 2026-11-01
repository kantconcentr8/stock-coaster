import type { CourseDef } from '@/core/types';
import { buildTrack } from '@/sim/track';

/** Builds a straight course at a constant slope (degrees; positive = descending). */
export function slopeCourse(slopeDeg: number, length = 40000): CourseDef {
  const rad = (slopeDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * length;
  const dy = Math.sin(rad) * length;
  const n = 8;
  return {
    courseId: `slope-${slopeDeg}`,
    courseVersion: 1,
    length,
    railSpacing: 46,
    points: Array.from({ length: n }, (_, i) => ({ x: (dx * i) / (n - 1), y: (dy * i) / (n - 1) })),
    objects: [],
  };
}

export const flatTrack = () => buildTrack(slopeCourse(0));
export const downhillTrack = () => buildTrack(slopeCourse(20));
export const uphillTrack = () => buildTrack(slopeCourse(-20));
/** Steepest allowed uphill (maxSlopeDeg is 32; stay just under for the clamp-free case). */
export const steepUphillTrack = () => buildTrack(slopeCourse(-31));
export const steepDownhillTrack = () => buildTrack(slopeCourse(31));

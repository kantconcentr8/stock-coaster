import { readFileSync } from 'node:fs';
import { TUNING } from '../src/config/tuning';
import type { CourseDef } from '../src/core/types';
import { createSim } from '../src/sim/simulation';
import { buildTrack } from '../src/sim/track';

export function courseTimeline(
  course: CourseDef,
  mode: 'idle' | 'boost-all' | 'brake-all',
  times = [20, 40, 60],
): number[] {
  const sim = createSim(buildTrack(course), course);
  const distances: number[] = [];
  let step = 0;
  for (const time of times) {
    while (step < Math.round(time / TUNING.SIM_DT)) {
      sim.step(
        { boost: mode === 'boost-all', brake: mode === 'brake-all', laneUp: 0, laneDown: 0 },
        TUNING.SIM_DT,
      );
      step++;
    }
    distances.push(sim.state.kart.s);
  }
  return distances;
}
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/course-timeline.ts')) {
  const course = JSON.parse(
    readFileSync('src/content/courses/course-01.json', 'utf8'),
  ) as CourseDef;
  for (const mode of ['idle', 'boost-all', 'brake-all'] as const)
    console.log(
      `${mode}: ${courseTimeline(course, mode).map(Math.round).join(' / ')} wu at 20 / 40 / 60 active seconds`,
    );
}

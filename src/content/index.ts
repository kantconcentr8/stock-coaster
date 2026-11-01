import type { CourseDef } from '../core/types';
import { createBriefingLoader } from './loader';

const briefings = import.meta.glob('./briefings/*.json', { eager: true, import: 'default' });
const courses = import.meta.glob('./courses/*.json', { eager: true, import: 'default' });
export const loadBriefing = createBriefingLoader(
  Object.values(briefings),
  Object.values(courses) as CourseDef[],
);

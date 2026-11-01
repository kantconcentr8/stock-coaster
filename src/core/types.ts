/** Shared contracts. Types only — no runtime code. */

/** 0 = upper rail, 1 = middle, 2 = lower. */
export type RailIndex = 0 | 1 | 2;

/** Lane fields are edge-trigger counters consumed per step. */
export interface InputState {
  boost: boolean;
  brake: boolean;
  laneUp: number;
  laneDown: number;
}

export interface KartState {
  /** Distance along course (wu). */
  s: number;
  speed: number;
  rail: RailIndex;
  railFrom: RailIndex;
  /** Lane-change progress 0..1. */
  railT: number;
  boost: number;
  invulnUntil: number;
}

export interface CourseObject {
  id: string;
  kind: 'pickup' | 'hazard';
  rail: RailIndex;
  s: number;
}

export interface CourseDef {
  courseId: string;
  courseVersion: number;
  length: number;
  points: { x: number; y: number }[];
  railSpacing: number;
  objects: CourseObject[];
}

export interface RunStats {
  distance: number;
  pickups: number;
  hazards: number;
  score: number;
}

export interface SimState {
  t: number;
  kart: KartState;
  stats: RunStats;
  consumed: Set<string>;
  done: boolean;
}

export type RunPhase = 'intro' | 'countdown' | 'running' | 'paused' | 'results';

export type GameEvent =
  | { type: 'runStart'; t: number }
  | { type: 'chapterSeen'; chapterId: string; t: number }
  | { type: 'pickup'; objectId: string; t: number }
  | { type: 'hazardHit'; objectId: string; t: number }
  | { type: 'runComplete'; score: number; t: number }
  | { type: 'pause'; t: number }
  | { type: 'resume'; t: number }
  | { type: 'restart'; t: number };

export type GameEventType = GameEvent['type'];

/** Placeholder mirroring PRD §12 fields; refined in P3.1. */
export interface Briefing {
  briefingId: string;
  contentVersion: number;
  title: string;
  summary: string;
  brandName: string;
  publishedAt: string;
  coverageEnd: string;
  displayTimezone: string;
  courseId: string;
  courseVersion: number;
  scoringVersion: number;
  chapters: unknown[];
  takeaways: string[];
  sources: { title: string; url: string }[];
  cta: { label: string; url: string; campaignId: string };
  shareText: string;
  socialImage: string;
  learningQuestion?: unknown;
}


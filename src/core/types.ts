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
  /** Optional tagged course segments (e.g. braking zones). */
  segments?: CourseSegment[];
}

export interface CourseSegment {
  s0: number;
  s1: number;
  brakeZone?: boolean;
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
  | { type: 'restart'; t: number }
  | { type: 'learningAnswer'; questionId: string; correct: boolean }
  | { type: 'briefingRead'; entryScreen: 'intro' | 'results' | 'fallback' }
  | { type: 'app_error'; code: string };

export type GameEventType = GameEvent['type'];

export type Classification = 'historical' | 'interpretation' | 'hypothetical';
export interface Chapter {
  id: string;
  startSec: number;
  endSec: number;
  caption: string;
  summary: string;
  classification: Classification;
  label: string;
  forwardLooking: boolean;
}
export interface LearningQuestion {
  id: string;
  prompt: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
}
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
  chapters: Chapter[];
  takeaways: { text: string; classification: Classification; label: string }[];
  sources: { title: string; url: string }[];
  cta: { id: string; label: string; url: string; campaignId: string; destinationCategory: string };
  shareText: string;
  socialImage: string;
  glossary: { term: string; definition: string }[];
  disclaimer: string;
  approval: { approved: boolean; approvedBy?: string; approvedAt?: string };
  learningQuestion?: LearningQuestion;
}

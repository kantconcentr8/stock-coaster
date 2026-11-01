import { describe, expect, it } from 'vitest';
import { createBriefingLoader } from '@/content/loader';
import course from '@/content/courses/course-01.json';
import type { CourseDef } from '@/core/types';
import valid from '../fixtures/briefings/valid.json';

describe('briefing loader', () => {
  const load = createBriefingLoader([valid], [course as CourseDef]);
  it('selects the ID and ignores attribution query parameters', () => {
    expect(load(`?b=${valid.briefingId}&utm_source=ignored`).notice).toBeUndefined();
    expect(load('').briefing.briefingId).toBe(valid.briefingId);
  });
  it('falls back visibly for unknown and malicious IDs', () => {
    expect(load('?b=unknown-id').notice).toBe('unknown-id');
    for (const id of ['<script>', '../', '']) {
      const result = load(`?b=${encodeURIComponent(id)}`);
      expect(result.notice).toBe('invalid-id');
      expect(result.briefing.briefingId).toBe(valid.briefingId);
    }
  });
  it('fails closed on invalid runtime content or missing referenced course', () => {
    expect(() => createBriefingLoader([{ ...valid, title: null }], [])('')).toThrow('title');
    expect(() => createBriefingLoader([valid], [])('')).toThrow('referenced course');
  });
});

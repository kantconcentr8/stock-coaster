import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateBriefing } from '@/content/schema';
import valid from '../fixtures/briefings/valid.json';

describe('briefing schema', () => {
  it('accepts complete content and enforces owner approval in production', () => {
    expect(validateBriefing(valid).briefing.briefingId).toBe(valid.briefingId);
    expect(() => validateBriefing(valid, { production: true })).toThrow('owner approval');
    expect(() =>
      validateBriefing(valid, { production: true, allowUnapproved: true }),
    ).not.toThrow();
  });
  const directory = new URL('../fixtures/briefings/', import.meta.url);
  for (const file of readdirSync(directory).filter((f) => f !== 'valid.json')) {
    it(`rejects ${file} with a readable reason`, () => {
      expect(() =>
        validateBriefing(JSON.parse(readFileSync(new URL(file, directory), 'utf8'))),
      ).toThrow(/required|invalid|overlap|out-of-range|Hypothetical|HTTPS/);
    });
  }
  it('rejects bad timezone, cutoff, forward-looking classification, answers, and approval metadata', () => {
    for (const mutate of [
      (b: typeof valid) => {
        b.displayTimezone = 'bad/zone';
      },
      (b: typeof valid) => {
        b.coverageEnd = '2027-01-01T00:00:00Z';
      },
      (b: typeof valid) => {
        b.chapters[2]!.classification = 'interpretation';
      },
      (b: typeof valid) => {
        b.learningQuestion.correctIndex = 4;
      },
      (b: typeof valid) => {
        b.approval.approved = true;
      },
    ]) {
      const b = structuredClone(valid);
      mutate(b);
      expect(() => validateBriefing(b)).toThrow();
    }
  });
  it('warns at 13 words and rejects more than 16', () => {
    const b = structuredClone(valid);
    b.chapters[0]!.caption = Array(13).fill('word').join(' ');
    expect(validateBriefing(b).warnings).toHaveLength(1);
    b.chapters[0]!.caption += ' word word word word';
    expect(() => validateBriefing(b)).toThrow('16 words');
  });
});

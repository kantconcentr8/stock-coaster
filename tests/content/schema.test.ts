import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isSourceUrl, validateBriefing } from '@/content/schema';
import valid from '../fixtures/briefings/valid.json';
import type { Briefing } from '@/core/types';

describe('briefing schema', () => {
  it('allows packaged research but rejects traversal, external relative URLs and active content', () => {
    expect(isSourceUrl('/research/october-30-session-notes.txt')).toBe(true);
    expect(isSourceUrl('https://example.org/research')).toBe(true);
    for (const url of [
      '//example.org/research.txt',
      '/research/../private.txt',
      '/research/%2e%2e/private.txt',
      '/research/notes.html',
      'javascript:alert(1)',
      'file:///private.txt',
      '/research/notes.txt?redirect=1',
    ])
      expect(isSourceUrl(url)).toBe(false);
    const b = structuredClone(valid) as Briefing;
    b.sources = [{ title: 'Packaged research', url: '/research/session.txt' }];
    expect(() => validateBriefing(b)).not.toThrow();
    b.sources[0]!.url = '/research/../private.txt';
    expect(() => validateBriefing(b)).toThrow('sources.url');
  });
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

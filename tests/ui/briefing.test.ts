// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateBriefing } from '@/content/schema';
import { createBriefingPanel } from '@/ui/screens/briefing';
import { createIntroScreen } from '@/ui/screens/intro';
import { createResultsScreen } from '@/ui/screens/results';
import { formatCoverage } from '@/ui/format';
import valid from '../fixtures/briefings/valid.json';

afterEach(() => document.body.replaceChildren());
const briefing = validateBriefing(valid).briefing;
describe('intro briefing', () => {
  it('shows named timezone dates, safe text, fallback notice and readable content without playing', () => {
    const start = vi.fn(),
      read = vi.fn();
    const intro = createIntroScreen(start, {
      briefing: { ...briefing, title: '<script>alert(1)</script>' },
      notice: 'unknown-id',
      onRead: read,
    });
    document.body.append(intro.root);
    expect(intro.root.querySelector('script')).toBeNull();
    expect(intro.root.textContent).toContain('Unknown briefing link');
    expect(intro.root.textContent).toContain(formatCoverage(briefing));
    expect(formatCoverage({ ...briefing, publishedAt: '2026-11-01T02:30:00Z' })).toContain(
      'Oct 31, 2026',
    );
    (intro.root.querySelector('.btn-secondary') as HTMLButtonElement).click();
    expect(read).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
    (intro.root.querySelector('#btn-start') as HTMLButtonElement).click();
    expect(start).toHaveBeenCalledOnce();
  });
});
describe('text briefing', () => {
  it('has safe source links and restores opener focus on close', () => {
    const opened = vi.fn();
    const opener = document.createElement('button');
    const panel = createBriefingPanel(
      { ...briefing, sources: [{ title: 'Approved source', url: 'https://example.com/research' }] },
      opened,
    );
    document.body.append(opener, panel.root);
    opener.focus();
    panel.open('intro');
    expect(opened).toHaveBeenCalledWith('intro');
    expect(panel.root.textContent).toContain('Hypothetical scenario');
    const source = panel.root.querySelector('a[target="_blank"]')!;
    expect(source.getAttribute('rel')).toBe('noopener noreferrer');
    expect(source.getAttribute('href')).toMatch(/^https:/);
    panel.close();
    expect(document.activeElement).toBe(opener);
  });
});
describe('results briefing', () => {
  it('places takeaways before CTA, keeps question optional, and resets answers for retry', () => {
    const answer = vi.fn(),
      retry = vi.fn();
    const results = createResultsScreen(retry, { briefing, onRead: vi.fn(), onAnswer: answer });
    document.body.append(results.root);
    results.show({ distance: 2000, pickups: 2, hazards: 1, score: 123 });
    const text = results.root.textContent!;
    expect(text).toContain('Arcade score');
    expect(text).not.toMatch(/\$|P&L|return|portfolio/i);
    expect(text.indexOf('Briefing takeaways')).toBeLessThan(text.indexOf(briefing.cta.label));
    (results.root.querySelector('#btn-retry') as HTMLButtonElement).click();
    expect(retry).toHaveBeenCalledOnce();
    expect(answer).not.toHaveBeenCalled();
    const choices = results.root.querySelectorAll<HTMLButtonElement>('fieldset button');
    choices[1]!.click();
    expect(answer).toHaveBeenCalledWith('bounce-repair', true);
    expect(choices[0]!.disabled).toBe(true);
    results.show({ distance: 0, pickups: 0, hazards: 0, score: 0 });
    expect(choices[0]!.disabled).toBe(false);
  });
});

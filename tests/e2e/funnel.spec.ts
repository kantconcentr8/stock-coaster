import { expect, test } from '@playwright/test';
import { completeRun, entry, events } from './helpers';
test('full funnel, retry, local best, safe CTA and manual share', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // All outbound traffic is intercepted, including the configured waitlist.
  let outbound: string | undefined;
  await page.context().route('https://predictourney.site/**', (route) => {
    outbound = route.request().url();
    return route.fulfill({ contentType: 'text/html', body: '<p>Nonproduction CTA test</p>' });
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
      configurable: true,
    });
  });
  await page.goto(entry);
  expect((await events(page)).filter((e) => e.name === 'landing_view')).toHaveLength(1);
  await completeRun(page);
  await expect(page.locator('#briefing-cta')).toBeInViewport();
  await expect(page.locator('#btn-retry')).toBeInViewport();
  await expect(page.locator('#btn-share')).toBeInViewport();
  expect(
    await page.locator('#screen-results').evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: `test-results/results-${test.info().project.name}.png` });
  await expect(page.locator('#local-best')).toContainText('Your best:');
  await expect(page.locator('#local-best')).toContainText('New best!');
  expect((await events(page)).filter((e) => e.name === 'run_complete')).toHaveLength(1);
  expect((await events(page)).filter((e) => e.name === 'chapter_seen')).toHaveLength(3);
  await page.locator('#btn-retry').click();
  await expect(page.locator('#screen-results')).toBeVisible({ timeout: 25000 });
  const records = await events(page);
  expect(records.filter((e) => e.name === 'run_restart')).toHaveLength(1);
  const completions = records.filter((e) => e.name === 'run_complete');
  expect(completions).toHaveLength(2);
  expect(completions[0]?.properties.runId).not.toBe(completions[1]?.properties.runId);
  await page.getByRole('button', { name: 'Read full briefing' }).click();
  expect((await events(page)).filter((e) => e.name === 'briefing_read')).toHaveLength(1);
  const cta = page.locator('#briefing a').last();
  const target = new URL((await cta.getAttribute('href'))!);
  expect(target.searchParams.get('utm_source')).toBe('x');
  expect(target.searchParams.get('utm_campaign')).toBe('t');
  expect(target.searchParams.has('email')).toBe(false);
  await page.getByRole('button', { name: 'Close briefing' }).click();
  await page.locator('#btn-share').click();
  await expect(page.getByRole('textbox', { name: 'Briefing share link' })).toBeVisible();
  const share = new URL(
    await page.getByRole('textbox', { name: 'Briefing share link' }).inputValue(),
  );
  expect([...share.searchParams.keys()].sort()).toEqual(['b', 'utm_medium', 'utm_source']);
  expect(share.hash).toBe('');
  expect((await events(page)).filter((e) => e.name === 'share_action')).toHaveLength(1);
  expect(JSON.stringify(await events(page))).not.toMatch(/a@b.c|email|fbclid/);
  await page.locator('#briefing-cta').evaluate((link: HTMLAnchorElement) => {
    link.target = '_blank';
  });
  const popup = page.waitForEvent('popup');
  await page.locator('#briefing-cta').click();
  const destination = await popup;
  await destination.waitForLoadState();
  await expect.poll(() => outbound).toBeTruthy();
  expect(new URL(outbound!).searchParams.get('utm_content')).toBe('waitlist');
  expect((await events(page)).filter((e) => e.name === 'cta_click')).toHaveLength(1);
  await destination.close();
  expect(errors).toEqual([]);
});
test('throwing analytics and blocked external requests leave gameplay and CTA working', async ({
  page,
}) => {
  await page.route('https://**/*', (route) => route.abort());
  await page.goto(entry);
  await page.evaluate(() => {
    window.__ccEvents!.push = () => {
      throw new Error('transport blocked');
    };
  });
  await completeRun(page);
  await expect(page.locator('#briefing-cta')).toHaveAttribute('href', /utm_source=x/);
  await page.locator('#btn-retry').click();
  await expect(page.locator('#screen-results')).toBeVisible({ timeout: 25000 });
});

test('ordinary entry has no analytics identity and persists preferences', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#btn-start')).toBeVisible();
  expect(await page.evaluate(() => window.__ccEvents)).toBeUndefined();
  expect(await page.evaluate(() => sessionStorage.getItem('cc:v1:session'))).toBeNull();
  await page.getByRole('checkbox', { name: 'Reduce motion' }).check();
  await page.getByRole('checkbox', { name: 'Sound (when available)' }).check();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Reduce motion' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Sound (when available)' })).toBeChecked();
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const title = 'Lower value: a bounce is not repair';
test('passenger recap connects introduction, briefing chapters, ending, sharing and CTA', async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Blocked');
        },
      },
    });
  });
  await page.goto('/?utm_source=qa&utm_campaign=passenger&email=private#secret');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.locator('.recap-coverage')).toContainText('Oct 30, 2026');
  await expect(page.locator('.recap-draft')).toHaveCount(0);
  await expect(page.locator('.ride-eyebrow')).toHaveText('The Daily Ride');
  await expect(page.getByRole('button', { name: /boost|brake/i })).toHaveCount(0);
  await expect(page.getByText('Momentum', { exact: true })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-intro.png` });
  const progress = page.locator('.ride-progress');
  await expect(progress).toHaveAttribute('style', 'width: 0%;');
  await page.getByRole('button', { name: 'Start ride', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.ride-stage')).toHaveText('The climb');
  await expect(page.locator('.ride-caption')).toContainText('October 30: price fell');
  await expect(page.locator('.ride-stage')).toHaveText('At the crest', { timeout: 14000 });
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-crest.png` });
  await expect(page.locator('.ride-stage')).toHaveText('The plunge', { timeout: 6000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-drop.png` });
  await page.getByRole('button', { name: 'Read briefing & sources' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const sources = page.getByRole('dialog').locator('.briefing-chart > a:last-child');
  await expect(sources).toHaveCount(4);
  for (const source of await sources.all()) {
    const response = await page.request.get((await source.getAttribute('href'))!);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/jpeg');
    expect((await response.body()).length).toBeGreaterThan(1000);
  }
  await expect(page.getByRole('dialog')).not.toContainText('TODO(owner)');
  const paused = await progress.getAttribute('style');
  await page.waitForTimeout(300);
  expect(await progress.getAttribute('style')).toBe(paused);
  await page.getByRole('button', { name: 'Close briefing' }).click();
  await expect(page.getByRole('button', { name: 'Read briefing & sources' })).toBeFocused();
  await page.getByRole('button', { name: 'Resume ride' }).click();
  await expect(page.locator('.ride-caption')).toContainText('A bounce alone', { timeout: 12000 });
  await expect(page.locator('.ride-caption')).toContainText('Hypothetical / not observed', {
    timeout: 12000,
  });
  await expect(page.locator('.ride-caption')).toContainText('will participation confirm');
  await expect(page.locator('.ride-stage')).toHaveText('Recap complete', { timeout: 10000 });
  await expect(progress).toHaveAttribute('style', 'width: 100%;');
  await expect(page.getByRole('heading', { name: 'Takeaways', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Takeaways', exact: true })).toBeVisible();
  const cta = page.getByRole('link', { name: 'Join the Predictourney waitlist', exact: true });
  await expect(cta).toBeInViewport();
  const url = new URL((await cta.getAttribute('href'))!);
  expect(url.searchParams.get('utm_source')).toBe('qa');
  expect(url.searchParams.get('utm_campaign')).toBe('passenger');
  expect(url.searchParams.has('email')).toBe(false);
  await page.getByRole('button', { name: 'Share recap' }).click();
  const shared = new URL(
    await page.getByRole('textbox', { name: 'Recap share link' }).inputValue(),
  );
  // Allow less than one CSS pixel of subpixel scroll rounding in Chromium.
  await expect(page.getByRole('textbox', { name: 'Recap share link' })).toBeInViewport({
    ratio: 0.98,
  });
  expect(Object.fromEntries(shared.searchParams)).toEqual({
    b: '2026-10-31-lower-value',
    utm_source: 'share',
    utm_medium: 'manual',
  });
  expect(shared.hash).toBe('');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-end.png` });
  await page.getByRole('button', { name: 'Replay the coaster sequence' }).click();
  await expect(page.getByRole('button', { name: 'Pause ride' })).toBeVisible();
  await expect(page.locator('.ride-caption')).toContainText('October 30: price fell');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Resume ride' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('published root is passenger-first and old prototype links remain usable', async ({
  page,
}) => {
  await page.goto('/?b=2026-10-31-lower-value');
  await expect(page.locator('.ride-eyebrow')).toHaveText('The Daily Ride');
  await expect(page.getByRole('button', { name: 'Start ride', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__ccEvents)).toBeUndefined();
  await expect(page.locator('#btn-start')).toHaveCount(0);
  await page.goto('/?prototype=coaster&b=2026-10-31-lower-value');
  await expect(page.locator('.ride-eyebrow')).toHaveText('The Daily Ride');
});

test('reduced motion, resize, blur and unavailable audio preserve passenger controls', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      value: class {
        constructor() {
          throw new Error('Audio blocked');
        }
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Sound off' }).click();
  await expect(page.getByRole('button', { name: 'Sound on' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Start ride', exact: true }).click();
  await expect(page.locator('.ride-stage')).toHaveText('The climb');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByRole('button', { name: 'Resume ride' })).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  for (const name of [
    'Resume ride',
    'Replay the coaster sequence',
    'Sound on',
    'Read briefing & sources',
  ])
    await expect(page.getByRole('button', { name })).toBeInViewport();
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-landscape.png` });
});

test('unknown recap falls back visibly and absent canvas retains dated text and sources', async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/?b=missing-recap');
  await expect(page.getByText('That recap is unavailable.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start ride', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Read briefing & sources' }).click();
  await expect(page.getByRole('dialog')).toContainText(title);
  await expect(page.getByRole('dialog')).toContainText('Oct 30, 2026');
  await expect(
    page.getByRole('dialog').getByRole('link', { name: 'Join waitlist', exact: true }),
  ).toBeVisible();
});

test('phone-first text remains readable and controls stay separate at narrow and desktop widths', async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 568],
    [390, 664],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.goto('/');
    await expect(page.locator('.ride-market summary')).toHaveText('Market data');
    const headerBox = (await page.locator('.ride-top').boundingBox())!;
    const dataBox = (await page.locator('.ride-market summary').boundingBox())!;
    expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(dataBox.y);
    const card = page.locator('section.recap-card:not([hidden])');
    const metrics = await card.evaluate((element) => {
      const body = element.querySelector('.recap-card-body')!;
      return {
        bodyFont: parseFloat(getComputedStyle(body).fontSize),
        bodyHeight: body.clientHeight,
        bottom: element.getBoundingClientRect().bottom,
      };
    });
    expect(metrics.bodyFont).toBeGreaterThanOrEqual(16);
    expect(metrics.bodyHeight).toBeGreaterThanOrEqual(72);
    const start = page.getByRole('button', { name: 'Start ride', exact: true });
    const button = (await start.boundingBox())!;
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(button.width).toBeGreaterThanOrEqual(44);
    expect(metrics.bottom).toBeLessThan(button.y);
    await expect(start).toBeInViewport({ ratio: 0.98 });
    await expect(page.getByRole('button', { name: 'Read briefing & sources' })).toBeInViewport({
      ratio: 0.98,
    });
    await page.screenshot({
      path: `test-results/readability-${test.info().project.name}-${width}-intro.png`,
    });
    await start.click();
    await expect(page.locator('.ride-caption')).toBeVisible();
    expect(
      await page.locator('.ride-caption').evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(20);
    await page.getByRole('button', { name: 'Pause ride' }).click();
    await page.screenshot({
      path: `test-results/readability-${test.info().project.name}-${width}-ride.png`,
    });
    await page.getByRole('button', { name: 'Read briefing & sources' }).click();
    expect(
      await page.getByRole('dialog').evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await page.getByRole('button', { name: 'Close briefing' }).click();
  }
});

test('header reflow keeps market data and the recap below a taller phone title', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.locator('.ride-top h1').evaluate((title) => {
    title.style.fontFamily = 'monospace';
    title.style.letterSpacing = '0.08em';
    title.style.lineHeight = '1.3';
  });
  await expect
    .poll(async () => {
      const header = (await page.locator('.ride-top').boundingBox())!;
      const data = (await page.locator('.ride-market summary').boundingBox())!;
      const card = (await page.locator('.recap-card:not([hidden])').boundingBox())!;
      return data.y >= header.y + header.height + 11 && card.y >= data.y + data.height + 11;
    })
    .toBe(true);
  await expect(page.getByRole('button', { name: 'Start ride', exact: true })).toBeInViewport();
  await page.screenshot({ path: `test-results/header-reflow-${test.info().project.name}.png` });
});

test('briefing footer offers waitlist and return buttons without resetting the ride', async ({
  page,
}) => {
  await page.goto('/?utm_source=footer-qa');
  await page.getByRole('button', { name: 'Start ride', exact: true }).click();
  await expect(page.locator('.ride-stage')).toHaveText('The climb');
  await page.getByRole('button', { name: 'Read briefing & sources' }).click();
  const dialog = page.getByRole('dialog');
  const waitlist = dialog.getByRole('link', { name: 'Join waitlist', exact: true });
  const back = dialog.getByRole('button', { name: 'Back to game', exact: true });
  await back.scrollIntoViewIfNeeded();
  await expect(waitlist).toBeInViewport({ ratio: 0.98 });
  await expect(back).toBeInViewport({ ratio: 0.98 });
  expect(new URL((await waitlist.getAttribute('href'))!).searchParams.get('utm_source')).toBe(
    'footer-qa',
  );
  const paused = await page.locator('.ride-progress').getAttribute('style');
  await page.screenshot({ path: `test-results/briefing-footer-${test.info().project.name}.png` });
  await back.click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume ride' })).toBeVisible();
  expect(await page.locator('.ride-progress').getAttribute('style')).toBe(paused);
  await expect(page.getByRole('button', { name: 'Read briefing & sources' })).toBeFocused();
});

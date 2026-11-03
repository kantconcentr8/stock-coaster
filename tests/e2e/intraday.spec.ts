import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('saved AAPL ride, unavailable ES, pause, context and symbol sharing work on phones', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/intraday/2026-11-02-es-15m.json', (route) =>
    route.fulfill({ status: 404, body: 'No saved test series' }),
  );
  let aaplReads = 0;
  const providers: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/intraday/2026-11-02-aapl-15m.json')) aaplReads++;
    if (request.url().includes('twelvedata.com')) providers.push(request.url());
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });
  await page.goto('/intraday.html?experience=intraday&symbol=AAPL&email=private#secret');
  await expect(page.getByRole('button', { name: 'Start ride', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Mag 7 · AAPL' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Start ride', exact: true }).click();
  await page.waitForTimeout(1400);
  await page.getByRole('button', { name: 'Pause ride' }).click();
  const progress = page.getByRole('progressbar');
  const value = await progress.getAttribute('value');
  await page.waitForTimeout(200);
  expect(await progress.getAttribute('value')).toBe(value);
  await page.screenshot({ path: `test-results/intraday-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Read context & bars' }).click();
  await expect(page.getByRole('dialog').locator('tbody tr')).toHaveCount(26);
  await expect(page.getByRole('dialog')).toContainText('not supported');
  await page.getByRole('button', { name: 'Back to ride' }).click();
  await expect(page.getByRole('button', { name: 'Read context & bars' })).toBeFocused();
  await page.getByRole('button', { name: 'Futures · ES', exact: true }).click();
  await expect(page.getByRole('status').first()).toContainText('Awaiting verified ESZ26');
  await expect(page.getByRole('button', { name: 'Start ride', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Mag 7 · AAPL', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start ride', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Share selected ride' }).click();
  const shared = new URL(
    await page.getByRole('textbox', { name: 'Selected ride link' }).inputValue(),
  );
  expect(Object.fromEntries(shared.searchParams)).toEqual({
    experience: 'intraday',
    symbol: 'AAPL',
  });
  expect(shared.hash).toBe('');
  expect(shared.pathname).toBe('/intraday.html');
  expect(aaplReads).toBe(1);
  expect(providers).toEqual([]);
});

test('dedicated preview metadata describes November 2 and the default pilot stays unchanged', async ({
  page,
}) => {
  await page.goto('/intraday.html?symbol=ES');
  await expect(page.getByRole('button', { name: 'Start ride', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Futures · ES / December 2026' })).toBeVisible();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /November 2/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /intraday\.html$/);
  await page.goto('/');
  await expect(page.locator('.ride-eyebrow')).toHaveText('The Daily Ride');
});

for (const [symbol, close] of [
  ['AAPL', '339.11'],
  ['ES', '7576.25'],
] as const)
  test(`complete ${symbol} 54-second session ends on its saved final close`, async ({ page }) => {
    test.setTimeout(140000);
    await page.goto(`/?experience=intraday&symbol=${symbol}`);
    await page.getByRole('button', { name: 'Start ride', exact: true }).click();
    await expect(page.locator('.intraday-caption')).toContainText(`${symbol} session complete`, {
      timeout: 125000,
    });
    await expect(page.locator('.intraday-clock')).toContainText('16:00 NY');
    await expect(page.locator('.intraday-clock')).toContainText(close);
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Pause ride' })).toBeVisible();
  });

import { expect, test } from '@playwright/test';

test('a narrow phone exposes every saved symbol during one ride', async ({ page }) => {
  test.setTimeout(70000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const symbols = new Set<string>();
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      if (/^[A-Z]{1,5}$/.test(text)) symbols.add(text);
      return maxWidth === undefined
        ? original.call(this, text, x, y)
        : original.call(this, text, x, y, maxWidth);
    };
    Object.assign(window, { renderedSymbols: symbols });
  });
  await page.goto('/?prototype=coaster');
  await expect(page.locator('.ride-market summary')).toHaveText('Market data');
  const expected = await page.locator('.ride-market tbody tr td:first-child').allTextContents();
  expect(expected.length).toBe(10);
  await page.evaluate(() => {
    (window as unknown as { renderedSymbols: Set<string> }).renderedSymbols.clear();
  });
  await page.getByRole('button', { name: 'Start ride', exact: true }).click();
  await expect(page.locator('.ride-stage')).toHaveText('Recap complete', { timeout: 55000 });
  const seen = await page.evaluate(() => [
    ...(window as unknown as { renderedSymbols: Set<string> }).renderedSymbols,
  ]);
  expect(seen).toEqual(expect.arrayContaining(expected));
});

test('recap candles load once from a saved file, with accessible OHLC and no provider calls', async ({
  page,
}) => {
  let reads = 0;
  const providerRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('twelvedata.com')) providerRequests.push(request.url());
  });
  await page.route('**/market/2026-10-31-lower-value.json', async (route) => {
    reads++;
    await route.fulfill({
      json: {
        version: 1,
        briefingId: '2026-10-31-lower-value',
        sessionDate: '2026-10-30',
        fetchedAt: '2026-11-01T12:00:00Z',
        source: 'Twelve Data',
        unavailable: ['ES'],
        candles: [
          {
            symbol: 'AAPL',
            kind: 'stock',
            date: '2026-10-30',
            open: 100,
            high: 110,
            low: 95,
            close: 105,
          },
        ],
      },
    });
  });
  await page.goto('/?prototype=coaster');
  const summary = page.locator('.ride-market summary');
  await expect(summary).toHaveText('Market data');
  await summary.click();
  await expect(page.locator('.ride-market-panel')).toContainText(
    '2026-10-30 close / 1 symbol / Twelve Data',
  );
  await expect(page.getByRole('cell', { name: 'AAPL', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '110.00', exact: true })).toBeVisible();
  await expect(page.getByText('Unavailable in this snapshot:', { exact: false })).toContainText(
    'ES',
  );
  await page.screenshot({ path: `test-results/market-${test.info().project.name}-details.png` });
  await summary.click();
  await page.getByRole('button', { name: 'Start ride', exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Replay the coaster sequence' }).click();
  await page.waitForTimeout(300);
  expect(reads).toBe(1);
  expect(providerRequests).toEqual([]);
});

test('missing recap data keeps candles explicitly illustrative', async ({ page }) => {
  await page.route('**/market/*.json', (route) =>
    route.fulfill({ status: 404, body: 'Not found' }),
  );
  await page.goto('/?prototype=coaster');
  await expect(page.locator('.ride-market summary')).toHaveText('No saved data');
  await page.getByRole('button', { name: 'Start ride', exact: true }).click();
  await expect(page.locator('.ride-stage')).toHaveText('The climb');
});

test('a saved candle file for the wrong session is not presented as recap data', async ({
  page,
}) => {
  await page.route('**/market/*.json', (route) =>
    route.fulfill({
      json: {
        version: 1,
        briefingId: '2026-10-31-lower-value',
        sessionDate: '2026-10-29',
        fetchedAt: '2026-11-01T12:00:00Z',
        source: 'Twelve Data',
        unavailable: [],
        candles: [
          {
            symbol: 'AAPL',
            kind: 'stock',
            date: '2026-10-29',
            open: 100,
            high: 110,
            low: 95,
            close: 105,
          },
        ],
      },
    }),
  );
  await page.goto('/?prototype=coaster');
  await expect(page.locator('.ride-market summary')).toHaveText('No saved data');
  await expect(page.locator('.ride-market table')).toHaveCount(0);
});

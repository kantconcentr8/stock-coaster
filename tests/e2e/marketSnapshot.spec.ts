import { expect, test } from '@playwright/test';

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
  await expect(summary).toHaveText('2026-10-30 close / 1 symbol / Twelve Data');
  await summary.click();
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
  await expect(page.locator('.ride-market summary')).toContainText('Illustrative candles');
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
  await expect(page.locator('.ride-market summary')).toContainText('Illustrative candles');
  await expect(page.locator('.ride-market table')).toHaveCount(0);
});

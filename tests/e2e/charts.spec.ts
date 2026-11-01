import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('public charts expand on phones without exposing editorial notes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Read briefing & sources' }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'Charts & context', exact: true }),
  ).toBeVisible();
  await expect(dialog.locator('a[href^="/research/"]')).toHaveCount(0);
  await expect(dialog).toContainText('The lower advance/decline panel is labeled Nasdaq');
  const charts = dialog.locator('.briefing-chart');
  await expect(charts).toHaveCount(4);
  await expect(charts.nth(2)).toBeHidden();
  await dialog.getByText('More charts — NDX and SPX', { exact: true }).click();
  for (const chart of await charts.all()) {
    const image = chart.locator('img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1920);
    await expect(image).toHaveAttribute('alt', /.+/);
    expect(await image.evaluate((img) => img.getBoundingClientRect().width)).toBeLessThan(390);
    await expect(chart).toContainText('Owner-supplied thinkorswim screenshot');
    await expect(chart.locator('a').last()).toHaveAttribute('target', '_blank');
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await charts.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/charts-${test.info().project.name}.png` });
  const popupPromise = page.waitForEvent('popup');
  await charts.first().locator('a').last().click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(new URL(popup.url()).pathname).toBe('/charts/october-30-es.jpg');
  await popup.close();
  for (const oldPath of [
    '/research/october-30-session-notes.txt',
    '/research/october-november-2026-market-structure.txt',
  ]) {
    const response = await page.request.get(oldPath);
    expect(response.headers()['content-type'] ?? '').not.toContain('text/plain');
    expect(await response.text()).not.toContain('These 20-day hourly charts');
  }
});

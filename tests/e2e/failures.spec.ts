import { expect, test } from '@playwright/test';
import { completeRun } from './helpers';
test('unavailable graphics retains text briefing and CTA', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/?utm_source=failure');
  await expect(page.locator('#screen-fallback')).toBeVisible();
  await expect(page.locator('#screen-fallback a[href^="https:"]')).toHaveAttribute(
    'href',
    /utm_source=failure/,
  );
  await page.getByRole('link', { name: 'Read the briefing', exact: true }).click();
  await expect(page.locator('#briefing')).toBeVisible();
});
test('blocked storage and audio with invalid ID still completes a run', async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of ['localStorage', 'sessionStorage'])
      Object.defineProperty(window, key, {
        get: () => {
          throw new Error('blocked');
        },
      });
    Object.defineProperty(window, 'AudioContext', {
      value: class {
        constructor() {
          throw new Error('blocked');
        }
      },
    });
  });
  await page.goto('/?b=bad!&testSpeed=8');
  await expect(page.getByRole('status')).toContainText('Invalid briefing link');
  await page.getByRole('checkbox', { name: 'Sound (when available)' }).check();
  await completeRun(page);
  await expect(page.locator('#briefing-cta')).toBeVisible();
  await page.locator('#btn-retry').click();
  await expect(page.locator('#screen-results')).toBeVisible({ timeout: 25000 });
});
test('runtime error shows a safe recovery action without exposing exception text', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#btn-start')).toBeEnabled();
  await page.evaluate(() =>
    window.dispatchEvent(new ErrorEvent('error', { message: 'private@example.test secret' })),
  );
  await expect(page.locator('.error-notice')).toBeVisible();
  await expect(page.locator('.error-notice')).not.toContainText('private@example.test');
  await page.locator('.error-notice button').click();
  await expect(page.locator('#briefing')).toBeVisible();
});
test('failed renderer download keeps the briefing available', async ({ page }) => {
  await page.route('**/src/render/createGame.ts*', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('#screen-fallback')).toBeVisible();
  await page.getByRole('link', { name: 'Read the briefing', exact: true }).click();
  await expect(page.locator('#briefing')).toBeVisible();
});

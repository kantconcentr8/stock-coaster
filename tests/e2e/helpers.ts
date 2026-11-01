import { expect, type Page } from '@playwright/test';
export const briefingId = '2026-10-31-lower-value';
export const entry = `/?b=${briefingId}&utm_source=x&utm_campaign=t&email=a@b.c&analytics=debug&testSpeed=8`;
export async function completeRun(page: Page) {
  await page.locator('#btn-start').click();
  await expect(page.locator('#screen-results')).toBeVisible({ timeout: 25000 });
}
export async function events(page: Page) {
  return page.evaluate(() => window.__ccEvents ?? []);
}

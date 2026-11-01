import { expect, test } from '@playwright/test';
test('coaster study follows the drop, supports pause/replay and releases held controls', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?prototype=coaster');
  await expect(page.getByRole('heading', { name: 'The market is a ride.' })).toBeVisible();
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-crest.png` });
  await page.getByRole('button', { name: 'Ride the drop' }).click();
  await expect(page.locator('.ride-stage')).toContainText('plunge', { timeout: 15000 });
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-drop.png` });
  await page.getByRole('button', { name: 'Pause ride' }).click();
  const paused = await page.locator('.ride-progress').getAttribute('style');
  await expect(page.getByRole('button', { name: 'Ride the drop' })).toBeVisible();
  expect(await page.locator('.ride-progress').getAttribute('style')).toBe(paused);
  await page.getByRole('button', { name: 'Ride the drop' }).click();
  await expect(page.locator('.ride-stage')).toContainText('complete', { timeout: 45000 });
  await page.getByRole('button', { name: 'Replay the coaster sequence' }).click();
  await expect(page.locator('.ride-stage')).toContainText('crest');
  const boost = page.getByRole('button', { name: 'Hold to boost' });
  await boost.dispatchEvent('pointerdown', { pointerId: 1 });
  await boost.dispatchEvent('pointercancel', { pointerId: 1 });
  await expect(boost).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

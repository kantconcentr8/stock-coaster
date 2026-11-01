import { expect, test } from '@playwright/test';

test('passenger ride choreographs climb, crest, plunge and recovery with pause and replay', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?prototype=coaster');
  await expect(page.getByRole('heading', { name: 'The market is a ride.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /boost|brake/i })).toHaveCount(0);
  await expect(page.getByText('Momentum', { exact: true })).toHaveCount(0);
  const progress = page.locator('.ride-progress');
  await expect(page.locator('.ride-stage')).toHaveText('Ready to climb');
  await page.waitForTimeout(300);
  await expect(progress).toHaveAttribute('style', 'width: 0%;');
  await page.getByRole('button', { name: 'Start ride', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.ride-stage')).toHaveText('The climb');
  await expect(page.locator('.ride-stage')).toHaveText('At the crest', { timeout: 12000 });
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-crest.png` });
  await expect(page.locator('.ride-stage')).toHaveText('The plunge', { timeout: 6000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-drop.png` });
  await page.getByRole('button', { name: 'Pause ride' }).click();
  const paused = await progress.getAttribute('style');
  await page.waitForTimeout(400);
  expect(await progress.getAttribute('style')).toBe(paused);
  await page.getByRole('button', { name: 'Resume ride' }).click();
  await expect(page.locator('.ride-stage')).toHaveText('The recovery', { timeout: 12000 });
  await expect(page.locator('.ride-caption')).toContainText('slower than the fall');
  await expect(page.locator('.ride-stage')).toHaveText('Sequence complete', { timeout: 18000 });
  await expect(progress).toHaveAttribute('style', 'width: 100%;');
  await page.getByRole('button', { name: 'Replay the coaster sequence' }).click();
  await expect(page.getByRole('button', { name: 'Pause ride' })).toBeVisible();
  await expect(page.locator('.ride-stage')).toHaveText('The climb');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Resume ride' })).toBeVisible();
  expect(errors).toEqual([]);
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
  await page.goto('/?prototype=coaster');
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
  for (const name of ['Resume ride', 'Replay the coaster sequence', 'Sound on']) {
    await expect(page.getByRole('button', { name })).toBeInViewport();
  }
  await page.screenshot({ path: `test-results/coaster-${test.info().project.name}-landscape.png` });
});

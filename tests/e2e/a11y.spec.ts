import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function audit(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    result.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
  ).toEqual([]);
}
test('keyboard menus, briefing, pause and results are accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?testSpeed=8');
  await expect(page.locator('#btn-start')).toBeEnabled();
  await audit(page);
  await page.getByRole('button', { name: 'Read the briefing', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#briefing')).toBeVisible();
  await audit(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Read the briefing', exact: true })).toBeFocused();
  await page.locator('#btn-start').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#btn-hud-pause')).toBeVisible();
  await expect(page.locator('#screen-countdown')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#screen-pause')).toBeVisible();
  await audit(page);
  await page.locator('#btn-pause-resume').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-results')).toBeVisible({ timeout: 25000 });
  await audit(page);
  await expect(page.locator('#briefing-cta')).toBeInViewport();
  expect(await page.locator('#game').getAttribute('aria-hidden')).toBe('true');
  expect(await page.locator('html').getAttribute('data-reduced-motion')).toBe('true');
  await page.screenshot({ path: `test-results/a11y-${test.info().project.name}.png` });
});

import { test, expect } from '@playwright/test';

test('la app informa perdida y recuperacion de conexion', async ({ page, context }) => {
  await page.goto('/alto-andino');
  await expect(page.locator('body')).not.toHaveText('');
  await expect(page.locator('.vite-error-overlay')).toHaveCount(0);

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByText('Sin internet', { exact: true })).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByText('Sin internet', { exact: true })).toHaveCount(0, { timeout: 10000 });
});

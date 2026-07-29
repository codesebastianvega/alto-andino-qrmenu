import { test, expect } from '@playwright/test';

test('la primera visita al menú público termina la carga global', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/boku-bento/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('global-loader')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('body')).not.toHaveText('');
  await expect(page.locator('.vite-error-overlay')).toHaveCount(0);

  await context.close();
});

test('la primera entrada al panel termina la carga global', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/boku-bento/#admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('global-loader')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('body')).not.toHaveText('');
  await expect(page.locator('.vite-error-overlay')).toHaveCount(0);

  await context.close();
});

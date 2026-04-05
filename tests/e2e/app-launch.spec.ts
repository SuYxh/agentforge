import { test, expect } from '@playwright/test';

test.describe('App Launch', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AgentForge/i);
  });

  test('should display the main layout', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="sidebar"]').or(page.locator('.sidebar'))).toBeVisible({ timeout: 10000 });
  });
});

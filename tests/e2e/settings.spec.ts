import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test('should open settings modal', async ({ page }) => {
    await page.goto('/');
    // TODO: Click settings button
    // TODO: Verify modal visible
  });

  test('should switch theme', async ({ page }) => {
    await page.goto('/');
    // TODO: Open settings
    // TODO: Navigate to appearance
    // TODO: Toggle dark mode
    // TODO: Verify body class changes
  });
});

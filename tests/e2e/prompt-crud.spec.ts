import { test, expect } from '@playwright/test';

test.describe('Prompt CRUD', () => {
  test('should create a new prompt', async ({ page }) => {
    await page.goto('/');
    // TODO: Click create button (search for common patterns)
    // TODO: Fill form
    // TODO: Submit
    // TODO: Verify in list
  });

  test('should search for prompts', async ({ page }) => {
    await page.goto('/');
    // TODO: Type in search box
    // TODO: Verify results
  });

  test('should delete a prompt', async ({ page }) => {
    await page.goto('/');
    // TODO: Select a prompt
    // TODO: Click delete
    // TODO: Confirm
    // TODO: Verify removed
  });
});

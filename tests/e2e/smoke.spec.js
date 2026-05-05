import { test, expect } from '@playwright/test';

test('uses relative module assets for Pages-style hosting', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body script[type="module"][src="./main.js"]')).toHaveCount(1);
});

test('completes a truth-table step', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-testid="truth-table-practice"]')).toBeVisible();
  await expect(page.locator('[data-testid="expression-card"] .expression')).toContainText('a');

  const cell0 = page.getByTestId('truth-cell-result-0');
  const cell1 = page.getByTestId('truth-cell-result-1');

  await cell0.evaluate((button) => button.click());
  await cell0.evaluate((button) => button.click());
  await cell1.evaluate((button) => button.click());

  await page.getByTestId('truth-table-check-step').click();

  await expect(page.getByTestId('truth-table-feedback')).toContainText('truth table is finished');
});

test('completes a Venn step with keyboard region selection', async ({ page }) => {
  await page.goto('/');
  await page.locator('select[name="mode"]').selectOption('venn');

  await expect(page.locator('[data-testid="venn-practice"]')).toBeVisible();
  await expect(page.locator('[data-testid="expression-card"] .expression')).toContainText('a');

  await page.getByTestId('venn-region-1').press('Space');
  await page.getByTestId('venn-check-selection').click();

  await expect(page.getByTestId('venn-feedback')).toContainText('Venn answer is finished');
});

test('desktop shell stays readable and supports mode switching', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Practice boolean reasoning');
  await expect(page.locator('[data-testid="shell-status"]')).toBeVisible();

  await expect(page.locator('[data-testid="truth-table-practice"]')).toBeVisible();

  await page.locator('select[name="difficulty"]').selectOption('medium');
  await expect(page.locator('[data-testid="expression-card"] .expression')).toContainText('!a && b || c');

  await page.locator('select[name="mode"]').selectOption('venn');
  await expect(page.locator('[data-testid="venn-practice"]')).toBeVisible();
  await expect(page.locator('[data-testid="venn-feedback"]')).toContainText('Work through');
});

test('mobile shell stacks without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('h1')).toContainText('Practice boolean reasoning');
  await expect(page.locator('[data-testid="truth-table-practice"]')).toBeVisible();

  const shell = page.locator('.shell');
  const overflow = await shell.evaluate((element) => element.scrollWidth - element.clientWidth);

  expect(overflow).toBeLessThanOrEqual(1);
});

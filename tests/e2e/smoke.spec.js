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
  await expect(page.getByTestId('comparison-surface')).toBeVisible();

  await page.getByTestId('comparison-pair-1').click();
  await expect(page.getByTestId('comparison-row-1')).toContainText('Truth Table Row 2');
  await expect(page.getByTestId('comparison-region-1')).toContainText('Matching Venn Region 1');
});

test('uses truth-table bulk controls without skipping checks', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('truth-table-fill-true').click();
  await expect(page.getByTestId('truth-cell-result-0')).toContainText('T');

  await page.getByTestId('truth-table-clear-column').click();
  await expect(page.getByTestId('truth-cell-result-0')).toContainText('—');
  await expect(page.getByTestId('truth-table-current-step')).toContainText('1/1');
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

test('uses Venn bulk controls without skipping checks', async ({ page }) => {
  await page.goto('/');
  await page.locator('select[name="mode"]').selectOption('venn');

  await page.getByTestId('venn-shade-all').click();
  await expect(page.getByTestId('venn-region-0')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('venn-clear-selection').click();
  await expect(page.getByTestId('venn-region-0')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('venn-current-step')).toContainText('1/1');
});

test('completes an equivalence proof in both proof modes', async ({ page }) => {
  await page.goto('/');
  await page.locator('select[name="mode"]').selectOption('equivalence');

  await expect(page.locator('[data-testid="equivalence-practice"]')).toBeVisible();
  await expect(page.locator('[data-testid="expression-card"] .expression')).toContainText('≡');
  await expect(page.getByTestId('equivalence-first-difference')).toContainText('No differing rows');

  await page.getByTestId('equivalence-choice-equivalent').click();
  await page.getByTestId('equivalence-check').click();

  await expect(page.getByTestId('equivalence-feedback')).toContainText(
    'Correct. The proof shows matching rows and regions on every assignment.',
  );

  await page.getByTestId('equivalence-proof-venn').click();
  await expect(page.getByTestId('equivalence-proof-region-0')).toBeVisible();
});

test('checks a simplification guess and surfaces the proof', async ({ page }) => {
  await page.goto('/');
  await page.locator('select[name="mode"]').selectOption('simplification');

  await expect(page.locator('[data-testid="simplification-practice"]')).toBeVisible();
  await page.getByTestId('simplification-guess').fill('a');
  await page.getByTestId('simplification-check').click();

  await expect(page.getByTestId('simplification-feedback')).toContainText(
    'Equivalent and simpler by this metric',
  );
  await expect(page.getByTestId('simplification-first-difference')).toContainText(
    'No differing rows',
  );
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

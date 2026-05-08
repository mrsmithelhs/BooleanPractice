import { test, expect } from '@playwright/test';

test('uses relative module assets for Pages-style hosting', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body script[type="module"][src="./main.js"]')).toHaveCount(1);
});

test('completes a truth-table step', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-testid="truth-table-practice"]')).toBeVisible();
  await expect(page.locator('[data-testid="expression-card"] .expression')).toContainText('a');
  await expect(page.getByTestId('truth-table-check-step')).toBeInViewport();

  const cell0 = page.getByTestId('truth-cell-result-0');
  const cell1 = page.getByTestId('truth-cell-result-1');

  await cell0.evaluate((button) => button.click());
  await cell0.evaluate((button) => button.click());
  await cell1.evaluate((button) => button.click());

  await page.getByTestId('truth-table-check-step').click();

  await expect(page.getByTestId('truth-table-feedback')).toContainText('truth table is finished');
  await page.getByTestId('comparison-surface').evaluate((element) => {
    const disclosure = element.closest('details');
    if (disclosure) {
      disclosure.open = true;
    }
  });
  await expect(page.getByTestId('comparison-surface')).toBeVisible();

  await page.getByTestId('comparison-pair-1').click();
  await expect(page.getByTestId('comparison-row-1')).toContainText('Truth Table Row 2');
  await expect(page.getByTestId('comparison-region-1')).toContainText('Matching Venn Region 1');
});

test('surfaces targeted truth-table feedback after an incorrect check', async ({ page }) => {
  await page.goto('/');

  const cell0 = page.getByTestId('truth-cell-result-0');
  const cell1 = page.getByTestId('truth-cell-result-1');

  await cell0.evaluate((button) => button.click());
  await cell1.evaluate((button) => button.click());

  await page.getByTestId('truth-table-check-step').click();

  await expect(page.getByTestId('truth-table-feedback')).toContainText('does not match yet');
  await expect(page.getByTestId('truth-table-feedback')).not.toContainText('Correct for');
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

  await page.getByTestId('venn-region-1').focus();
  await page.keyboard.press('Space');
  await page.getByTestId('venn-region-0').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('venn-check-selection')).toBeEnabled();
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

test('clicks each two-input venn region at the SVG geometry level', async ({ page }) => {
  await page.goto('/');
  await page.locator('select[name="mode"]').selectOption('venn');
  await page.locator('select[name="problem"]').selectOption('tt-03-and-a-b');

  await expect(page.getByTestId('venn-practice')).toBeVisible();
  await expect(page.getByTestId('venn-check-selection')).toBeDisabled();

  const svg = page.locator('.venn-diagram__svg');

  const clickSvgPoint = async (x, y) => {
    await svg.scrollIntoViewIfNeeded();
    const point = await svg.evaluate((element, coords) => {
      const svgPoint = element.createSVGPoint();
      svgPoint.x = coords.x;
      svgPoint.y = coords.y;

      const screenPoint = svgPoint.matrixTransform(element.getScreenCTM());
      return {
        x: screenPoint.x,
        y: screenPoint.y,
      };
    }, { x, y });

    await page.mouse.click(point.x, point.y);
  };

  await clickSvgPoint(50, 20);
  await expect(page.getByTestId('venn-region-0')).toHaveAttribute('data-region-state', 'selected');

  await clickSvgPoint(32, 56);
  await expect(page.getByTestId('venn-region-2')).toHaveAttribute('data-region-state', 'selected');

  await clickSvgPoint(68, 56);
  await expect(page.getByTestId('venn-region-1')).toHaveAttribute('data-region-state', 'selected');

  await clickSvgPoint(50, 56);
  await expect(page.getByTestId('venn-region-3')).toHaveAttribute('data-region-state', 'selected');
  await expect(page.getByTestId('venn-check-selection')).toBeEnabled();
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
  await expect(page.getByTestId('equivalence-proof-left-region-0')).toBeVisible();
  await expect(page.getByTestId('equivalence-proof-right-region-0')).toBeVisible();
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
  await expect(page.locator('.workspace-bar .eyebrow')).toContainText('Boolean Practice');
  await expect(page.locator('[data-testid="shell-status"]')).toBeVisible();
  await expect(page.locator('[data-testid="problem-details"]')).toBeVisible();

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

  await expect(page.locator('.workspace-bar .eyebrow')).toContainText('Boolean Practice');
  await expect(page.locator('[data-testid="truth-table-practice"]')).toBeVisible();
  await expect(page.getByTestId('truth-table-check-step')).toBeInViewport();

  const shell = page.locator('.shell');
  const overflow = await shell.evaluate((element) => element.scrollWidth - element.clientWidth);

  expect(overflow).toBeLessThanOrEqual(1);
});

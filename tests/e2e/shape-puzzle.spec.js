import { test, expect } from '@playwright/test';

test.describe('Shape Puzzle Page (Plan 39 / P3)', () => {
  test('loads puzzle.html and renders the puzzle workspace', async ({ page }) => {
    await page.goto('/puzzle.html');

    await expect(page.locator('[data-testid="shape-puzzle-page"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Shape Logic Puzzles');
    await expect(page.locator('[data-testid="sheet-title"]')).toContainText('Mystery Picture 1');
    await expect(page.locator('[data-testid="expression-text"]')).toContainText('A AND NOT(B)');
    await expect(page.locator('[data-testid="shape-puzzle-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toBeVisible();
  });

  test('pictureName is completely absent from the DOM before puzzle is solved', async ({ page }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');

    const bodyHtml = await page.content();
    expect(bodyHtml).not.toContain('Sun Rising Over Horizon');
    expect(bodyHtml).not.toContain('Faceted Gem in Ring Setting');
    expect(bodyHtml).not.toContain('Cozy Cabin with Hearth and Yard');
    expect(bodyHtml).not.toContain('Rocket Ship in Flight');
    expect(bodyHtml).not.toContain('Crescent Moon');
    expect(bodyHtml).not.toContain('Fortress Tower');

    const title = await page.title();
    expect(title).not.toContain('Sun');
    expect(title).not.toContain('Cabin');
  });

  test('no answer controls or solve key on student view, but teacher view unlocks at ?teacher=1', async ({
    page,
  }) => {
    // 1. Student view
    await page.goto('/puzzle.html');
    await expect(page.locator('[data-testid="teacher-badge"]')).toHaveCount(0);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Teacher Key');
    expect(bodyText).not.toContain('Solve');
    expect(bodyText).not.toContain('Answer Key');

    // 2. Teacher view
    await page.goto('/puzzle.html?set=shapes-1&sheet=1&teacher=1');
    await expect(page.locator('[data-testid="teacher-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="solved-picture-name"]')).toContainText(
      'Sun Rising Over Horizon',
    );
    // Solved check state: output cells are prefilled
    await expect(page.locator('[data-testid="output-cell-2"]')).toContainText('T');
  });

  test('no bulk-fill controls exist without teacher=1', async ({ page }) => {
    await page.goto('/puzzle.html');
    await expect(page.locator('[data-testid="table-fill-true"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="table-fill-false"]')).toHaveCount(0);

    // But in teacher view, they exist:
    await page.goto('/puzzle.html?teacher=1');
    await expect(page.locator('[data-testid="table-fill-true"]')).toBeVisible();
    await expect(page.locator('[data-testid="table-fill-false"]')).toBeVisible();
  });

  test('after a wrong truth-table check, no row carries a correct or error class', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');

    // Enter incorrect value for row 0 (enter T instead of F)
    await page.locator('[data-testid="output-cell-0"]').click(); // T
    await page.locator('[data-testid="output-cell-1"]').click();
    await page.locator('[data-testid="output-cell-1"]').click(); // F
    await page.locator('[data-testid="output-cell-2"]').click(); // T
    await page.locator('[data-testid="output-cell-3"]').click();
    await page.locator('[data-testid="output-cell-3"]').click(); // F

    // Snapshot how every row and output cell looks before the check, so the test
    // catches any per-row reveal (not only the old class names).
    // Hover/focus and CSS transitions also change row styles, so neutralize them first.
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
    const rowLooks = async () => {
      await page.mouse.move(0, 0);
      await page.evaluate(() => document.activeElement?.blur());
      return page.locator('.table-row').evaluateAll((rows) =>
        rows.map((row) => {
          row.classList.remove('is-row-hovered', 'is-row-focused');
          const rowStyle = getComputedStyle(row);
          const cell = row.querySelector('.cell-output-btn');
          const cellStyle = cell ? getComputedStyle(cell) : null;
          return [
            row.className,
            rowStyle.backgroundColor,
            rowStyle.color,
            cell?.className,
            cellStyle?.backgroundColor,
            cellStyle?.borderColor,
            cellStyle?.color,
          ].join('|');
        }),
      );
    };
    const before = await rowLooks();

    // Check outputs
    await page.locator('[data-testid="btn-check-table"]').click();

    // Verify staged feedback message appears, without the AP "current row" wording
    const feedback = page.locator('[data-testid="puzzle-feedback"]');
    await expect(feedback).toContainText('do not match yet');
    await expect(feedback).not.toContainText('current row');

    // Rows look exactly as they did before the failed check
    expect(await rowLooks()).toEqual(before);

    // Assert that NO row carries correct or error class
    await expect(page.locator('.table-row.is-row-correct')).toHaveCount(0);
    await expect(page.locator('.table-row.is-row-error')).toHaveCount(0);
    await expect(page.locator('.mobile-row-tab.is-correct')).toHaveCount(0);
  });

  test('after a wrong shading check, no region carries a missed or extra class', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');

    // Solve truth table first (F, F, T, F)
    await page.locator('[data-testid="output-cell-0"]').click();
    await page.locator('[data-testid="output-cell-0"]').click();
    await page.locator('[data-testid="output-cell-1"]').click();
    await page.locator('[data-testid="output-cell-1"]').click();
    await page.locator('[data-testid="output-cell-2"]').click();
    await page.locator('[data-testid="output-cell-3"]').click();
    await page.locator('[data-testid="output-cell-3"]').click();
    await page.locator('[data-testid="btn-check-table"]').click();
    await expect(page.locator('[data-testid="btn-check-shading"]')).toBeEnabled();

    // Intentionally shade WRONG region (region 0 instead of region 2)
    await page.locator('[data-testid="region-0"]').dispatchEvent('click');

    // Check shading
    await page.locator('[data-testid="btn-check-shading"]').click();

    // Feedback message guides student
    await expect(page.locator('[data-testid="puzzle-feedback"]')).toContainText(
      'do not match yet',
    );

    // NO region carries missed or extra class!
    await expect(page.locator('.is-checked-missed')).toHaveCount(0);
    await expect(page.locator('.is-checked-extra')).toHaveCount(0);
  });

  test('all 8 rows and check button are visible at 1366x768 with no inner scroll in truth table card', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/puzzle.html?set=shapes-1&sheet=3');

    // Inner scroll check: .table-scroll-wrap has no vertical scrollbar
    const isScrollable = await page
      .locator('.table-scroll-wrap')
      .evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(isScrollable).toBe(false);

    // Last row (row 8) is fully in viewport
    const row8 = page.locator('[data-testid="output-cell-7"]');
    await expect(row8).toBeInViewport();
    const row8Box = await row8.boundingBox();
    expect(row8Box.y + row8Box.height).toBeLessThanOrEqual(768);

    // Check button is fully in viewport
    const checkBtn = page.locator('[data-testid="btn-check-table"]');
    await expect(checkBtn).toBeInViewport();
    const btnBox = await checkBtn.boundingBox();
    expect(btnBox.y + btnBox.height).toBeLessThanOrEqual(768);
  });

  test('toggles expression notation between Words and Java symbols', async ({ page }) => {
    await page.goto('/puzzle.html');

    const expr = page.locator('[data-testid="expression-text"]');
    await expect(expr).toHaveText('A AND NOT(B)');

    const toggle = page.locator('[data-testid="notation-toggle"]');
    await toggle.click();
    await expect(expr).toHaveText('A && !B');

    await toggle.click();
    await expect(expr).toHaveText('A AND NOT(B)');
  });

  test('solves sheet 1 by keyboard only', async ({ page }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');

    // Truth table rows for a && !b:
    // Row 1 (0,0) -> F (cycle: blank -> T -> F: 2 spaces)
    // Row 2 (0,1) -> F (cycle: 2 spaces)
    // Row 3 (1,0) -> T (cycle: 1 space)
    // Row 4 (1,1) -> F (cycle: 2 spaces)

    const cell0 = page.locator('[data-testid="output-cell-0"]');
    await cell0.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await expect(cell0).toHaveText('F');

    const cell1 = page.locator('[data-testid="output-cell-1"]');
    await cell1.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await expect(cell1).toHaveText('F');

    const cell2 = page.locator('[data-testid="output-cell-2"]');
    await cell2.focus();
    await page.keyboard.press('Space');
    await expect(cell2).toHaveText('T');

    const cell3 = page.locator('[data-testid="output-cell-3"]');
    await cell3.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await expect(cell3).toHaveText('F');

    // Check outputs button via keyboard
    const checkTableBtn = page.locator('[data-testid="btn-check-table"]');
    await checkTableBtn.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-testid="puzzle-feedback"]')).toContainText(
      'Truth table outputs verified',
    );

    // Now shade region 2 (corresponding to row 3: 1,0, intendedTrueRow 2) via keyboard
    const region2 = page.locator('[data-testid="region-2"]');
    await region2.focus();
    await page.keyboard.press('Space');
    await expect(region2).toHaveClass(/is-shaded/);

    // Check shading via keyboard
    const checkShadingBtn = page.locator('[data-testid="btn-check-shading"]');
    await checkShadingBtn.focus();
    await page.keyboard.press('Enter');

    // Solved!
    await expect(page.locator('[data-testid="puzzle-feedback"]')).toHaveClass(/is-solved/);
    await expect(page.locator('[data-testid="solved-picture-name"]')).toContainText(
      'Sun Rising Over Horizon',
    );
  });

  test('preserves shape outline and outside label distinguishability in greyscale', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=3'); // Cabin (3 shapes)

    // Verify distinct dash arrays for all 3 shapes
    const outlineA = page.locator('.shape-boundary-path').nth(0);
    const outlineB = page.locator('.shape-boundary-path').nth(1);
    const outlineC = page.locator('.shape-boundary-path').nth(2);

    await expect(outlineA).toHaveAttribute('stroke-dasharray', 'none');
    await expect(outlineB).toHaveAttribute('stroke-dasharray', '5 2.5');
    await expect(outlineC).toHaveAttribute('stroke-dasharray', '5 2 2 2');

    // Outside label boxes with swatch lines
    const labelBoxes = page.locator('.shape-label-item');
    await expect(labelBoxes).toHaveCount(3);
  });

  test('fits 1366x768 and 1280x720 without vertical scroll in default state', async ({ page }) => {
    // 1366 x 768 Chromebook viewport
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/puzzle.html');

    const scrollHeight768 = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight768 = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight768).toBeLessThanOrEqual(clientHeight768 + 10); // fits without scrolling

    // 1280 x 720 Projector viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/puzzle.html');
    await expect(page.locator('[data-testid="shape-puzzle-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toBeVisible();
  });

  test('stacks cleanly on mobile 390x844 without horizontal scroll and activates inspector', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/puzzle.html');

    // Mobile inspector is visible, desktop table hidden
    await expect(page.locator('.mobile-inspector-container')).toBeVisible();
    await expect(page.locator('.desktop-table-container')).not.toBeVisible();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Mobile row tabs switch inspect card
    await page.locator('[data-testid="mobile-tab-row-2"]').click();
    await expect(page.locator('.card-row-num')).toHaveText('Row 2');
  });
});

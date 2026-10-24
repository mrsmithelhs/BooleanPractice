import { test, expect } from '@playwright/test';

test.describe('Shape Puzzle Page (Plan 39 / P3)', () => {
  test('loads puzzle.html and renders the puzzle workspace in default table mode', async ({
    page,
  }) => {
    await page.goto('/puzzle.html');

    await expect(page.locator('[data-testid="shape-puzzle-page"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Shape Logic Puzzles');
    await expect(page.locator('[data-testid="sheet-title"]')).toContainText('Mystery Picture 1');
    await expect(page.locator('[data-testid="expression-text"]')).toContainText('A AND NOT(B)');
    await expect(page.locator('[data-testid="shape-puzzle-canvas"]')).toBeVisible();
    // Default sheet 1 is table mode: truth table is visible
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toBeVisible();
  });

  test('pictureName is completely absent from the DOM before puzzle is solved in both modes', async ({
    page,
  }) => {
    // Mode 1: Table mode (Sheet 1)
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    let bodyHtml = await page.content();
    expect(bodyHtml).not.toContain('Sun Rising Over Horizon');
    expect(bodyHtml).not.toContain('Faceted Gem in Ring Setting');
    expect(bodyHtml).not.toContain('Cozy Cabin with Hearth and Yard');
    expect(bodyHtml).not.toContain('Rocket Ship in Flight');

    // Mode 2: Shade mode (Sheet 2)
    await page.goto('/puzzle.html?set=shapes-1&sheet=2');
    bodyHtml = await page.content();
    expect(bodyHtml).not.toContain('Faceted Gem in Ring Setting');
    expect(bodyHtml).not.toContain('Sun Rising Over Horizon');
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
    const badge = page.locator('[data-testid="teacher-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Teacher Key');
    await expect(badge).toContainText('Mode: table');
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

  test('table mode: regions are not focusable and toggle nothing on click or Space', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');

    const region0 = page.locator('[data-testid="region-0"]');
    // Regions are not interactive controls in table mode
    await expect(region0).toHaveAttribute('tabindex', '-1');
    await expect(region0).not.toHaveAttribute('role', 'button');

    // Clicking does not shade region
    await region0.dispatchEvent('click');
    await expect(region0).not.toHaveClass(/is-shaded/);

    // No check or clear shading buttons exist in table mode
    await expect(page.locator('[data-testid="btn-check-shading"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="btn-clear-shading"]')).toHaveCount(0);
  });

  test('table mode: after wrong check, computed styles remain neutral (no reveal)', async ({
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

    // Snapshot computed styles before check
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

    // Verify staged feedback message appears, without AP "current row" wording
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

  test('shade mode: after wrong check, computed styles of regions remain unchanged (no reveal)', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=2'); // Gem: shade mode default

    // Before success, no table element in DOM
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toHaveCount(0);

    // Shading is enabled from the start
    await expect(page.locator('[data-testid="btn-check-shading"]')).toBeEnabled();

    // Deliberately shade wrong region (region 0 instead of intended region 3)
    await page.locator('[data-testid="region-0"]').dispatchEvent('click');

    // Snapshot computed styles of all region paths before checking
    const regionLooks = async () => {
      await page.mouse.move(0, 0);
      return page.locator('.region-path').evaluateAll((paths) =>
        paths.map((p) => {
          const style = getComputedStyle(p);
          return [p.parentElement?.className, style.stroke, style.strokeWidth, style.fill].join(
            '|',
          );
        }),
      );
    };

    const before = await regionLooks();

    // Check shading
    await page.locator('[data-testid="btn-check-shading"]').click();

    // Feedback message guides student with shade-only hint (no mention of table or row)
    const feedback = page.locator('[data-testid="puzzle-feedback"]');
    await expect(feedback).toContainText('do not match yet');
    await expect(feedback).not.toContainText('table');
    await expect(feedback).not.toContainText('row');

    // Regions retain identical stroke/fill styles (no amber or red error outlines)
    expect(await regionLooks()).toEqual(before);
    await expect(page.locator('.is-checked-missed')).toHaveCount(0);
    await expect(page.locator('.is-checked-extra')).toHaveCount(0);
  });

  test('solves sheet 1 (table mode) by keyboard only and auto-shades true regions', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');

    // Truth table rows for a && !b:
    // Row 1 (0,0) -> F (2 spaces)
    // Row 2 (0,1) -> F (2 spaces)
    // Row 3 (1,0) -> T (1 space)
    // Row 4 (1,1) -> F (2 spaces)

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

    // In Table mode, correct check auto-shades the TRUE regions and solves the puzzle!
    await expect(page.locator('[data-testid="puzzle-feedback"]')).toHaveClass(/is-solved/);
    await expect(page.locator('[data-testid="solved-picture-name"]')).toContainText(
      'Sun Rising Over Horizon',
    );

    // True region (region 2, corresponding to intendedTrueRows [2]) is shaded with solved emerald fill
    const region2 = page.locator('[data-testid="region-2"]');
    await expect(region2).toHaveClass(/is-correct/);
    const fill = await page.locator('[data-testid="region-2"] path').getAttribute('fill');
    expect(fill).toBe('#059669');
  });

  test('solves sheet 2 (shade mode) by keyboard only and reveals filled truth table', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=2'); // Gem: a && b, intendedTrueRows [3]

    // Before success, no table element in DOM
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toHaveCount(0);

    // Shade region 3 via keyboard
    const region3 = page.locator('[data-testid="region-3"]');
    await region3.focus();
    await page.keyboard.press('Space');
    await expect(region3).toHaveClass(/is-shaded/);

    // Check shading via keyboard
    const checkShadingBtn = page.locator('[data-testid="btn-check-shading"]');
    await checkShadingBtn.focus();
    await page.keyboard.press('Enter');

    // Solved!
    await expect(page.locator('[data-testid="puzzle-feedback"]')).toHaveClass(/is-solved/);
    await expect(page.locator('[data-testid="solved-picture-name"]')).toContainText(
      'Faceted Gem in Ring Setting',
    );

    // After success, truth table appears in DOM with correct verified outputs filled in
    const table = page.locator('[data-testid="shape-puzzle-table"]');
    await expect(table).toBeVisible();
    await expect(page.locator('[data-testid="output-cell-0"]')).toHaveText('F');
    await expect(page.locator('[data-testid="output-cell-1"]')).toHaveText('F');
    await expect(page.locator('[data-testid="output-cell-2"]')).toHaveText('F');
    await expect(page.locator('[data-testid="output-cell-3"]')).toHaveText('T');
    await expect(page.locator('[data-testid="table-verified-badge"]')).toBeVisible();
  });

  test('URL overrides: &mode=shade, &mode=table, and &mode=bogus fallback', async ({ page }) => {
    // 1. Force sheet 1 into shade mode
    await page.goto('/puzzle.html?set=shapes-1&sheet=1&mode=shade');
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="btn-check-shading"]')).toBeVisible();

    // 2. Force sheet 2 into table mode
    await page.goto('/puzzle.html?set=shapes-1&sheet=2&mode=table');
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-check-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-check-shading"]')).toHaveCount(0);

    // 3. Bogus mode falls back to default mode with a warning message
    await page.goto('/puzzle.html?set=shapes-1&sheet=1&mode=bogus');
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toBeVisible(); // default table mode
    const warning = page.locator('[data-testid="mode-fallback-message"]');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Unknown mode "bogus"');
  });

  test('all 8 rows and check button are visible at 1366x768 with no inner scroll in truth table card', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/puzzle.html?set=shapes-1&sheet=3'); // Cabin: table mode default

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

  test('fits 1366x768 and 1280x720 without vertical scroll in both modes', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    // Mode 1: Table mode (Sheet 1)
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    let scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    let clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 10);

    // Mode 2: Shade mode (Sheet 2)
    await page.goto('/puzzle.html?set=shapes-1&sheet=2');
    scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 10);

    // 1280 x 720 Projector viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    await expect(page.locator('[data-testid="shape-puzzle-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toBeVisible();
  });

  test('stacks cleanly on mobile 390x844 without horizontal scroll in both modes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Mode 1: Table mode (Sheet 1)
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    await expect(page.locator('.mobile-inspector-container')).toBeVisible();
    await expect(page.locator('.desktop-table-container')).not.toBeVisible();
    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Mobile row tabs switch inspect card
    await page.locator('[data-testid="mobile-tab-row-2"]').click();
    await expect(page.locator('.card-row-num')).toHaveText('Row 2');

    // Mode 2: Shade mode (Sheet 2)
    await page.goto('/puzzle.html?set=shapes-1&sheet=2');
    await expect(page.locator('[data-testid="shape-puzzle-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toHaveCount(0);
    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

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

  test('reveal overlay layer does NOT exist in DOM before solve, and appears after solve or in teacher mode', async ({
    page,
  }) => {
    // 1. Before solve in Table mode: no reveal overlay layer in DOM
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    await expect(page.locator('[data-testid="reveal-overlay-layer"]')).toHaveCount(0);

    // Incorrect check does NOT reveal overlay
    await page.locator('[data-testid="output-cell-0"]').click(); // T (wrong)
    await page.locator('[data-testid="btn-check-table"]').click();
    await expect(page.locator('[data-testid="reveal-overlay-layer"]')).toHaveCount(0);

    // Solve correctly:
    await page.locator('[data-testid="output-cell-0"]').click(); // F
    await page.locator('[data-testid="output-cell-1"]').click();
    await page.locator('[data-testid="output-cell-1"]').click(); // F
    await page.locator('[data-testid="output-cell-2"]').click(); // T
    await page.locator('[data-testid="output-cell-3"]').click();
    await page.locator('[data-testid="output-cell-3"]').click(); // F
    await page.locator('[data-testid="btn-check-table"]').click();

    // Now reveal overlay layer is present and has rendered primitives
    await expect(page.locator('[data-testid="reveal-overlay-layer"]')).toBeVisible();
    const primitives = page.locator('.overlay-prim');
    expect(await primitives.count()).toBeGreaterThan(0);

    // 2. Before solve in Shade mode: no overlay layer in DOM
    await page.goto('/puzzle.html?set=shapes-1&sheet=2');
    await expect(page.locator('[data-testid="reveal-overlay-layer"]')).toHaveCount(0);

    // Solve correctly (Gem is region 3):
    await page.locator('[data-testid="region-3"]').dispatchEvent('click');
    await page.locator('[data-testid="btn-check-shading"]').click();
    await expect(page.locator('[data-testid="reveal-overlay-layer"]')).toBeVisible();

    // 3. Teacher key immediately reveals overlay layer
    await page.goto('/puzzle.html?set=shapes-1&sheet=1&teacher=1');
    await expect(page.locator('[data-testid="reveal-overlay-layer"]')).toBeVisible();
  });

  test('frame boundary maintains 4 visible edges before and after solve without bounding box change', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    const svg = page.locator('.shape-puzzle-svg');
    const frame = page.locator('[data-testid="frame-boundary"]');
    await expect(frame).toBeVisible();

    const svgBoxBefore = await svg.boundingBox();
    const boxBefore = await frame.boundingBox();
    expect(boxBefore).not.toBeNull();
    expect(boxBefore.width).toBeGreaterThan(50);
    expect(boxBefore.height).toBeGreaterThan(50);

    const relXBefore = boxBefore.x - svgBoxBefore.x;
    const relYBefore = boxBefore.y - svgBoxBefore.y;

    // Solve puzzle
    await page.locator('[data-testid="output-cell-0"]').click();
    await page.locator('[data-testid="output-cell-0"]').click(); // F
    await page.locator('[data-testid="output-cell-1"]').click();
    await page.locator('[data-testid="output-cell-1"]').click(); // F
    await page.locator('[data-testid="output-cell-2"]').click(); // T
    await page.locator('[data-testid="output-cell-3"]').click();
    await page.locator('[data-testid="output-cell-3"]').click(); // F
    await page.locator('[data-testid="btn-check-table"]').click();

    await expect(page.locator('[data-testid="puzzle-feedback"]')).toHaveClass(/is-solved/);
    const svgBoxAfter = await svg.boundingBox();
    const boxAfter = await frame.boundingBox();
    expect(boxAfter).not.toBeNull();

    const relXAfter = boxAfter.x - svgBoxAfter.x;
    const relYAfter = boxAfter.y - svgBoxAfter.y;

    // Verify relative position and dimensions match within 0.5px
    expect(Math.abs(relXAfter - relXBefore)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(relYAfter - relYBefore)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(boxAfter.width - boxBefore.width)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(boxAfter.height - boxBefore.height)).toBeLessThanOrEqual(0.5);
  });

  test('solved truth table uses neutral slate styling for correct F, subtle green for T, never red', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');

    // Solve
    await page.locator('[data-testid="output-cell-0"]').click();
    await page.locator('[data-testid="output-cell-0"]').click(); // F
    await page.locator('[data-testid="output-cell-1"]').click();
    await page.locator('[data-testid="output-cell-1"]').click(); // F
    await page.locator('[data-testid="output-cell-2"]').click(); // T
    await page.locator('[data-testid="output-cell-3"]').click();
    await page.locator('[data-testid="output-cell-3"]').click(); // F
    await page.locator('[data-testid="btn-check-table"]').click();

    // Table rows are marked correct
    const row0 = page.locator('.table-row').nth(0);
    await expect(row0).toHaveClass(/is-row-correct/);

    // Cell 0 is correct F -> neutral slate styling: rgb(248, 250, 252)
    const cell0 = page.locator('[data-testid="output-cell-0"]');
    await expect(cell0).toHaveClass(/val-false/);
    const cell0Bg = await cell0.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(cell0Bg).toBe('rgb(248, 250, 252)');

    // Cell 2 is correct T -> subtle green styling: #ecfdf5
    const cell2 = page.locator('[data-testid="output-cell-2"]');
    await expect(cell2).toHaveClass(/val-true/);
    const cell2Bg = await cell2.evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r2, g2, b2] = cell2Bg.match(/\d+/g).map(Number);
    expect(r2).toBeGreaterThanOrEqual(235);
    expect(g2).toBeGreaterThanOrEqual(250);
    expect(b2).toBeGreaterThanOrEqual(240);

    // Ensure no cell in the solved table has red background or red text
    const styles = await page.locator('.cell-output-btn').evaluateAll((cells) =>
      cells.map((c) => {
        const s = getComputedStyle(c);
        return { bg: s.backgroundColor, color: s.color };
      }),
    );
    for (const style of styles) {
      expect(style.bg).not.toContain('254, 226, 226'); // #fee2e2
      expect(style.color).not.toContain('185, 28, 28'); // #b91c1c
      expect(style.color).not.toContain('220, 38, 38'); // #dc2626
    }
  });

  test('prefers-reduced-motion disables animations on reveal overlay elements', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/puzzle.html?set=shapes-1&sheet=1&teacher=1');

    const overlayLayer = page.locator('[data-testid="reveal-overlay-layer"]');
    await expect(overlayLayer).toBeVisible();

    const animation = await page
      .locator('.overlay-prim')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe('none');
  });

  test('shapes-2 set is navigable and extension sheets display Challenge chip', async ({
    page,
  }) => {
    // Slot 1 (Wrench) - Core, 2 shapes, table mode
    await page.goto('/puzzle.html?set=shapes-2&sheet=1');
    await expect(page.locator('[data-testid="sheet-title"]')).toContainText('Mystery Picture 1');
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-chip"]')).toHaveCount(0);

    // Slot 2 (Biplane) - Core, 3 shapes, shade mode
    await page.goto('/puzzle.html?set=shapes-2&sheet=2');
    await expect(page.locator('[data-testid="sheet-title"]')).toContainText('Mystery Picture 2');
    await expect(page.locator('[data-testid="shape-puzzle-table"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="btn-check-shading"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-chip"]')).toHaveCount(0);

    // Slot 5 (Satellite) - Extension, table mode -> Challenge chip visible
    await page.goto('/puzzle.html?set=shapes-2&sheet=5');
    await expect(page.locator('[data-testid="sheet-title"]')).toContainText('Challenge Picture 5');
    await expect(page.locator('[data-testid="challenge-chip"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-chip"]')).toContainText('Challenge');

    // Slot 6 (Falcon) - Extension, shade mode -> Challenge chip visible
    await page.goto('/puzzle.html?set=shapes-2&sheet=6');
    await expect(page.locator('[data-testid="sheet-title"]')).toContainText('Challenge Picture 6');
    await expect(page.locator('[data-testid="challenge-chip"]')).toBeVisible();
  });

  test('highlights shape borders on letter outline badge hover and pins on click in shade mode', async ({
    page,
  }) => {
    // Mystery Picture 2 (Cactus, visual-first shade mode)
    await page.goto('/puzzle.html?set=shapes-2&sheet=2');

    // 1. Initially no highlight layer exists
    const highlightLayer = page.locator('[data-testid="shape-highlight-layer"]');
    await expect(highlightLayer).toHaveCount(0);

    const labelA = page.locator('[data-testid="shape-label-a"]');
    const labelB = page.locator('[data-testid="shape-label-b"]');
    const labelC = page.locator('[data-testid="shape-label-c"]');
    await expect(labelA).toBeVisible();
    await expect(labelB).toBeVisible();
    await expect(labelC).toBeVisible();

    // 2. Hover over letter outline badge A
    await labelA.hover();

    // Highlight layer appears with Shape A's outline
    await expect(highlightLayer).toHaveCount(1);
    const outlineA = page.locator('[data-testid="highlighted-outline-a"]');
    await expect(outlineA).toBeVisible();
    await expect(outlineA).toHaveAttribute('stroke', '#2563eb');
    await expect(outlineA).toHaveAttribute('stroke-dasharray', 'none');
    await expect(page.locator('.shape-highlight-halo')).toBeVisible();

    // Badge A has highlighted state; B and C are dimmed
    await expect(labelA).toHaveClass(/is-highlighted/);
    await expect(labelB).toHaveClass(/is-dimmed/);
    await expect(labelC).toHaveClass(/is-dimmed/);

    // 3. Move mouse away to header
    await page.locator('.canvas-title').hover();
    await expect(highlightLayer).toHaveCount(0);
    await expect(labelA).not.toHaveClass(/is-highlighted/);
    await expect(labelB).not.toHaveClass(/is-dimmed/);

    // 4. Hover over letter outline badge B (dashed crimson)
    await labelB.hover();
    await expect(highlightLayer).toHaveCount(1);
    const outlineB = page.locator('[data-testid="highlighted-outline-b"]');
    await expect(outlineB).toBeVisible();
    await expect(outlineB).toHaveAttribute('stroke', '#dc2626');
    await expect(outlineB).toHaveAttribute('stroke-dasharray', '5 2.5');

    // 5. Hover over letter outline badge C (dash-dot emerald)
    await labelC.hover();
    await expect(highlightLayer).toHaveCount(1);
    const outlineC = page.locator('[data-testid="highlighted-outline-c"]');
    await expect(outlineC).toBeVisible();
    await expect(outlineC).toHaveAttribute('stroke', '#059669');
    await expect(outlineC).toHaveAttribute('stroke-dasharray', '5 2 2 2');

    // 6. Click badge A to pin highlight
    await labelA.click();
    await page.locator('.canvas-title').hover();
    // Highlight remains pinned even after mouse leaves!
    await expect(highlightLayer).toHaveCount(1);
    await expect(page.locator('[data-testid="highlighted-outline-a"]')).toBeVisible();

    // 7. Click badge A again to unpin
    await labelA.click();
    await expect(highlightLayer).toHaveCount(0);

    // 8. Keyboard accessibility: Focus badge A and press Enter to toggle on
    await labelA.focus();
    await labelA.press('Enter');
    await expect(highlightLayer).toHaveCount(1);
    await expect(page.locator('[data-testid="highlighted-outline-a"]')).toBeVisible();

    // Press Space on badge A to toggle off
    await labelA.press('Space');
    await expect(highlightLayer).toHaveCount(0);
  });

  test('highlights shape borders when hovering table column headers in table mode', async ({
    page,
  }) => {
    // Mystery Picture 1 (Cat, table mode)
    await page.goto('/puzzle.html?set=shapes-2&sheet=1');

    const highlightLayer = page.locator('[data-testid="shape-highlight-layer"]');
    await expect(highlightLayer).toHaveCount(0);

    // Hover over column header A in truth table
    const thA = page.locator('[data-testid="th-var-a"]');
    await thA.hover();
    await expect(highlightLayer).toHaveCount(1);
    await expect(page.locator('[data-testid="highlighted-outline-a"]')).toBeVisible();

    // Hover away
    await page.locator('.canvas-title').hover();
    await expect(highlightLayer).toHaveCount(0);
  });
});

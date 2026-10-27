import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  canonicalJsonStringify,
  sha256Hex,
  verifyIntegrity,
} from '../../src/usage/format.js';

test.describe('Student Usage Export & Local Teacher Admin (Plan 41)', () => {
  test.beforeEach(async ({ context }) => {
    // Clear storage between tests
    await context.clearCookies();
  });

  test('solving a sheet records outputs_checked and sheet_solved', async ({ page }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    await expect(page.locator('[data-testid="shape-puzzle-page"]')).toBeVisible();

    // Truth table for a && !b:
    // Row 0 (0,0) -> F (2 spaces)
    // Row 1 (0,1) -> F (2 spaces)
    // Row 2 (1,0) -> T (1 space)
    // Row 3 (1,1) -> F (2 spaces)
    const cell0 = page.locator('[data-testid="output-cell-0"]');
    await cell0.click();
    await cell0.click();

    const cell1 = page.locator('[data-testid="output-cell-1"]');
    await cell1.click();
    await cell1.click();

    const cell2 = page.locator('[data-testid="output-cell-2"]');
    await cell2.click();

    const cell3 = page.locator('[data-testid="output-cell-3"]');
    await cell3.click();
    await cell3.click();

    // Click Check Outputs
    await page.locator('[data-testid="btn-check-table"]').click();
    await expect(page.locator('[data-testid="solved-picture-name"]')).toBeVisible();

    // Inspect recorded localStorage events
    const rawUsage = await page.evaluate(() => localStorage.getItem('bp-usage-v1'));
    expect(rawUsage).not.toBeNull();
    const state = JSON.parse(rawUsage);

    const checkEvent = state.events.find((e) => e.type === 'outputs_checked');
    expect(checkEvent).toBeDefined();
    expect(checkEvent.data.correct).toBe(true);
    expect(checkEvent.data.set).toBe('shapes-1');
    expect(checkEvent.data.sheet).toBe(1);

    const solveEvent = state.events.find((e) => e.type === 'sheet_solved');
    expect(solveEvent).toBeDefined();
    expect(solveEvent.data.mode).toBe('table');
    expect(solveEvent.data.attempts).toBe(1);
  });

  test('?teacher=1 records only teacher_view_opened, has no check/solve events and no export button', async ({
    page,
  }) => {
    await page.goto('/puzzle.html?set=shapes-1&sheet=1&teacher=1');
    await expect(page.locator('[data-testid="teacher-badge"]')).toBeVisible();

    // Export button must NOT exist on teacher view
    await expect(page.locator('[data-testid="download-progress-btn"]')).toHaveCount(0);

    const rawUsage = await page.evaluate(() => localStorage.getItem('bp-usage-v1'));
    expect(rawUsage).not.toBeNull();
    const state = JSON.parse(rawUsage);

    // Exactly one teacher_view_opened event
    const teacherEvents = state.events.filter((e) => e.type === 'teacher_view_opened');
    expect(teacherEvents).toHaveLength(1);
    expect(teacherEvents[0].data).toEqual({ set: 'shapes-1', sheet: 1 });

    // No check or solve events
    const checkOrSolve = state.events.filter((e) =>
      ['outputs_checked', 'shading_checked', 'sheet_solved'].includes(e.type),
    );
    expect(checkOrSolve).toHaveLength(0);
  });

  test('open ?teacher=1, then switch to student mode, solve, export; file contains event and admin flags it', async ({
    page,
  }) => {
    // 1. Open teacher view on sheet 1
    await page.goto('/puzzle.html?set=shapes-1&sheet=1&teacher=1');
    await expect(page.locator('[data-testid="teacher-badge"]')).toBeVisible();

    // 2. Switch to student mode in the same browser
    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    await expect(page.locator('[data-testid="teacher-badge"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="download-progress-btn"]')).toBeVisible();

    // 3. Solve sheet 1
    const cell0 = page.locator('[data-testid="output-cell-0"]');
    await cell0.click();
    await cell0.click();

    const cell1 = page.locator('[data-testid="output-cell-1"]');
    await cell1.click();
    await cell1.click();

    const cell2 = page.locator('[data-testid="output-cell-2"]');
    await cell2.click();

    const cell3 = page.locator('[data-testid="output-cell-3"]');
    await cell3.click();
    await cell3.click();

    await page.locator('[data-testid="btn-check-table"]').click();
    await expect(page.locator('[data-testid="solved-picture-name"]')).toBeVisible();

    // 4. Open export dialog and download file
    await page.locator('[data-testid="download-progress-btn"]').click();
    await expect(page.locator('[data-testid="student-name-input"]')).toBeVisible();

    await page.locator('[data-testid="student-name-input"]').fill('Rowan Taylor');
    await page.locator('[data-testid="class-code-input"]').fill('PERIOD-1');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="confirm-download-btn"]').click();
    const download = await downloadPromise;

    // Read downloaded content
    const downloadPath = await download.path();
    const fileText = readFileSync(downloadPath, 'utf8');
    const downloadedPayload = JSON.parse(fileText);

    // Verify format module integrity
    const verification = await verifyIntegrity(downloadedPayload);
    expect(verification.ok).toBe(true);

    // Assert teacher_view_opened event is present
    const hasTeacherViewEvent = downloadedPayload.events.some(
      (e) => e.type === 'teacher_view_opened',
    );
    expect(hasTeacherViewEvent).toBe(true);

    // 5. Navigate to admin.html and load the downloaded file
    await page.goto('/admin.html');
    await expect(page.locator('[data-testid="honest-limit-banner"]')).toBeVisible();

    // Upload via file input
    const fileInput = page.locator('[data-testid="admin-file-input"]');
    await fileInput.setInputFiles(downloadPath);

    // Check table row for Rowan Taylor
    await expect(page.locator('[data-testid="admin-class-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="student-name-btn"]')).toContainText('Rowan Taylor');

    // Confirm that admin flags teacher view opened
    const flagsCell = page.locator('[data-testid="student-flags"]');
    await expect(flagsCell).toContainText('Teacher view opened');
  });

  test('admin.html loads two fixture files and shows both students and expected flags', async ({
    page,
  }) => {
    await page.goto('/admin.html');
    await expect(page.locator('h1')).toContainText('Student Usage Review');

    const fixtureClean = resolve('tests/fixtures/usage/clean-student-a.json');
    const fixtureTampered = resolve('tests/fixtures/usage/flag-integrity-mismatch.json');

    const fileInput = page.locator('[data-testid="admin-file-input"]');
    await fileInput.setInputFiles([fixtureClean, fixtureTampered]);

    // Table should show 2 students
    const rows = page.locator('[data-testid="student-row"]');
    await expect(rows).toHaveCount(2);

    // Alex Carter should be clean
    const rowAlex = rows.filter({ hasText: 'Alex Carter' });
    await expect(rowAlex.locator('[data-testid="student-flags"]')).toContainText('✓ Clean');

    // Casey Morgan should have integrity mismatch flag
    const rowCasey = rows.filter({ hasText: 'Casey Morgan' });
    await expect(rowCasey.locator('[data-testid="student-flags"]')).toContainText(
      'Integrity mismatch',
    );
  });

  test('puzzle works with storage blocked and export dialog explains storage limitation', async ({
    page,
  }) => {
    // Block localStorage before page loads
    await page.addInitScript(() => {
      const mockStorage = {
        getItem() {
          throw new Error('Blocked storage');
        },
        setItem() {
          throw new Error('Blocked storage');
        },
        removeItem() {
          throw new Error('Blocked storage');
        },
        clear() {
          throw new Error('Blocked storage');
        },
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        configurable: true,
      });
    });

    await page.goto('/puzzle.html?set=shapes-1&sheet=1');
    await expect(page.locator('[data-testid="shape-puzzle-page"]')).toBeVisible();

    // Puzzle still functions normally
    const cell0 = page.locator('[data-testid="output-cell-0"]');
    await cell0.click();
    await expect(cell0).toHaveText('T');
    await cell0.click();
    await expect(cell0).toHaveText('F');

    // Open export dialog
    await page.locator('[data-testid="download-progress-btn"]').click();
    await expect(page.locator('[data-testid="export-storage-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-storage-warning"]')).toContainText(
      'Browser storage is unavailable or blocked',
    );
  });

  test('two open tabs interleave checks and solves without reloads; both exports contain every event with unique consecutive seq and intact chain', async ({
    context,
  }) => {
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    await tab1.goto('/puzzle.html?set=shapes-1&sheet=1');
    await tab2.goto('/puzzle.html?set=shapes-1&sheet=2');

    await expect(tab1.locator('[data-testid="shape-puzzle-page"]')).toBeVisible();
    await expect(tab2.locator('[data-testid="shape-puzzle-page"]')).toBeVisible();

    // 1. Tab 1 does a wrong check on Sheet 1 (table mode)
    // Click cell 0 once -> 'T' (wrong since a&&!b is F for 0,0)
    await tab1.locator('[data-testid="output-cell-0"]').click();
    await tab1.locator('[data-testid="btn-check-table"]').click();

    // 2. Tab 2 does a wrong check on Sheet 2 (shade mode)
    // Shade region 1 (wrong for a && b)
    const reg1 = tab2.locator('[data-testid="region-1"]');
    await reg1.focus();
    await tab2.keyboard.press('Space');
    await tab2.locator('[data-testid="btn-check-shading"]').click();

    // 3. Tab 1 solves Sheet 1
    // Correct outputs for a && !b: F, F, T, F
    // Cell 0 was 'T', click once more -> 'F'
    await tab1.locator('[data-testid="output-cell-0"]').click();
    // Cell 1: click twice -> 'F'
    await tab1.locator('[data-testid="output-cell-1"]').click();
    await tab1.locator('[data-testid="output-cell-1"]').click();
    // Cell 2: click once -> 'T'
    await tab1.locator('[data-testid="output-cell-2"]').click();
    // Cell 3: click twice -> 'F'
    await tab1.locator('[data-testid="output-cell-3"]').click();
    await tab1.locator('[data-testid="output-cell-3"]').click();
    await tab1.locator('[data-testid="btn-check-table"]').click();
    await expect(tab1.locator('[data-testid="solved-picture-name"]')).toBeVisible();

    // 4. Tab 2 solves Sheet 2
    // Deselect region 1, shade region 3 (correct for a && b)
    await reg1.focus();
    await tab2.keyboard.press('Space');
    const reg3 = tab2.locator('[data-testid="region-3"]');
    await reg3.focus();
    await tab2.keyboard.press('Space');
    await tab2.locator('[data-testid="btn-check-shading"]').click();
    await expect(tab2.locator('[data-testid="solved-picture-name"]')).toBeVisible();

    // 5. Export from Tab 1
    await tab1.locator('[data-testid="download-progress-btn"]').click();
    await tab1.locator('[data-testid="student-name-input"]').fill('Tab One Student');
    const dlPromise1 = tab1.waitForEvent('download');
    await tab1.locator('[data-testid="confirm-download-btn"]').click();
    const dl1 = await dlPromise1;
    const content1 = JSON.parse(readFileSync(await dl1.path(), 'utf8'));

    // 6. Export from Tab 2
    await tab2.locator('[data-testid="download-progress-btn"]').click();
    await tab2.locator('[data-testid="student-name-input"]').fill('Tab Two Student');
    const dlPromise2 = tab2.waitForEvent('download');
    await tab2.locator('[data-testid="confirm-download-btn"]').click();
    const dl2 = await dlPromise2;
    const content2 = JSON.parse(readFileSync(await dl2.path(), 'utf8'));

    // Both exports contain every check and solve event from both tabs
    expect(content1.events.some((e) => e.type === 'shading_checked')).toBe(true);
    expect(content1.events.some((e) => e.type === 'outputs_checked')).toBe(true);
    expect(content1.events.some((e) => e.type === 'sheet_solved' && e.data?.sheet === 1)).toBe(true);
    expect(content1.events.some((e) => e.type === 'sheet_solved' && e.data?.sheet === 2)).toBe(true);

    expect(content2.events.some((e) => e.type === 'shading_checked')).toBe(true);
    expect(content2.events.some((e) => e.type === 'outputs_checked')).toBe(true);
    expect(content2.events.some((e) => e.type === 'sheet_solved' && e.data?.sheet === 1)).toBe(true);
    expect(content2.events.some((e) => e.type === 'sheet_solved' && e.data?.sheet === 2)).toBe(true);

    // Tab 2 was exported after Tab 1, so it contains Tab 1's export_requested event plus its own
    expect(content2.events.length).toBe(content1.events.length + 1);
    for (let i = 0; i < content1.events.length; i++) {
      expect(content2.events[i].seq).toBe(content1.events[i].seq);
      expect(content2.events[i].type).toBe(content1.events[i].type);
      expect(content2.events[i].prevHash).toBe(content1.events[i].prevHash);
    }

    // Unique consecutive seq starting at 1
    const expectedSeqs1 = Array.from({ length: content1.events.length }, (_, i) => i + 1);
    expect(content1.events.map((e) => e.seq)).toEqual(expectedSeqs1);
    const expectedSeqs2 = Array.from({ length: content2.events.length }, (_, i) => i + 1);
    expect(content2.events.map((e) => e.seq)).toEqual(expectedSeqs2);

    // Hash chain is completely intact in both files
    for (let i = 1; i < content1.events.length; i++) {
      const prev = content1.events[i - 1];
      const curr = content1.events[i];
      const expectedPrevHash = await sha256Hex(canonicalJsonStringify(prev));
      expect(curr.prevHash).toBe(expectedPrevHash);
    }
    for (let i = 1; i < content2.events.length; i++) {
      const prev = content2.events[i - 1];
      const curr = content2.events[i];
      const expectedPrevHash = await sha256Hex(canonicalJsonStringify(prev));
      expect(curr.prevHash).toBe(expectedPrevHash);
    }

    // Both files verify integrity
    const v1 = await verifyIntegrity(content1);
    const v2 = await verifyIntegrity(content2);
    expect(v1.ok).toBe(true);
    expect(v2.ok).toBe(true);

    await tab1.close();
    await tab2.close();
  });
});

import { preview } from 'vite';
import { chromium } from 'playwright';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, rm } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(
  repoRoot,
  'reports/development/plan-40-camouflaged-shape-sets-and-reveal-overlays/screenshots',
);

async function capturePlan40Screenshots() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  console.log('Starting preview server...');
  const server = await preview({
    root: resolve(repoRoot, 'ui'),
    configFile: resolve(repoRoot, 'vite.config.js'),
    preview: {
      port: 4173,
      host: '127.0.0.1',
    },
  });

  const baseUrl = 'http://127.0.0.1:4173';
  console.log(`Preview server listening at ${baseUrl}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // 1. Shapes-1 Sheet 1 Solved with Overlay (Sun with radiating rays, neutral F styling) - Student Solve
  console.log('Capturing 01-shapes-1-sheet1-sun-solved-overlay.png (student solve)...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=1`);
  await page.waitForSelector('[data-testid="shape-puzzle-page"]');
  // Expression: a && !b. Row 2 is T, rows 0, 1, 3 are F
  await page.locator('[data-testid="output-cell-0"]').click();
  await page.locator('[data-testid="output-cell-0"]').click(); // F
  await page.locator('[data-testid="output-cell-1"]').click();
  await page.locator('[data-testid="output-cell-1"]').click(); // F
  await page.locator('[data-testid="output-cell-2"]').click(); // T
  await page.locator('[data-testid="output-cell-3"]').click();
  await page.locator('[data-testid="output-cell-3"]').click(); // F
  await page.locator('[data-testid="btn-check-table"]').click();
  await page.waitForSelector('[data-testid="reveal-overlay-layer"]');
  await page.waitForTimeout(1600); // F4: wait for 1.2s overlay fade-in animation to complete
  await page.screenshot({ path: resolve(outDir, '01-shapes-1-sheet1-sun-solved-overlay.png') });

  // 2. Shapes-1 Sheet 2 Solved with Overlay (Gem faceted setting) - Student Solve (Shade mode)
  console.log('Capturing 02-shapes-1-sheet2-gem-solved-overlay.png (student solve)...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=2`);
  await page.waitForSelector('[data-testid="shape-puzzle-canvas"]');
  // Expression: a && b. True region is 3
  await page.locator('[data-testid="region-3"]').click();
  await page.locator('[data-testid="btn-check-shading"]').click();
  await page.waitForSelector('[data-testid="reveal-overlay-layer"]');
  await page.waitForTimeout(1600); // F4: wait for 1.2s overlay fade-in animation to complete
  await page.screenshot({ path: resolve(outDir, '02-shapes-1-sheet2-gem-solved-overlay.png') });

  // 3. Shapes-2 Sheet 1 Unsolved (Cat: Table mode, outlines only, no overlay in DOM)
  console.log('Capturing 03-shapes-2-sheet1-cat-unsolved.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-2&sheet=1`);
  await page.waitForSelector('[data-testid="shape-puzzle-page"]');
  await page.screenshot({ path: resolve(outDir, '03-shapes-2-sheet1-cat-unsolved.png') });

  // 4. Shapes-2 Sheet 1 Solved with Overlay (Cat: face whiskers, ears, eyes) - Student Solve
  console.log('Capturing 04-shapes-2-sheet1-cat-solved-overlay.png (student solve)...');
  await page.locator('[data-testid="output-cell-0"]').click();
  await page.locator('[data-testid="output-cell-0"]').click(); // F
  await page.locator('[data-testid="output-cell-1"]').click();
  await page.locator('[data-testid="output-cell-1"]').click(); // F
  await page.locator('[data-testid="output-cell-2"]').click();
  await page.locator('[data-testid="output-cell-2"]').click(); // F
  await page.locator('[data-testid="output-cell-3"]').click(); // T
  await page.locator('[data-testid="btn-check-table"]').click();
  await page.waitForSelector('[data-testid="reveal-overlay-layer"]');
  await page.waitForTimeout(1600); // F4: wait for 1.2s overlay fade-in animation to complete
  await page.screenshot({ path: resolve(outDir, '04-shapes-2-sheet1-cat-solved-overlay.png') });

  // 5. Shapes-2 Sheet 4 Student View (Submarine: Shade mode with dorsal decoy mast)
  console.log('Capturing 05-shapes-2-sheet4-submarine-student.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-2&sheet=4`);
  await page.waitForSelector('[data-testid="shape-puzzle-canvas"]');
  await page.screenshot({ path: resolve(outDir, '05-shapes-2-sheet4-submarine-student.png') });

  // 6. Shapes-2 Sheet 4 Solved with Overlay (Submarine hull, sail periscope, portholes) - Student Solve (Shade mode)
  console.log('Capturing 06-shapes-2-sheet4-submarine-solved-overlay.png (student solve)...');
  // Expression: a && !(b || c). True region is 4 (decoy mast is row 6, unshaded)
  await page.locator('[data-testid="region-4"]').dispatchEvent('click');
  await page.locator('[data-testid="btn-check-shading"]').click();
  await page.waitForSelector('[data-testid="reveal-overlay-layer"]');
  await page.waitForTimeout(1600); // F4: wait for 1.2s overlay fade-in animation to complete
  await page.screenshot({ path: resolve(outDir, '06-shapes-2-sheet4-submarine-solved-overlay.png') });

  // 7. Shapes-2 Sheet 5 Challenge Chip (Satellite, Extension Tier)
  console.log('Capturing 07-shapes-2-sheet5-challenge-chip.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-2&sheet=5`);
  await page.waitForSelector('[data-testid="challenge-chip"]');
  await page.screenshot({ path: resolve(outDir, '07-shapes-2-sheet5-challenge-chip.png') });

  // 8. Greyscale View (Sheet 3 Cabin solved with overlay in greyscale mode)
  console.log('Capturing 08-greyscale-mode-sheet3.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=3`);
  await page.waitForSelector('[data-testid="shape-puzzle-page"]');
  // Expression: a && !b || c. True rows: 1, 3, 4, 5, 7. All other rows (0, 2, 6): F
  const cabinTrueRows = new Set([1, 3, 4, 5, 7]);
  for (let r = 0; r < 8; r += 1) {
    if (cabinTrueRows.has(r)) {
      await page.locator(`[data-testid="output-cell-${r}"]`).click(); // T
    } else {
      await page.locator(`[data-testid="output-cell-${r}"]`).click();
      await page.locator(`[data-testid="output-cell-${r}"]`).click(); // F
    }
  }
  await page.locator('[data-testid="btn-check-table"]').click();
  await page.waitForSelector('[data-testid="reveal-overlay-layer"]');
  await page.waitForTimeout(1600); // F4: wait for 1.2s overlay fade-in animation to complete
  await page.evaluate(() => {
    document.body.style.filter = 'grayscale(100%)';
  });
  await page.screenshot({ path: resolve(outDir, '08-greyscale-mode-sheet3.png') });

  // 9. Phone View (390 x 844) of Shapes-2 Sheet 2 (Desert Saguaro Cactus)
  console.log('Capturing 09-phone-view-shapes-2-sheet2.png...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-2&sheet=2`);
  await page.waitForSelector('[data-testid="shape-puzzle-canvas"]');
  await page.screenshot({ path: resolve(outDir, '09-phone-view-shapes-2-sheet2.png') });

  console.log('Closing browser and server...');
  await browser.close();
  await server.close();
  console.log('Plan-40 screenshots captured successfully!');
}

capturePlan40Screenshots().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});

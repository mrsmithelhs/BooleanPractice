import { preview } from 'vite';
import { chromium } from 'playwright';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(
  repoRoot,
  'reports/development/plan-39-shape-puzzle-page-implementation/screenshots',
);

async function captureScreenshots() {
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

  // 1. Sheet 1 Start
  console.log('Capturing 01-sheet1-start.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=1`);
  await page.waitForSelector('[data-testid="shape-puzzle-page"]');
  await page.screenshot({ path: resolve(outDir, '01-sheet1-start.png') });

  // 2. Sheet 1 Outputs Checked
  console.log('Capturing 02-sheet1-outputs-checked.png...');
  // Fill outputs: F, F, T, F
  await page.locator('[data-testid="output-cell-0"]').click();
  await page.locator('[data-testid="output-cell-0"]').click();

  await page.locator('[data-testid="output-cell-1"]').click();
  await page.locator('[data-testid="output-cell-1"]').click();

  await page.locator('[data-testid="output-cell-2"]').click();

  await page.locator('[data-testid="output-cell-3"]').click();
  await page.locator('[data-testid="output-cell-3"]').click();

  await page.locator('[data-testid="btn-check-table"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: resolve(outDir, '02-sheet1-outputs-checked.png') });

  // 3. Sheet 1 Solved
  console.log('Capturing 03-sheet1-solved.png...');
  await page.locator('[data-testid="region-2"]').dispatchEvent('click');
  await page.locator('[data-testid="btn-check-shading"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: resolve(outDir, '03-sheet1-solved.png') });

  // 4. Sheet 3 Start (Cabin)
  console.log('Capturing 04-sheet3-start.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=3`);
  await page.waitForSelector('[data-testid="shape-puzzle-page"]');
  await page.screenshot({ path: resolve(outDir, '04-sheet3-start.png') });

  // 5. Sheet 3 Outputs Checked (Cabin: intendedTrueRows = [1, 3, 4, 5, 7])
  console.log('Capturing 05-sheet3-outputs-checked.png...');
  const cabinTrue = new Set([1, 3, 4, 5, 7]);
  for (let i = 0; i < 8; i++) {
    const btn = page.locator(`[data-testid="output-cell-${i}"]`);
    if (cabinTrue.has(i)) {
      // 1 click for T
      await btn.click();
    } else {
      // 2 clicks for F
      await btn.click();
      await btn.click();
    }
  }
  await page.locator('[data-testid="btn-check-table"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: resolve(outDir, '05-sheet3-outputs-checked.png') });

  // 6. Sheet 3 Solved
  console.log('Capturing 06-sheet3-solved.png...');
  for (const r of [1, 3, 4, 5, 7]) {
    await page.locator(`[data-testid="region-${r}"]`).dispatchEvent('click');
  }
  await page.locator('[data-testid="btn-check-shading"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: resolve(outDir, '06-sheet3-solved.png') });

  // 7. Teacher View
  console.log('Capturing 07-teacher-view.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=3&teacher=1`);
  await page.waitForSelector('[data-testid="teacher-badge"]');
  await page.screenshot({ path: resolve(outDir, '07-teacher-view.png') });

  // 8. Phone View (390 x 844)
  console.log('Capturing 08-phone-view.png...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=1`);
  await page.waitForSelector('.mobile-inspector-container');
  await page.screenshot({ path: resolve(outDir, '08-phone-view.png') });

  // 9. Greyscale (1366 x 768)
  console.log('Capturing 09-greyscale.png...');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=3`);
  await page.evaluate(() => {
    document.documentElement.style.filter = 'grayscale(100%)';
  });
  await page.waitForTimeout(100);
  await page.screenshot({ path: resolve(outDir, '09-greyscale.png') });

  console.log('Closing browser and server...');
  await browser.close();
  await server.close();
  console.log('Screenshots captured successfully!');
}

captureScreenshots().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});

import { preview } from 'vite';
import { chromium } from 'playwright';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, rm } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(
  repoRoot,
  'reports/development/plan-39-shape-puzzle-page-implementation/screenshots',
);

async function captureScreenshots() {
  // Clean outDir to avoid stale screenshots
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

  // 1. Sheet 1 Start (Table Mode Default)
  console.log('Capturing 01-sheet1-start.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=1`);
  await page.waitForSelector('[data-testid="shape-puzzle-page"]');
  await page.screenshot({ path: resolve(outDir, '01-sheet1-start.png') });

  // 2. Sheet 1 Solved (Table Mode: verified table outputs auto-shade TRUE regions and reveal picture)
  console.log('Capturing 02-sheet1-solved.png...');
  // Fill outputs: F, F, T, F
  await page.locator('[data-testid="output-cell-0"]').click();
  await page.locator('[data-testid="output-cell-0"]').click(); // F
  await page.locator('[data-testid="output-cell-1"]').click();
  await page.locator('[data-testid="output-cell-1"]').click(); // F
  await page.locator('[data-testid="output-cell-2"]').click(); // T
  await page.locator('[data-testid="output-cell-3"]').click();
  await page.locator('[data-testid="output-cell-3"]').click(); // F
  await page.locator('[data-testid="btn-check-table"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: resolve(outDir, '02-sheet1-solved.png') });

  // 3. Sheet 2 Start (Shade Mode Default: no table in DOM, shading enabled immediately)
  console.log('Capturing 03-sheet2-start.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=2`);
  await page.waitForSelector('[data-testid="shape-puzzle-page"]');
  await page.screenshot({ path: resolve(outDir, '03-sheet2-start.png') });

  // 4. Sheet 2 After Wrong Shading Check (Shade-only hint, no region outline markers)
  console.log('Capturing 04-sheet2-wrong-check.png...');
  // Deliberately shade wrong region: Region 0 instead of intended region 3
  await page.locator('[data-testid="region-0"]').dispatchEvent('click');
  await page.locator('[data-testid="btn-check-shading"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: resolve(outDir, '04-sheet2-wrong-check.png') });

  // 5. Sheet 2 Solved (Picture revealed, truth table appears filled and verified)
  console.log('Capturing 05-sheet2-solved.png...');
  // Unshade region 0, shade intended region 3
  await page.locator('[data-testid="region-0"]').dispatchEvent('click');
  await page.locator('[data-testid="region-3"]').dispatchEvent('click');
  await page.locator('[data-testid="btn-check-shading"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: resolve(outDir, '05-sheet2-solved.png') });

  // 6. Teacher View (Teacher Key badge showing Mode note, both representations solved)
  console.log('Capturing 06-teacher-view.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=2&teacher=1`);
  await page.waitForSelector('[data-testid="teacher-badge"]');
  await page.screenshot({ path: resolve(outDir, '06-teacher-view.png') });

  // 7. Phone View of Sheet 2 (390 x 844)
  console.log('Capturing 07-phone-view-sheet2.png...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=2`);
  await page.waitForSelector('[data-testid="shape-puzzle-canvas"]');
  await page.screenshot({ path: resolve(outDir, '07-phone-view-sheet2.png') });

  console.log('Closing browser and server...');
  await browser.close();
  await server.close();
  console.log('Screenshots captured successfully!');
}

captureScreenshots().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});

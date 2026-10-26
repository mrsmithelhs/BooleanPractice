import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(repoRoot, 'reports/development/plan-41-usage-export-and-local-teacher-view/screenshots');
mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('Starting Vite dev server...');
  const server = await createServer({
    root: resolve(repoRoot, 'ui'),
    configFile: resolve(repoRoot, 'vite.config.js'),
    server: {
      port: 5177,
      host: '127.0.0.1',
    },
  });
  await server.listen();
  const baseUrl = 'http://127.0.0.1:5177';
  console.log(`Vite dev server listening at ${baseUrl}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // 1. Export Dialog
  console.log('Capturing 01-export-dialog.png...');
  await page.goto(`${baseUrl}/puzzle.html?set=shapes-1&sheet=1`);
  await page.waitForSelector('[data-testid="download-progress-btn"]');
  await page.click('[data-testid="download-progress-btn"]');
  await page.waitForSelector('[data-testid="student-name-input"]');
  await page.fill('[data-testid="student-name-input"]', 'Alex Carter');
  await page.fill('[data-testid="class-code-input"]', 'PERIOD-1');
  await page.screenshot({ path: resolve(outDir, '01-export-dialog.png') });
  console.log('Captured 01-export-dialog.png');

  // 2. Downloaded-file confirmation
  console.log('Capturing 02-downloaded-confirmation.png...');
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="confirm-download-btn"]');
  await downloadPromise;
  await page.waitForSelector('[data-testid="export-success-message"]');
  await page.screenshot({ path: resolve(outDir, '02-downloaded-confirmation.png') });
  console.log('Captured 02-downloaded-confirmation.png');

  // 3. Admin table with fixture flags
  console.log('Capturing 03-admin-table-with-flags.png...');
  await page.goto(`${baseUrl}/admin.html`);
  await page.waitForSelector('[data-testid="admin-drop-zone"]');
  const fixtures = [
    resolve(repoRoot, 'tests/fixtures/usage/clean-student-a.json'),
    resolve(repoRoot, 'tests/fixtures/usage/flag-integrity-mismatch.json'),
    resolve(repoRoot, 'tests/fixtures/usage/flag-teacher-view-opened.json'),
    resolve(repoRoot, 'tests/fixtures/usage/flag-class-code-mismatch.json'),
    resolve(repoRoot, 'tests/fixtures/usage/flag-implausible-speed.json'),
  ];
  await page.locator('[data-testid="admin-file-input"]').setInputFiles(fixtures);
  await page.waitForSelector('[data-testid="admin-class-table"]');
  await page.fill('[data-testid="expected-class-input"]', 'PERIOD-1');
  await page.screenshot({ path: resolve(outDir, '03-admin-table-with-flags.png') });
  console.log('Captured 03-admin-table-with-flags.png');

  // 4. Student detail view modal
  console.log('Capturing 04-student-detail-view.png...');
  const finleyRow = page.locator('[data-testid="student-row"]').filter({ hasText: 'Finley Brooks' });
  await finleyRow.locator('[data-testid="student-name-btn"]').click();
  await page.waitForSelector('[data-testid="student-detail-modal"]');
  await page.screenshot({ path: resolve(outDir, '04-student-detail-view.png') });
  console.log('Captured 04-student-detail-view.png');

  await browser.close();
  await server.close();
  console.log('Screenshots capture complete.');
}

main().catch(console.error);

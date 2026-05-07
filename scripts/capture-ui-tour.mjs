import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  CAPTURE_ROOT,
  DEFAULT_APP_TARGET,
  PROJECT_NAME,
  REVIEW_SUBFOLDER,
  VIEWPORTS,
  buildCaptureRunId,
  buildManifest,
  buildReviewStartingPrompt,
  buildTourMarkdown,
  buildSynthesisStartingPrompt,
  getUiTourDefinitions,
  normalizeTourSelection,
  normalizeViewportSelection,
  slugify,
  writeJsonFile,
  writeTextFile,
} from './lib/ui-tour-capture.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const packageManagerCommand = 'npm';
const defaultHost = '127.0.0.1';
const defaultPreviewPort = 4173;
const defaultDevPort = 5177;

const args = parseArgs(process.argv.slice(2));
const captureDateTime = buildCaptureRunId(new Date());
const outputRoot = resolve(repoRoot, args.outputRoot ?? CAPTURE_ROOT);
const runFolder = resolve(outputRoot, createSafeRunFolderName(outputRoot, captureDateTime));
const runReviewsFolder = join(runFolder, REVIEW_SUBFOLDER);
const appTarget = args.target ?? DEFAULT_APP_TARGET;
const selectedViewports = normalizeViewportSelection(args.viewports);
const allTours = getUiTourDefinitions();
const tours = normalizeTourSelection(args.tours, allTours);
const captureCommand = buildCaptureCommand(process.argv.slice(2));
const commitSha = await getCommitSha();
const appVersion = await getPackageVersion();
let appUrl = '';

if (args.listTours) {
  printTourList(allTours);
  process.exit(0);
}

await mkdir(runReviewsFolder, { recursive: true });

const browser = await chromium.launch({ headless: true });
const screenshots = [];
const startedProcesses = [];
const capturedTourSummaries = new Map();

try {
  const { appUrl: resolvedAppUrl, startedProcess } = await ensureAppTarget(appTarget);
  appUrl = resolvedAppUrl;

  if (startedProcess) {
    startedProcesses.push(startedProcess);
  }

  for (const tour of tours) {
    const viewports = selectedViewports.filter((viewportId) =>
      tour.defaultViewports.includes(viewportId),
    );

    for (const viewportId of viewports) {
      const viewport = VIEWPORTS[viewportId];
      if (!viewport) {
        continue;
      }

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: Boolean(viewport.isMobile),
        hasTouch: Boolean(viewport.hasTouch),
      });

      for (const [shotIndex, shot] of tour.shots.entries()) {
        const page = await context.newPage();
        try {
          if (typeof shot.prepare === 'function') {
            await shot.prepare(page, {
              appTarget,
              appUrl,
              problem: tour.record,
              challenge: tour.record,
              viewport,
            });
          }

          await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle');

          await shot.run({
            page,
            appTarget,
            appUrl,
            problem: tour.record,
            challenge: tour.record,
            viewport,
            runFolder,
            reviewFolder: runReviewsFolder,
            shot,
          });

          const filename = `${String(screenshots.length + 1).padStart(3, '0')}-${slugify(tour.id)}-${slugify(shot.id)}-${viewport.id}.png`;
          const filePath = join(runFolder, filename);
          await page.screenshot({ path: filePath, fullPage: true });

          screenshots.push({
            id: String(screenshots.length + 1).padStart(3, '0'),
            filename,
            tourId: tour.id,
            tourTitle: tour.title,
            viewportId: viewport.id,
            viewportLabel: viewport.label,
            description: shot.description,
            interactionState: shot.description,
            route: appUrl,
          });

          const summary = capturedTourSummaries.get(tour.id) ?? {
            id: tour.id,
            title: tour.title,
            description: tour.description,
            viewports: [],
            recordId: tour.record?.id ?? '',
            recordTitle: tour.record?.title ?? '',
          };
          if (!summary.viewports.some((entry) => entry.id === viewport.id)) {
            summary.viewports.push({
              id: viewport.id,
              label: viewport.label,
              width: viewport.width,
              height: viewport.height,
            });
          }
          capturedTourSummaries.set(tour.id, summary);
        } finally {
          await page.close().catch(() => {});
        }
      }

      await context.close();
    }
  }

  const manifest = buildManifest({
    projectName: PROJECT_NAME,
    captureDateTime,
    appVersion,
    commitSha,
    captureCommand,
    appTarget,
    appUrl,
    outputFolder: runFolder,
    viewports: selectedViewports.map((viewportId) => VIEWPORTS[viewportId]).filter(Boolean),
    tours: tours
      .map((tour) => capturedTourSummaries.get(tour.id))
      .filter(Boolean),
    screenshots,
  });

  await writeJsonFile(join(runFolder, 'manifest.json'), manifest);
  await writeTextFile(join(runFolder, 'tour.md'), buildTourMarkdown(manifest));
  await writeTextFile(join(runFolder, 'review-starting-prompt.md'), buildReviewStartingPrompt(manifest));
  await writeTextFile(join(runFolder, 'synthesis-starting-prompt.md'), buildSynthesisStartingPrompt(manifest));
  await mkdir(runReviewsFolder, { recursive: true });

  console.log(`Capture complete: ${runFolder}`);
} finally {
  await browser.close().catch(() => {});
  await Promise.all(startedProcesses.map((processInfo) => stopProcessTree(processInfo)).map((promise) => promise.catch(() => {})));
}

function parseArgs(argv) {
  const parsed = {
    tours: [],
    viewports: [],
    outputRoot: null,
    target: null,
    listTours: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--list-tours') {
      parsed.listTours = true;
      continue;
    }

    if (arg === '--tour' || arg === '--tours') {
      const value = argv[index + 1] ?? '';
      index += 1;
      parsed.tours.push(...value.split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }

    if (arg.startsWith('--tour=')) {
      parsed.tours.push(...arg.slice('--tour='.length).split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }

    if (arg.startsWith('--tours=')) {
      parsed.tours.push(...arg.slice('--tours='.length).split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }

    if (arg === '--viewports') {
      const value = argv[index + 1] ?? '';
      index += 1;
      parsed.viewports.push(...value.split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }

    if (arg.startsWith('--viewports=')) {
      parsed.viewports.push(...arg.slice('--viewports='.length).split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }

    if (arg === '--output-root') {
      parsed.outputRoot = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--output-root=')) {
      parsed.outputRoot = arg.slice('--output-root='.length);
      continue;
    }

    if (arg === '--target') {
      parsed.target = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--target=')) {
      parsed.target = arg.slice('--target='.length);
    }
  }

  return parsed;
}

function buildCaptureCommand(argv) {
  return ['npm run capture:ui-tour', argv.join(' ')].filter(Boolean).join(' ');
}

function createSafeRunFolderName(root, runId) {
  let candidate = runId;
  let suffix = 1;

  while (true) {
    const runFolder = join(root, candidate);
    if (!runFolderExists(runFolder)) {
      return candidate;
    }

    candidate = `${runId}-${String(suffix).padStart(2, '0')}`;
    suffix += 1;
  }
}

function runFolderExists(folder) {
  try {
    return existsSync(folder);
  } catch {
    return false;
  }
}

async function getCommitSha() {
  try {
    const { execFile } = await import('node:child_process');
    return await new Promise((resolveSha) => {
      execFile('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot }, (error, stdout) => {
        if (error) {
          resolveSha('');
          return;
        }

        resolveSha(stdout.trim());
      });
    });
  } catch {
    return '';
  }
}

async function getPackageVersion() {
  try {
    const packagePath = join(repoRoot, 'package.json');
    const packageJson = JSON.parse(await readFile(packagePath, 'utf-8'));
    return packageJson.version ?? '';
  } catch {
    return '';
  }
}

function printTourList(tours) {
  console.log('Available UI tours:');
  for (const tour of tours) {
    console.log(`- ${tour.id}: ${tour.title}`);
  }
}

async function ensureAppTarget(target) {
  const host = defaultHost;

  if (target === 'dev') {
    const url = `http://${host}:${defaultDevPort}`;
    if (await canReachExpectedApp(url, 'dev')) {
      return { appUrl: url, startedProcess: null };
    }

    const startedProcess = await startProcess(['run', 'dev', '--', '--host', host, '--port', String(defaultDevPort)]);
    await waitForUrl(url);
    return { appUrl: url, startedProcess };
  }

  const url = `http://${host}:${defaultPreviewPort}`;
  await startProcessIfNeeded(['run', 'build']);
  if (await canReachExpectedApp(url, 'preview')) {
    return { appUrl: url, startedProcess: null };
  }

  const startedProcess = await startProcess(['run', 'preview', '--', '--host', host, '--port', String(defaultPreviewPort)]);
  await waitForUrl(url);
  return { appUrl: url, startedProcess };
}

async function startProcessIfNeeded(args) {
  const child = await startProcess(args);
  const code = await waitForProcessExit(child);
  if (code !== 0) {
    throw new Error(`Command failed: ${packageManagerCommand} ${args.join(' ')}`);
  }
}

async function startProcess(args) {
  const child =
    process.platform === 'win32'
      ? spawn('cmd.exe', ['/c', packageManagerCommand, ...args], {
          cwd: repoRoot,
          stdio: 'inherit',
          env: { ...process.env },
          windowsHide: true,
        })
      : spawn(packageManagerCommand, args, {
          cwd: repoRoot,
          stdio: 'inherit',
          env: { ...process.env },
          windowsHide: true,
        });

  return child;
}

async function waitForProcessExit(child) {
  return new Promise((resolveExit, rejectExit) => {
    child.once('error', rejectExit);
    child.once('exit', (code) => {
      resolveExit(code ?? 1);
    });
  });
}

async function canReachExpectedApp(url, target) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }

    const text = await response.text();
    if (!text.includes('<title>Boolean Practice</title>')) {
      return false;
    }

    if (target === 'dev') {
      return text.includes('src="./main.js"');
    }

    return text.includes('assets/index-');
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await canReachExpectedApp(url, targetFromUrl(url))) {
      return;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function targetFromUrl(url) {
  return url.includes(String(defaultDevPort)) ? 'dev' : 'preview';
}

async function stopProcessTree(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === 'win32' && Number.isInteger(child.pid)) {
    await new Promise((resolveStop) => {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        cwd: repoRoot,
        stdio: 'ignore',
        windowsHide: true,
        shell: false,
      });

      killer.once('exit', () => resolveStop());
      killer.once('error', () => resolveStop());
    });
    return;
  }

  child.kill('SIGTERM');
}

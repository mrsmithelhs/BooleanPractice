import { createInterface } from 'node:readline/promises';
import process from 'node:process';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import {
  ENV_FILES,
  buildDashboardText,
  buildPackageScriptInvocation,
  buildRuntimeTargets,
  buildUiTourCaptureArgs,
  ensureLocalControlDirs,
  formatProcessInvocation,
  inspectRuntime,
  loadRepoLocalEnv,
  openUrlInBrowser,
  resolveConsoleConfig,
  runPackageScript,
  runNodeScript,
  startManagedRuntime,
  stopManagedRuntime,
} from '../lib/dev-control.js';
import {
  buildSynthesisCommandArgs,
  findLatestCaptureFolder,
} from '../lib/ui-review-synthesis.js';
import { getUiTourDefinitions } from '../lib/ui-tour-capture.js';

export const CONSOLE_MENU = [
  { key: '1', label: 'Local dev server' },
  { key: '2', label: 'Tests and validation' },
  { key: '3', label: 'Builds and previews' },
  { key: '4', label: 'UI review workflows' },
  { key: '5', label: 'Packet status' },
  { key: '6', label: 'Advanced scripts and config' },
  { key: '7', label: 'Exit' },
];

export const SUBMENU_BACK = { key: 'b', label: 'Back' };

function separator(title) {
  return `\n${'='.repeat(12)} ${title} ${'='.repeat(12)}\n`;
}

function printBlock(text) {
  process.stdout.write(`${text}\n`);
}

function printProcessResult(result) {
  printBlock(`Command: ${formatProcessInvocation(result.invocation)}`);
  if (result.launchError) {
    printBlock(`Launch error: ${result.launchError.code || result.launchError.message}`);
    return;
  }
  printBlock(`Exit code: ${result.code ?? 0}`);
  if (result.signal) {
    printBlock(`Signal: ${result.signal}`);
  }
}

async function runConfirmedPackageScript(repoRoot, rl, scriptName, args = []) {
  const invocation = buildPackageScriptInvocation(scriptName, args);
  if (
    !(await promptConfirm(
      rl,
      `Run this command?\nCommand: ${formatProcessInvocation(invocation)}`,
    ))
  ) {
    return null;
  }
  const result = await runPackageScript(scriptName, args, { repoRoot });
  printProcessResult(result);
  return result;
}

async function promptChoice(rl, message, defaultValue = '') {
  try {
    const answer = await rl.question(`${message}${defaultValue ? ` [${defaultValue}]` : ''}: `);
    const trimmed = answer.trim();
    return trimmed || defaultValue;
  } catch (error) {
    if (error?.code === 'ERR_USE_AFTER_CLOSE' || error?.code === 'EPIPE' || error?.code === 'ABORT_ERR') {
      return '__closed__';
    }
    throw error;
  }
}

async function promptConfirm(rl, message) {
  try {
    const answer = (await rl.question(`${message} [y/N]: `)).trim().toLowerCase();
    return answer === 'y' || answer === 'yes';
  } catch (error) {
    if (error?.code === 'ERR_USE_AFTER_CLOSE' || error?.code === 'EPIPE' || error?.code === 'ABORT_ERR') {
      return false;
    }
    throw error;
  }
}

async function waitForHealthySnapshot(repoRoot, target, timeoutMs = 15_000) {
  const startedAt = Date.now();
  let latestSnapshot = null;
  do {
    latestSnapshot = await inspectRuntime(target, { repoRoot });
    if (latestSnapshot.status === 'healthy') {
      return latestSnapshot;
    }
    await delay(500);
  } while (Date.now() - startedAt < timeoutMs);
  return latestSnapshot;
}

async function inspectDashboard(repoRoot) {
  const env = await loadRepoLocalEnv(repoRoot);
  const config = resolveConsoleConfig(env, repoRoot);
  const targets = buildRuntimeTargets(config);
  const [devSnapshot, previewSnapshot] = await Promise.all(
    targets.map((target) => inspectRuntime(target, { repoRoot })),
  );
  const envFileLabel = ENV_FILES.join(', ');
  return {
    config,
    targets,
    snapshots: [devSnapshot, previewSnapshot],
    envFileLabel,
  };
}

async function startDevServer(repoRoot, rl) {
  const dashboard = await inspectDashboard(repoRoot);
  const devTarget = dashboard.targets[0];
  const snapshot = dashboard.snapshots[0];

  if (snapshot.status === 'healthy' || snapshot.status === 'starting' || snapshot.status === 'unhealthy') {
    printBlock(`Dev server is already managed or running: ${snapshot.status}`);
    printBlock(`Open: ${devTarget.url}`);
    return;
  }

  if (snapshot.status === 'port-occupied-unmanaged') {
    printBlock(`Port ${devTarget.port} is occupied by an unmanaged process.`);
    printBlock(`PID: ${snapshot.portOccupant?.pid ?? 'unknown'}`);
    if (snapshot.portOccupant?.processName) {
      printBlock(`Process: ${snapshot.portOccupant.processName}`);
    }
    printBlock('Stop that process first, then come back here.');
    return;
  }

  const startInvocation = buildPackageScriptInvocation('dev');
  if (
    !(await promptConfirm(
      rl,
      `Start the dev server on port ${devTarget.port}?\nCommand: ${formatProcessInvocation(startInvocation)}`,
    ))
  ) {
    return;
  }

  printBlock(separator('Starting dev server').trimEnd());
  let result;
  try {
    result = await startManagedRuntime(devTarget, { repoRoot });
  } catch (error) {
    printBlock(`Launch error: ${error?.code || error?.message || error}`);
    return;
  }
  printBlock(`Started PID ${result.pid}`);
  printBlock(`Log: ${result.logFile}`);
  printBlock(`Open: ${devTarget.url}`);
  printBlock('Waiting for the server to become healthy...');
  const freshSnapshot = await waitForHealthySnapshot(repoRoot, devTarget);
  printBlock(`Status: ${freshSnapshot.status}`);
}

async function stopDevServer(repoRoot, rl) {
  const dashboard = await inspectDashboard(repoRoot);
  const devTarget = dashboard.targets[0];
  const snapshot = dashboard.snapshots[0];

  if (snapshot.status === 'stopped' && !snapshot.managedState) {
    printBlock('The managed dev server is not running.');
    return;
  }

  if (
    snapshot.status !== 'stopped' &&
    !(await promptConfirm(rl, `Stop the managed dev server on port ${devTarget.port}?`))
  ) {
    return;
  }

  const result = await stopManagedRuntime(devTarget);
  if (result.stopped) {
    printBlock(`Stopped PID ${result.pid}`);
  } else {
    printBlock('No managed dev server state was found.');
  }
}

async function restartDevServer(repoRoot, rl) {
  const dashboard = await inspectDashboard(repoRoot);
  const devTarget = dashboard.targets[0];
  const snapshot = dashboard.snapshots[0];

  if (snapshot.status === 'port-occupied-unmanaged') {
    printBlock(`Port ${devTarget.port} is occupied by an unmanaged process.`);
    return;
  }

  if (
    snapshot.status !== 'stopped' &&
    !(await promptConfirm(rl, `Restart the managed dev server on port ${devTarget.port}?`))
  ) {
    return;
  }

  await stopManagedRuntime(devTarget);
  let result;
  try {
    result = await startManagedRuntime(devTarget, { repoRoot });
  } catch (error) {
    printBlock(`Launch error: ${error?.code || error?.message || error}`);
    return;
  }
  printBlock(`Restarted PID ${result.pid}`);
  printBlock(`Open: ${devTarget.url}`);
  const freshSnapshot = await waitForHealthySnapshot(repoRoot, devTarget);
  printBlock(`Status: ${freshSnapshot.status}`);
}

async function openDevApp(repoRoot) {
  const dashboard = await inspectDashboard(repoRoot);
  const devTarget = dashboard.targets[0];
  const snapshot = dashboard.snapshots[0];
  if (snapshot.status === 'stopped' && !snapshot.managedState) {
    printBlock('The dev server is not running yet. Start it first.');
    return;
  }
  await openUrlInBrowser(devTarget.url);
  printBlock(`Opened ${devTarget.url}`);
}

async function openPreview(repoRoot) {
  const dashboard = await inspectDashboard(repoRoot);
  const previewTarget = dashboard.targets[1];
  const snapshot = dashboard.snapshots[1];
  if (snapshot.status === 'stopped') {
    printBlock('Preview is not running yet.');
    printBlock(`Build and serve it with: ${previewTarget.startHint}`);
    return;
  }
  await openUrlInBrowser(previewTarget.url);
  printBlock(`Opened ${previewTarget.url}`);
}

async function runChecks(repoRoot, rl) {
  const options = [
    { key: '1', label: 'npm test', script: 'test' },
    { key: '2', label: 'npm run lint', script: 'lint' },
    { key: '3', label: 'npm run build', script: 'build' },
    { key: '4', label: 'npm run test:e2e', script: 'test:e2e' },
    { key: '5', label: 'All core checks', script: 'all-core' },
    { key: '6', label: 'Back', script: 'back' },
  ];
  printBlock(separator('Run checks').trimEnd());
  for (const option of options) {
    printBlock(`${option.key}. ${option.label}`);
  }
  const choice = await promptChoice(rl, 'Select a check', '6');
  const selected = options.find((option) => option.key === choice);
  if (!selected || selected.script === 'back') {
    return;
  }
  const scripts =
    selected.script === 'all-core'
      ? ['test', 'lint', 'build']
      : [selected.script];
  for (const scriptName of scripts) {
    printBlock(separator(`Running npm run ${scriptName}`).trimEnd());
    const result =
      scriptName === 'build'
        ? await runConfirmedPackageScript(repoRoot, rl, scriptName)
        : await runPackageScript(scriptName, [], { repoRoot });
    if (result && scriptName !== 'build') {
      printProcessResult(result);
    }
    if (result === null) {
      break;
    }
    if (!result.ok) {
      break;
    }
  }
}

async function showConfig(repoRoot) {
  const env = await loadRepoLocalEnv(repoRoot);
  const config = resolveConsoleConfig(env, repoRoot);
  printBlock(separator('Config').trimEnd());
  printBlock(`Repo root: ${repoRoot}`);
  printBlock(`Host: ${config.host}`);
  printBlock(`Dev port: ${config.devPort}`);
  printBlock(`Preview port: ${config.previewPort}`);
  printBlock(`Dev URL: ${config.devUrl}`);
  printBlock(`Preview URL: ${config.previewUrl}`);
  printBlock(`Env keys: ${Object.keys(env).length ? Object.keys(env).join(', ') : '(none)'}`);
}

function parseCommaSeparatedList(input) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function captureUiTours(repoRoot, rl) {
  const tours = getUiTourDefinitions();
  printBlock(separator('UI tour capture').trimEnd());
  printBlock('Available tours:');
  for (const tour of tours) {
    printBlock(`- ${tour.id}: ${tour.title}`);
  }

  const runFullBatch = await promptConfirm(rl, 'Capture the full starter batch now?');
  let selectedTourIds = [];
  let selectedViewports = [];
  let target = 'preview';
  let outputRoot = '';

  if (!runFullBatch) {
    const tourInput = await promptChoice(rl, 'Tour ids (comma-separated, blank for all)', '');
    selectedTourIds = tourInput ? parseCommaSeparatedList(tourInput) : [];
    const viewportInput = await promptChoice(
      rl,
      'Viewports (comma-separated, blank for desktop,mobile)',
      '',
    );
    selectedViewports = viewportInput ? parseCommaSeparatedList(viewportInput) : [];
    target = await promptChoice(rl, 'Target (preview or dev)', 'preview');
    outputRoot = await promptChoice(rl, 'Output root (blank for local/ui-reviews)', '');
  }

  const args = buildUiTourCaptureArgs({
    tours: selectedTourIds,
    viewports: selectedViewports,
    target: target || null,
    outputRoot: outputRoot || null,
  });
  await runConfirmedPackageScript(repoRoot, rl, 'capture:ui-tour', args);
}

async function synthesizeUiReviews(repoRoot, rl) {
  const latestCaptureFolder = await findLatestCaptureFolder(resolve(repoRoot, 'local/ui-reviews'));
  let captureFolder = latestCaptureFolder;

  printBlock(separator('UI review synthesis').trimEnd());

  if (captureFolder) {
    printBlock(`Latest capture folder: ${captureFolder}`);
    if (!(await promptConfirm(rl, 'Use the latest capture folder?'))) {
      captureFolder = await promptChoice(
        rl,
        'Capture folder path',
        'local/ui-reviews/<timestamp>',
      );
    }
  } else {
    printBlock('No capture folder was found under local/ui-reviews.');
    captureFolder = await promptChoice(rl, 'Capture folder path', 'local/ui-reviews/<timestamp>');
  }

  if (!captureFolder || captureFolder.includes('<timestamp>')) {
    printBlock('No capture folder selected.');
    return;
  }

  const args = buildSynthesisCommandArgs(captureFolder);
  await runConfirmedPackageScript(repoRoot, rl, 'synthesize:ui-reviews', args);
}

async function runPacketStatus(repoRoot, rl) {
  printBlock(separator('Packet status').trimEnd());
  printBlock('1. List packet statuses');
  printBlock('2. Check a packet');
  printBlock('b. Back');
  const choice = await promptChoice(rl, 'Choose a packet-status action', 'b');
  if (choice === 'b') return;

  const args = ['list'];
  if (choice === '2') {
    const id = await promptChoice(rl, 'Packet id (for example, plan-35)', '');
    if (!id || id === '__closed__') return;
    args.splice(0, args.length, 'check', id);
  } else if (choice !== '1') {
    return;
  }

  const result = await runNodeScript(resolve(repoRoot, 'scripts/dev/plan-status.js'), args, { repoRoot });
  printProcessResult(result);
}

async function runBuildsAndPreviews(repoRoot, rl) {
  printBlock(separator('Builds and previews').trimEnd());
  printBlock('1. Open preview');
  printBlock('2. Build static app');
  printBlock('3. Build GAS package');
  printBlock('b. Back');
  const choice = await promptChoice(rl, 'Choose a build or preview action', 'b');
  if (choice === '1') {
    await openPreview(repoRoot);
  } else if (choice === '2') {
    await runConfirmedPackageScript(repoRoot, rl, 'build');
  } else if (choice === '3') {
    await runConfirmedPackageScript(repoRoot, rl, 'build:gas');
  }
}

async function runUiReviewWorkflows(repoRoot, rl) {
  printBlock(separator('UI review workflows').trimEnd());
  printBlock('1. Capture UI tours');
  printBlock('2. Synthesize UI reviews');
  printBlock('b. Back');
  const choice = await promptChoice(rl, 'Choose a UI review action', 'b');
  if (choice === '1') {
    await captureUiTours(repoRoot, rl);
  } else if (choice === '2') {
    await synthesizeUiReviews(repoRoot, rl);
  }
}

async function runLocalDevServerMenu(repoRoot, rl) {
  printBlock(separator('Local dev server').trimEnd());
  printBlock('1. Status dashboard');
  printBlock('2. Start dev server');
  printBlock('3. Stop dev server');
  printBlock('4. Restart dev server');
  printBlock('5. Open app');
  printBlock('b. Back');
  const choice = await promptChoice(rl, 'Choose a dev-server action', 'b');
  if (choice === '1') {
    const dashboard = await inspectDashboard(repoRoot);
    printBlock(buildDashboardText(dashboard.snapshots, dashboard));
  } else if (choice === '2') {
    await startDevServer(repoRoot, rl);
  } else if (choice === '3') {
    await stopDevServer(repoRoot, rl);
  } else if (choice === '4') {
    await restartDevServer(repoRoot, rl);
  } else if (choice === '5') {
    await openDevApp(repoRoot);
  }
}

async function runAdvancedMenu(repoRoot, rl) {
  printBlock(separator('Advanced scripts and config').trimEnd());
  printBlock('1. Show config');
  printBlock('b. Back');
  const choice = await promptChoice(rl, 'Choose an advanced action', 'b');
  if (choice === '1') {
    await showConfig(repoRoot);
  }
}

async function main() {
  const repoRoot = process.cwd();
  await ensureLocalControlDirs(repoRoot);
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    let running = true;
    while (running) {
      const dashboard = await inspectDashboard(repoRoot);
      printBlock(
        buildDashboardText(dashboard.snapshots, {
          config: dashboard.config,
          envFileLabel: dashboard.envFileLabel,
        }),
      );
      for (const item of CONSOLE_MENU) {
        printBlock(`${item.key}. ${item.label}`);
      }

      const choice = await promptChoice(rl, 'Choose an action', '1');
      if (choice === '__closed__') {
        running = false;
        continue;
      }
      if (choice === '7') {
        running = false;
        continue;
      }
      if (choice === '1') {
        await runLocalDevServerMenu(repoRoot, rl);
        continue;
      }
      if (choice === '2') {
        await runChecks(repoRoot, rl);
        continue;
      }
      if (choice === '3') {
        await runBuildsAndPreviews(repoRoot, rl);
        continue;
      }
      if (choice === '4') {
        await runUiReviewWorkflows(repoRoot, rl);
        continue;
      }
      if (choice === '5') {
        await runPacketStatus(repoRoot, rl);
        continue;
      }
      if (choice === '6') {
        await runAdvancedMenu(repoRoot, rl);
        continue;
      }
      printBlock('Unknown choice. Please enter a number from the menu.');
    }
  } finally {
    rl.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

import { createInterface } from 'node:readline/promises';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import {
  ENV_FILES,
  buildDashboardText,
  buildRuntimeTargets,
  buildUiTourCaptureArgs,
  ensureLocalControlDirs,
  inspectRuntime,
  loadRepoLocalEnv,
  openUrlInBrowser,
  resolveConsoleConfig,
  runPackageScript,
  startManagedRuntime,
  stopManagedRuntime,
} from '../lib/dev-control.js';
import { getUiTourDefinitions } from '../lib/ui-tour-capture.js';

function separator(title) {
  return `\n${'='.repeat(12)} ${title} ${'='.repeat(12)}\n`;
}

function printBlock(text) {
  process.stdout.write(`${text}\n`);
}

async function promptChoice(rl, message, defaultValue = '') {
  const answer = await rl.question(`${message}${defaultValue ? ` [${defaultValue}]` : ''}: `);
  const trimmed = answer.trim();
  return trimmed || defaultValue;
}

async function promptConfirm(rl, message) {
  const answer = (await rl.question(`${message} [y/N]: `)).trim().toLowerCase();
  return answer === 'y' || answer === 'yes';
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

  if (!(await promptConfirm(rl, `Start the dev server on port ${devTarget.port}?`))) {
    return;
  }

  printBlock(separator('Starting dev server').trimEnd());
  const result = await startManagedRuntime(devTarget, { repoRoot });
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
  const result = await startManagedRuntime(devTarget, { repoRoot });
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
    const result = await runPackageScript(scriptName, [], { repoRoot });
    printBlock(`Exit code: ${result.code ?? 0}`);
    if (result.code && result.code !== 0) {
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
  printBlock(`Running: npm run capture:ui-tour${args.length ? ` -- ${args.join(' ')}` : ''}`);
  const result = await runPackageScript('capture:ui-tour', args, { repoRoot });
  printBlock(`Exit code: ${result.code ?? 0}`);
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
      printBlock('1. Status dashboard');
      printBlock('2. Start dev server');
      printBlock('3. Stop dev server');
      printBlock('4. Restart dev server');
      printBlock('5. Open app');
      printBlock('6. Open preview');
      printBlock('7. Run checks');
      printBlock('8. Capture UI tours');
      printBlock('9. Show config');
      printBlock('10. Exit');

      const choice = await promptChoice(rl, 'Choose an action', '1');
      if (choice === '10') {
        running = false;
        continue;
      }
      if (choice === '1') {
        continue;
      }
      if (choice === '2') {
        await startDevServer(repoRoot, rl);
        continue;
      }
      if (choice === '3') {
        await stopDevServer(repoRoot, rl);
        continue;
      }
      if (choice === '4') {
        await restartDevServer(repoRoot, rl);
        continue;
      }
      if (choice === '5') {
        await openDevApp(repoRoot);
        continue;
      }
      if (choice === '6') {
        await openPreview(repoRoot);
        continue;
      }
      if (choice === '7') {
        await runChecks(repoRoot, rl);
        continue;
      }
      if (choice === '8') {
        await captureUiTours(repoRoot, rl);
        continue;
      }
      if (choice === '9') {
        await showConfig(repoRoot);
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

import { createWriteStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_DEV_PORT = 5177;
export const DEFAULT_PREVIEW_PORT = 4173;
export const DEV_CONTROL_DIR = resolve(process.cwd(), 'local', 'dev-control');
export const DEV_RUNTIME_STATE_FILE = resolve(DEV_CONTROL_DIR, 'dev-server.json');
export const DEV_RUNTIME_LOG_DIR = resolve(DEV_CONTROL_DIR, 'logs');
export const ENV_FILES = ['.env', '.env.local'];
export const RUNTIME_HEALTH_TIMEOUT_MS = 15_000;

export function parseEnvFileContents(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/u)) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    if (line.startsWith('export ')) {
      line = line.slice(7).trim();
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) {
      values[key] = value;
    }
  }
  return values;
}

export async function loadRepoLocalEnv(repoRoot = process.cwd()) {
  const merged = {};
  for (const fileName of ENV_FILES) {
    const filePath = resolve(repoRoot, fileName);
    try {
      const contents = await fs.readFile(filePath, 'utf8');
      Object.assign(merged, parseEnvFileContents(contents));
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  return merged;
}

function parsePort(value, fallback) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

export function resolveConsoleConfig(env = {}, repoRoot = process.cwd()) {
  const host = env.BOOLEAN_PRACTICE_HOST || DEFAULT_HOST;
  const devPort = parsePort(env.BOOLEAN_PRACTICE_DEV_PORT, DEFAULT_DEV_PORT);
  const previewPort = parsePort(
    env.BOOLEAN_PRACTICE_PREVIEW_PORT,
    DEFAULT_PREVIEW_PORT,
  );

  return {
    repoRoot,
    host,
    devPort,
    previewPort,
    devUrl: buildLocalUrl(host, devPort),
    previewUrl: buildLocalUrl(host, previewPort),
    env,
  };
}

export function buildLocalUrl(host, port) {
  return `http://${host}:${port}/`;
}

export function getDevControlPaths(repoRoot = process.cwd()) {
  const localDir = resolve(repoRoot, 'local', 'dev-control');
  return {
    localDir,
    logDir: resolve(localDir, 'logs'),
    devStateFile: resolve(localDir, 'dev-server.json'),
  };
}

export function buildRuntimeTargets(config) {
  const paths = getDevControlPaths(config.repoRoot);
  return [
    {
      id: 'dev-server',
      label: 'Dev server',
      managed: true,
      port: config.devPort,
      host: config.host,
      url: config.devUrl,
      command: ['npm', 'run', 'dev'],
      stateFile: paths.devStateFile,
      logDir: paths.logDir,
      startHint: 'npm run dev',
    },
    {
      id: 'preview',
      label: 'Preview build',
      managed: false,
      port: config.previewPort,
      host: config.host,
      url: config.previewUrl,
      command: ['npm', 'run', 'preview', '--', '--host', config.host],
      startHint: `npm run build && npm run preview -- --host ${config.host}`,
    },
  ];
}

export function buildUiTourCaptureArgs({
  tours = [],
  viewports = [],
  target = null,
  outputRoot = null,
  listTours = false,
} = {}) {
  const args = [];
  if (listTours) {
    args.push('--list-tours');
  }
  if (tours.length) {
    args.push('--tour', tours.join(','));
  }
  if (viewports.length) {
    args.push('--viewports', viewports.join(','));
  }
  if (target) {
    args.push('--target', target);
  }
  if (outputRoot) {
    args.push('--output-root', outputRoot);
  }
  return args;
}

export function formatClockLabel(date = new Date()) {
  return date.toISOString().replace(/[:.]/gu, '-');
}

export function ensureDir(dirPath) {
  return fs.mkdir(dirPath, { recursive: true });
}

export async function ensureLocalControlDirs(repoRoot = process.cwd()) {
  const { localDir, logDir } = getDevControlPaths(repoRoot);
  await fs.mkdir(localDir, { recursive: true });
  await fs.mkdir(logDir, { recursive: true });
  return { localDir, logDir };
}

export async function readManagedRuntimeState(stateFile) {
  try {
    const contents = await fs.readFile(stateFile, 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    return null;
  }
}

export async function writeManagedRuntimeState(stateFile, state) {
  await ensureDir(dirname(stateFile));
  await fs.writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export async function clearManagedRuntimeState(stateFile) {
  try {
    await fs.unlink(stateFile);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

export function parseNetstatTcpOutput(output, port) {
  const matches = [];
  for (const rawLine of output.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('Proto') || line.startsWith('Active')) {
      continue;
    }
    const match = line.match(
      /^\s*(TCP)\s+(\S+):(\d+)\s+(\S+):(\d+)\s+(\S+)\s+(\d+)\s*$/iu,
    );
    if (!match) {
      continue;
    }
    const [, protocol, localHost, localPort, remoteHost, remotePort, state, pid] =
      match;
    if (Number(localPort) === Number(port)) {
      matches.push({
        protocol,
        localHost,
        localPort: Number(localPort),
        remoteHost,
        remotePort: Number(remotePort),
        state,
        pid: Number(pid),
      });
    }
  }
  return matches;
}

export function parseTasklistCsvOutput(output) {
  const firstLine = output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) {
    return null;
  }
  const match = firstLine.match(/^"([^"]+)","(\d+)"/u);
  if (!match) {
    return null;
  }
  return {
    imageName: match[1],
    pid: Number(match[2]),
  };
}

export async function getPortOccupant(port) {
  try {
    const { stdout } = await execFile('netstat', ['-ano', '-p', 'TCP'], {
      windowsHide: true,
    });
    const entries = parseNetstatTcpOutput(stdout, port);
    if (!entries.length) {
      return null;
    }
    const entry = entries.find((current) => current.state === 'LISTENING') || entries[0];
    let processName = null;
    try {
      const { stdout: tasklistOutput } = await execFile(
        'tasklist',
        ['/FI', `PID eq ${entry.pid}`, '/FO', 'CSV', '/NH'],
        {
          windowsHide: true,
        },
      );
      processName = parseTasklistCsvOutput(tasklistOutput)?.imageName ?? null;
    } catch {
      processName = null;
    }
    return {
      ...entry,
      processName,
    };
  } catch {
    return null;
  }
}

export function isProcessAlive(pid) {
  if (!pid) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function checkUrlHealth(url, { timeoutMs = 2_000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    return {
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: error?.name === 'AbortError' ? 'timeout' : error?.message || 'request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function classifyRuntimeStatus({
  managedState,
  managedStateAlive,
  portOccupant,
  health,
  startedRecently = false,
}) {
  if (managedState) {
    if (!managedStateAlive) {
      return {
        status: 'stopped',
        reason: 'stale-managed-state',
      };
    }
    if (health?.ok) {
      return {
        status: 'healthy',
        reason: 'healthy-response',
      };
    }
    if (portOccupant && portOccupant.pid && managedState.pid && portOccupant.pid !== managedState.pid) {
      return {
        status: 'port-occupied-unmanaged',
        reason: 'port-taken-by-other-process',
      };
    }
    return {
      status: startedRecently ? 'starting' : 'unhealthy',
      reason: startedRecently ? 'waiting-for-healthy-response' : 'healthy-response-missing',
    };
  }

  if (portOccupant) {
    if (health?.ok) {
      return {
        status: 'healthy',
        reason: 'healthy-unmanaged-response',
      };
    }
    return {
      status: 'port-occupied-unmanaged',
      reason: 'occupied-by-unmanaged-process',
    };
  }

  return {
    status: 'stopped',
    reason: 'port-free',
  };
}

export async function inspectRuntime(target, {
  repoRoot = process.cwd(),
  stateFile = target.stateFile,
  healthTimeoutMs = RUNTIME_HEALTH_TIMEOUT_MS,
} = {}) {
  const managedState = target.managed && stateFile ? await readManagedRuntimeState(stateFile) : null;
  const managedStateAlive = managedState ? isProcessAlive(managedState.pid) : false;
  const portOccupant = await getPortOccupant(target.port);
  const health = await checkUrlHealth(target.url, {
    timeoutMs: healthTimeoutMs,
  });
  const startedRecently = Boolean(
    managedState?.startedAt &&
      Date.now() - new Date(managedState.startedAt).getTime() < 30_000,
  );
  const status = classifyRuntimeStatus({
    managedState,
    managedStateAlive,
    portOccupant,
    health,
    startedRecently,
  });

  return {
    id: target.id,
    label: target.label,
    port: target.port,
    host: target.host,
    url: target.url,
    managed: target.managed,
    stateFile,
    managedState,
    managedStateAlive,
    portOccupant,
    health,
    status: status.status,
    reason: status.reason,
    repoRoot,
  };
}

export function buildRuntimeSummaryLines(snapshot) {
  const lines = [];
  lines.push(`${snapshot.label}: ${snapshot.status}`);
  lines.push(`  URL: ${snapshot.url}`);
  lines.push(`  Port: ${snapshot.port}`);
  if (snapshot.managedState?.pid) {
    lines.push(`  Managed PID: ${snapshot.managedState.pid}`);
  }
  if (snapshot.portOccupant?.pid) {
    lines.push(
      `  Port occupant: PID ${snapshot.portOccupant.pid}${snapshot.portOccupant.processName ? ` (${snapshot.portOccupant.processName})` : ''}`,
    );
  }
  if (snapshot.managedState?.startedAt) {
    lines.push(`  Started: ${snapshot.managedState.startedAt}`);
  }
  if (snapshot.health?.status) {
    lines.push(`  Health: HTTP ${snapshot.health.status}`);
  } else if (snapshot.health?.error) {
    lines.push(`  Health: ${snapshot.health.error}`);
  }
  if (snapshot.reason) {
    lines.push(`  Note: ${snapshot.reason}`);
  }
  return lines;
}

export function buildDashboardText(snapshots, { config, envFileLabel } = {}) {
  const lines = [];
  lines.push('Boolean Practice local dev console');
  lines.push(`Host: ${config.host}`);
  lines.push(`Dev port: ${config.devPort}`);
  lines.push(`Preview port: ${config.previewPort}`);
  if (envFileLabel) {
    lines.push(`Supported env files: ${envFileLabel}`);
  }
  lines.push('');
  for (const snapshot of snapshots) {
    lines.push(...buildRuntimeSummaryLines(snapshot));
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

export function resolveNpmCommand(platform = process.platform) {
  return platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function buildPackageManagerInvocation(args = [], platform = process.platform) {
  if (platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/c', 'npm', ...args],
    };
  }

  return {
    command: resolveNpmCommand(platform),
    args,
  };
}

export function resolveTaskkillCommand() {
  return process.platform === 'win32' ? 'taskkill.exe' : 'kill';
}

export async function startManagedRuntime(target, {
  repoRoot = process.cwd(),
  env = process.env,
} = {}) {
  if (!target.managed) {
    throw new Error(`${target.label} is not a managed runtime.`);
  }
  await ensureLocalControlDirs(repoRoot);
  const { logDir } = getDevControlPaths(repoRoot);
  const logFile = resolve(
    logDir,
    `${target.id}-${formatClockLabel(new Date())}.log`,
  );
  const logStream = createWriteStream(logFile, { flags: 'a' });
  const invocation = buildPackageManagerInvocation(target.command.slice(1));
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: repoRoot,
      env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);
    child.once('spawn', async () => {
      try {
        const state = {
          pid: child.pid,
          startedAt: new Date().toISOString(),
          command: target.command.join(' '),
          port: target.port,
          url: target.url,
          logFile,
        };
        await writeManagedRuntimeState(target.stateFile, state);
        child.unref();
        resolvePromise({
          pid: child.pid,
          logFile,
          state,
        });
      } catch (error) {
        logStream.end();
        rejectPromise(error);
      }
    });
    child.once('error', async (error) => {
      logStream.end();
      await clearManagedRuntimeState(target.stateFile);
      rejectPromise(error);
    });
    child.on('exit', () => {
      logStream.end();
    });
  });
}

export async function stopManagedRuntime(target) {
  if (!target.managed) {
    throw new Error(`${target.label} is not a managed runtime.`);
  }
  const state = await readManagedRuntimeState(target.stateFile);
  if (!state?.pid) {
    return {
      stopped: false,
      reason: 'no-managed-state',
    };
  }
  if (isProcessAlive(state.pid)) {
    try {
      if (process.platform === 'win32') {
        try {
          await execFile(resolveTaskkillCommand(), ['/PID', String(state.pid), '/T'], {
            windowsHide: true,
          });
        } catch {
          await execFile(resolveTaskkillCommand(), ['/PID', String(state.pid), '/T', '/F'], {
            windowsHide: true,
          });
        }
      } else {
        process.kill(state.pid, 'SIGTERM');
      }
    } catch {
      // Ignore command errors and clean up the local state file either way.
    }
  }
  await clearManagedRuntimeState(target.stateFile);
  return {
    stopped: true,
    pid: state.pid,
  };
}

export async function openUrlInBrowser(url) {
  if (process.platform === 'win32') {
    const child = spawn('cmd.exe', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
    return;
  }
  if (process.platform === 'darwin') {
    return execFile('open', [url], { windowsHide: true });
  }
  return execFile('xdg-open', [url], { windowsHide: true });
}

export async function runPackageScript(scriptName, args = [], { repoRoot = process.cwd(), env = process.env } = {}) {
  const invocation = buildPackageManagerInvocation(['run', scriptName, ...args]);
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: repoRoot,
      env,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.on('close', (code, signal) => {
      resolvePromise({ code, signal });
    });
    child.on('error', rejectPromise);
  });
}

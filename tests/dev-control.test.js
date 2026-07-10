import { mkdtemp, writeFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildDashboardText,
  buildPackageScriptInvocation,
  buildPackageManagerInvocation,
  buildRuntimeTargets,
  buildUiTourCaptureArgs,
  classifyRuntimeStatus,
  formatProcessInvocation,
  loadRepoLocalEnv,
  parseEnvFileContents,
  parseNetstatTcpOutput,
  resolveConsoleConfig,
  runPackageScript,
} from '../scripts/lib/dev-control.js';
import { CONSOLE_MENU } from '../scripts/dev/control-console.js';

describe('dev control helpers', () => {
  it('parses repo-local env file contents', () => {
    const values = parseEnvFileContents(`
      # comment
      export BOOLEAN_PRACTICE_DEV_PORT="5177"
      BOOLEAN_PRACTICE_PREVIEW_PORT='4173'
      BOOLEAN_PRACTICE_HOST=127.0.0.1
    `);

    expect(values).toEqual({
      BOOLEAN_PRACTICE_DEV_PORT: '5177',
      BOOLEAN_PRACTICE_PREVIEW_PORT: '4173',
      BOOLEAN_PRACTICE_HOST: '127.0.0.1',
    });
  });

  it('loads .env and .env.local with local overrides', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'boolean-practice-dev-control-'));
    await writeFile(join(repoRoot, '.env'), 'BOOLEAN_PRACTICE_DEV_PORT=5176\n', 'utf8');
    await writeFile(
      join(repoRoot, '.env.local'),
      'BOOLEAN_PRACTICE_DEV_PORT=5177\nBOOLEAN_PRACTICE_HOST=127.0.0.1\n',
      'utf8',
    );

    const env = await loadRepoLocalEnv(repoRoot);

    expect(env.BOOLEAN_PRACTICE_DEV_PORT).toBe('5177');
    expect(env.BOOLEAN_PRACTICE_HOST).toBe('127.0.0.1');
  });

  it('resolves default console ports and runtime targets', () => {
    const config = resolveConsoleConfig({});
    const targets = buildRuntimeTargets(config);

    expect(config.devPort).toBe(5177);
    expect(config.previewPort).toBe(4173);
    expect(targets[0].url).toBe('http://127.0.0.1:5177/');
    expect(targets[1].url).toBe('http://127.0.0.1:4173/');
  });

  it('parses netstat output for the configured port', () => {
    const entries = parseNetstatTcpOutput(
      `
Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    127.0.0.1:5177         0.0.0.0:0              LISTENING       12345
  TCP    127.0.0.1:4173         0.0.0.0:0              LISTENING       67890
      `,
      5177,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      localPort: 5177,
      pid: 12345,
      state: 'LISTENING',
    });
  });

  it('classifies managed and unmanaged runtime states', () => {
    expect(
      classifyRuntimeStatus({
        managedState: { pid: 1001, startedAt: new Date().toISOString() },
        managedStateAlive: true,
        portOccupant: { pid: 1001 },
        health: { ok: true, status: 200 },
      }),
    ).toMatchObject({ status: 'healthy' });

    expect(
      classifyRuntimeStatus({
        managedState: { pid: 1002, startedAt: new Date().toISOString() },
        managedStateAlive: true,
        portOccupant: { pid: 1002 },
        health: { ok: false, status: 503 },
        startedRecently: true,
      }),
    ).toMatchObject({ status: 'starting' });

    expect(
      classifyRuntimeStatus({
        managedState: null,
        managedStateAlive: false,
        portOccupant: { pid: 2001 },
        health: { ok: false, status: 0 },
      }),
    ).toMatchObject({ status: 'port-occupied-unmanaged' });

    expect(
      classifyRuntimeStatus({
        managedState: null,
        managedStateAlive: false,
        portOccupant: null,
        health: { ok: false, status: 0 },
      }),
    ).toMatchObject({ status: 'stopped' });
  });

  it('formats a readable dashboard summary', () => {
    const text = buildDashboardText(
      [
        {
          label: 'Dev server',
          status: 'healthy',
          url: 'http://127.0.0.1:5177/',
          port: 5177,
          managedState: { pid: 12345, startedAt: '2026-05-06T12:00:00.000Z' },
          health: { ok: true, status: 200 },
          reason: 'healthy-response',
        },
      ],
      {
        config: { host: '127.0.0.1', devPort: 5177, previewPort: 4173 },
        envFileLabel: '.env, .env.local',
      },
    );

    expect(text).toContain('Boolean Practice local dev console');
    expect(text).toContain('Dev port: 5177');
    expect(text).toContain('healthy');
    expect(text).toContain('healthy-response');
  });

  it('builds a windows-safe package manager invocation', () => {
    expect(buildPackageManagerInvocation(['run', 'test'], 'win32')).toEqual({
      command: 'cmd.exe',
      args: ['/c', 'npm', 'run', 'test'],
    });

    expect(buildPackageManagerInvocation(['run', 'test'], 'linux')).toEqual({
      command: 'npm',
      args: ['run', 'test'],
    });
  });

  it('keeps the displayed package command tied to the executed invocation', () => {
    const invocation = buildPackageScriptInvocation('capture:ui-tour', ['--target', 'preview'], 'win32');

    expect(invocation).toEqual({
      command: 'cmd.exe',
      args: ['/c', 'npm', 'run', 'capture:ui-tour', '--', '--target', 'preview'],
    });
    expect(formatProcessInvocation(invocation)).toBe(
      'cmd.exe /c npm run capture:ui-tour -- --target preview',
    );
  });

  it('reports a launch error separately from a nonzero child exit', async () => {
    const launchError = Object.assign(new Error('spawn failed'), { code: 'EINVAL' });
    const launchResult = await runPackageScript('test', [], {
      spawnImpl: () => {
        throw launchError;
      },
    });

    expect(launchResult.ok).toBe(false);
    expect(launchResult.launchError).toBe(launchError);
    expect(launchResult.code).toBeNull();

    const child = new EventEmitter();
    const exitResultPromise = runPackageScript('test', [], {
      spawnImpl: () => {
        queueMicrotask(() => child.emit('close', 2, null));
        return child;
      },
    });
    const exitResult = await exitResultPromise;

    expect(exitResult.ok).toBe(false);
    expect(exitResult.launchError).toBeNull();
    expect(exitResult.code).toBe(2);
  });

  it('exposes the grouped human-facing console menu', () => {
    expect(CONSOLE_MENU).toEqual([
      { key: '1', label: 'Local dev server' },
      { key: '2', label: 'Tests and validation' },
      { key: '3', label: 'Builds and previews' },
      { key: '4', label: 'UI review workflows' },
      { key: '5', label: 'Packet status' },
      { key: '6', label: 'Advanced scripts and config' },
      { key: '7', label: 'Exit' },
    ]);
  });

  it('builds capture command arguments for the ui tour workflow', () => {
    expect(
      buildUiTourCaptureArgs({
        tours: ['truth-table', 'venn'],
        viewports: ['desktop', 'mobile'],
        target: 'dev',
        outputRoot: 'local/ui-reviews/custom',
      }),
    ).toEqual([
      '--tour',
      'truth-table,venn',
      '--viewports',
      'desktop,mobile',
      '--target',
      'dev',
      '--output-root',
      'local/ui-reviews/custom',
    ]);

    expect(buildUiTourCaptureArgs({ listTours: true })).toEqual(['--list-tours']);
  });
});

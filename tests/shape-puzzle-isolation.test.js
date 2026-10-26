// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const manifestPath = resolve(repoRoot, 'dist/.vite/manifest.json');

async function getOrBuildManifest() {
  if (!existsSync(manifestPath)) {
    await build({
      configFile: resolve(repoRoot, 'vite.config.js'),
    });
  }
  const raw = readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw);
}

describe('Shape Puzzle Page Build Isolation (GATE-39A)', () => {
  it('manifest contains distinct entries for main and puzzle', async () => {
    const manifest = await getOrBuildManifest();

    expect(manifest['index.html']).toBeDefined();
    expect(manifest['puzzle.html']).toBeDefined();

    const mainEntry = manifest['index.html'];
    const puzzleEntry = manifest['puzzle.html'];

    expect(puzzleEntry.file).not.toEqual(mainEntry.file);
  });

  it('puzzle.html chunk graph is completely isolated from the AP CSA app', async () => {
    const manifest = await getOrBuildManifest();
    const puzzleEntry = manifest['puzzle.html'];
    const mainEntry = manifest['index.html'];

    // Collect all transitive chunks imported by puzzle.html
    const visitedChunks = new Set();
    const queue = [...(puzzleEntry.imports || [])];

    while (queue.length > 0) {
      const chunkKey = queue.shift();
      if (visitedChunks.has(chunkKey)) continue;
      visitedChunks.add(chunkKey);

      const chunkDef = manifest[chunkKey];
      if (chunkDef?.imports) {
        queue.push(...chunkDef.imports);
      }
    }

    // Main app's entry chunk must not be in puzzle.html's chunk graph
    expect(visitedChunks.has(mainEntry.file)).toBe(false);

    // Collect all JS file paths in puzzle.html's graph
    const puzzleFiles = [puzzleEntry.file];
    for (const chunkKey of visitedChunks) {
      const chunkDef = manifest[chunkKey];
      if (chunkDef?.file) {
        puzzleFiles.push(chunkDef.file);
      }
    }

    // Verify CSS isolation: puzzle.html must not load main app CSS
    const puzzleCss = puzzleEntry.css || [];
    const mainCss = mainEntry.css || [];
    for (const cssFile of puzzleCss) {
      expect(mainCss).not.toContain(cssFile);
    }

    // Read file contents of all puzzle JS chunks and verify AP CSA modules are absent
    for (const relFile of puzzleFiles) {
      const fullPath = resolve(repoRoot, 'dist', relFile);
      expect(existsSync(fullPath)).toBe(true);
      const code = readFileSync(fullPath, 'utf8');

      // None of the AP CSA specific component names or tokens should appear
      expect(code).not.toContain('AssignmentPractice');
      expect(code).not.toContain('ProblemReviewSummary');
      expect(code).not.toContain('EquivalencePractice');
      expect(code).not.toContain('SimplificationPractice');
      expect(code).not.toContain('VennPractice');
      expect(code).not.toContain('ui/App.vue');
    }
  });

  it('proves dev-only admin.html is completely absent from dist/ and gas-dist/ (Plan 41)', async () => {
    // Rebuild static build to ensure fresh output
    await build({
      configFile: resolve(repoRoot, 'vite.config.js'),
    });

    const manifest = await getOrBuildManifest();

    // 1. admin.html must not be in the Vite manifest
    expect(manifest['admin.html']).toBeUndefined();
    for (const key of Object.keys(manifest)) {
      expect(key).not.toContain('admin.html');
      expect(key).not.toContain('admin-main');
    }

    // 2. dist/ must not contain admin.html or any admin chunks
    expect(existsSync(resolve(repoRoot, 'dist/admin.html'))).toBe(false);

    // 3. gas-dist/ must not contain admin.html
    expect(existsSync(resolve(repoRoot, 'gas-dist/admin.html'))).toBe(false);
    expect(existsSync(resolve(repoRoot, 'gas-dist/Admin.html'))).toBe(false);

    // 4. Puzzle entry chunks must not include usage-admin components or admin copy
    const puzzleEntry = manifest['puzzle.html'];
    expect(puzzleEntry).toBeDefined();

    const visitedChunks = new Set();
    const queue = [...(puzzleEntry.imports || [])];
    while (queue.length > 0) {
      const chunkKey = queue.shift();
      if (visitedChunks.has(chunkKey)) continue;
      visitedChunks.add(chunkKey);
      const chunkDef = manifest[chunkKey];
      if (chunkDef?.imports) queue.push(...chunkDef.imports);
    }

    const puzzleFiles = [puzzleEntry.file];
    for (const chunkKey of visitedChunks) {
      const chunkDef = manifest[chunkKey];
      if (chunkDef?.file) puzzleFiles.push(chunkDef.file);
    }

    for (const relFile of puzzleFiles) {
      const fullPath = resolve(repoRoot, 'dist', relFile);
      expect(existsSync(fullPath)).toBe(true);
      const code = readFileSync(fullPath, 'utf8');

      expect(code).not.toContain('AdminApp');
      expect(code).not.toContain('usage-admin');
      expect(code).not.toContain('Student Usage Review');
      expect(code).not.toContain('Honest limit');
    }
  });
});

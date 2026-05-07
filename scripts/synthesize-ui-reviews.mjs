import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { findLatestCaptureFolder, synthesizeUiReviews } from './lib/ui-review-synthesis.js';

const args = parseArgs(process.argv.slice(2));
const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const captureFolder = args.capture
  ? resolve(repoRoot, args.capture)
  : await findLatestCaptureFolder(args.captureRoot ? resolve(repoRoot, args.captureRoot) : undefined);

if (!captureFolder) {
  console.error('No capture folder found. Run npm run capture:ui-tour first or pass --capture <folder>.');
  process.exitCode = 1;
} else {
  const result = await synthesizeUiReviews({
    captureFolder,
    captureRoot: args.captureRoot ? resolve(repoRoot, args.captureRoot) : undefined,
  });

  console.log(`Synthesized UI reviews for: ${result.captureFolder}`);
  console.log(`Synthesis folder: ${result.synthesisFolder}`);
  console.log(`Reviewers: ${result.reviewers.length ? result.reviewers.join(', ') : 'none'}`);
  console.log(`Findings: ${result.findings.length}`);
  if (result.skippedReviewFolders.length) {
    console.log('Skipped review folders:');
    for (const skipped of result.skippedReviewFolders) {
      console.log(`- ${skipped.folderName}: ${skipped.reason}`);
    }
  }
}

function parseArgs(argv) {
  const parsed = {
    capture: '',
    captureRoot: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--capture') {
      parsed.capture = argv[index + 1] ?? '';
      index += 1;
      continue;
    }
    if (arg.startsWith('--capture=')) {
      parsed.capture = arg.slice('--capture='.length);
      continue;
    }
    if (arg === '--capture-root') {
      parsed.captureRoot = argv[index + 1] ?? '';
      index += 1;
      continue;
    }
    if (arg.startsWith('--capture-root=')) {
      parsed.captureRoot = arg.slice('--capture-root='.length);
    }
  }

  return parsed;
}

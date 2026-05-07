import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildSynthesisCommandArgs,
  findLatestCaptureFolder,
  synthesizeUiReviews,
} from '../scripts/lib/ui-review-synthesis.js';

async function writeFixtureCapture(root) {
  const olderCapture = join(root, '2026-05-06T16-36-57');
  const newerCapture = join(root, '2026-05-06T16-38-45');
  await mkdir(olderCapture, { recursive: true });
  await mkdir(newerCapture, { recursive: true });
  await writeFile(
    join(olderCapture, 'manifest.json'),
    JSON.stringify({ captureDateTime: '2026-05-06T16-36-57', screenshots: [] }, null, 2),
    'utf8',
  );
  await writeFile(
    join(newerCapture, 'manifest.json'),
    JSON.stringify({ captureDateTime: '2026-05-06T16-38-45', screenshots: [] }, null, 2),
    'utf8',
  );

  const reviews = join(newerCapture, 'reviews');
  await mkdir(reviews, { recursive: true });
  await mkdir(join(reviews, 'reviewer-a'), { recursive: true });
  await mkdir(join(reviews, 'reviewer-b'), { recursive: true });
  await mkdir(join(reviews, 'reviewer-c'), { recursive: true });
  await mkdir(join(reviews, 'reviewer-empty'), { recursive: true });

  const sharedFinding = {
    title: 'Mode transition unclear',
    category: 'transitions/state changes',
    severity: 'medium',
    confidence: 'high',
    affectedScreenshots: ['001'],
    affectedTours: ['truth-table'],
    evidenceSummary: 'The mode change is visually easy to miss.',
    likelyUserImpact: 'Students may not notice that the active practice mode changed.',
    suggestedFixDirection: 'Add a stronger transition cue near the mode selector.',
    needsInteractiveConfirmation: true,
  };

  await writeFile(
    join(reviews, 'reviewer-a', 'findings.json'),
    JSON.stringify({
      findings: [
        sharedFinding,
        {
          title: 'Instruction text too dense',
          category: 'over-explanation',
          severity: 'low',
          confidence: 'medium',
          affectedScreenshots: ['002'],
          affectedTours: ['truth-table'],
          evidenceSummary: 'Several sentences repeat the same guidance.',
          likelyUserImpact: 'Students may skim past the instruction block.',
          suggestedFixDirection: 'Trim repeated text and use a visual cue instead.',
        },
      ],
    }, null, 2),
    'utf8',
  );

  await writeFile(
    join(reviews, 'reviewer-b', 'observations.json'),
    JSON.stringify({
      findings: [
        {
          ...sharedFinding,
          severity: 'high',
          confidence: 'medium',
          evidenceSummary: 'The step change is still subtle when scanning quickly.',
        },
      ],
    }, null, 2),
    'utf8',
  );

  await writeFile(
    join(reviews, 'reviewer-c', 'notes.md'),
    '# Notes\n\nThe layout looks coherent, but the mode switch deserves a stronger cue.\n',
    'utf8',
  );

  await writeFile(
    join(reviews, 'reviewer-c', 'summary.markdown'),
    '## Observation\n\n- title: Extra spacing feels heavy\n- category: spacing/layout\n- severity: low\n- confidence: low\n- affected screenshots: 002\n- likely user impact: Students may scroll more than needed.\n- suggested fix direction: Tighten the vertical rhythm near the controls.\n',
    'utf8',
  );

  return newerCapture;
}

describe('ui review synthesis workflow', () => {
  it('finds the latest capture folder and builds command args', async () => {
    const root = await mkdtemp(join(tmpdir(), 'boolean-practice-synthesis-'));
    await writeFixtureCapture(root);

    await mkdir(join(root, 'synthesis'), { recursive: true });

    expect(await findLatestCaptureFolder(root)).toBe(join(root, '2026-05-06T16-38-45'));
    expect(buildSynthesisCommandArgs('local/ui-reviews/2026-05-06T16-38-45')).toEqual([
      '--capture',
      'local/ui-reviews/2026-05-06T16-38-45',
    ]);
  });

  it('synthesizes grouped findings without modifying raw reviews', async () => {
    const root = await mkdtemp(join(tmpdir(), 'boolean-practice-synthesis-'));
    const captureFolder = await writeFixtureCapture(root);

    const result = await synthesizeUiReviews({ captureFolder });

    expect(result.captureFolder).toBe(captureFolder);
    expect(result.reviewers).toEqual(['reviewer-a', 'reviewer-b', 'reviewer-c']);
    expect(result.skippedReviewFolders).toEqual([
      expect.objectContaining({ folderName: 'reviewer-empty' }),
    ]);
    expect(result.findings).toHaveLength(3);
    expect(result.findings[0]).toMatchObject({
      title: 'Mode transition unclear',
      category: 'transitions/state changes',
      repeatCount: 2,
      contradiction: true,
      severity: 'high',
      confidence: 'high',
      affectedScreenshots: ['001'],
      affectedTours: ['truth-table'],
    });
    expect(result.findings.some((finding) => finding.title === 'Extra spacing feels heavy')).toBe(
      true,
    );

    const synthesisFolder = join(captureFolder, 'synthesis');
    const summary = await readFile(join(synthesisFolder, 'summary.md'), 'utf8');
    const prioritized = await readFile(join(synthesisFolder, 'prioritized-findings.md'), 'utf8');
    const findingIndex = JSON.parse(await readFile(join(synthesisFolder, 'finding-index.json'), 'utf8'));
    const proposed = await readFile(join(synthesisFolder, 'proposed-fix-packets.md'), 'utf8');

    expect(summary).toContain('Capture folder:');
    expect(summary).toContain('reviewer-a, reviewer-b, reviewer-c');
    expect(summary).toContain('reviewer-empty');
    expect(prioritized).toContain('Mode transition unclear');
    expect(prioritized).toContain('Repeat count: 2');
    expect(findingIndex.findings).toHaveLength(3);
    expect(findingIndex.findings[0]).toMatchObject({
      title: 'Mode transition unclear',
      repeatCount: 2,
      contradiction: true,
    });
    expect(proposed).toContain('Mode transition unclear');
    expect(await readFile(join(captureFolder, 'reviews', 'reviewer-a', 'findings.json'), 'utf8')).toContain('Mode transition unclear');
  });
});

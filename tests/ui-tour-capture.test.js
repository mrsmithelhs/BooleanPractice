import { describe, expect, it } from 'vitest';
import {
  buildCaptureRunId,
  buildManifest,
  buildReviewStartingPrompt,
  buildTourMarkdown,
  buildSynthesisStartingPrompt,
  getUiTourDefinitions,
  normalizeTourSelection,
  normalizeViewportSelection,
} from '../scripts/lib/ui-tour-capture.js';

describe('ui tour capture workflow', () => {
  it('formats a filesystem-safe timestamp for capture folders', () => {
    expect(buildCaptureRunId(new Date('2026-05-06T15:42:11'))).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/,
    );
  });

  it('keeps starter tours and viewport variants declarative', () => {
    const tours = getUiTourDefinitions();
    const ids = tours.map((tour) => tour.id);

    expect(ids).toEqual([
      'truth-table',
      'venn',
      'equivalence',
      'simplification',
      'predicate-atoms',
      'gas-submission',
    ]);

    expect(tours.find((tour) => tour.id === 'truth-table').defaultViewports).toEqual([
      'desktop',
      'mobile',
      'projector',
    ]);
    expect(tours.find((tour) => tour.id === 'equivalence').defaultViewports).toEqual(['desktop']);
  });

  it('filters requested tours and viewports without widening scope', () => {
    const tours = getUiTourDefinitions();

    expect(normalizeTourSelection(['venn', 'missing'], tours).map((tour) => tour.id)).toEqual([
      'venn',
    ]);
    expect(normalizeTourSelection([], tours).map((tour) => tour.id)).toEqual([
      'truth-table',
      'venn',
      'equivalence',
      'simplification',
      'predicate-atoms',
      'gas-submission',
    ]);
    expect(normalizeViewportSelection(['mobile', 'projector'])).toEqual(['mobile', 'projector']);
    expect(normalizeViewportSelection(['bogus'])).toEqual(['desktop', 'mobile']);
  });

  it('renders the tour guide and blind-review prompt from manifest data', () => {
    const manifest = buildManifest({
      projectName: 'Boolean Practice',
      captureDateTime: '2026-05-06T15-42-11',
      appVersion: '0.1.0',
      commitSha: 'abc1234',
      captureCommand: 'npm run capture:ui-tour -- --tour truth-table',
      appTarget: 'preview',
      appUrl: 'http://127.0.0.1:4173',
      outputFolder: 'local/ui-reviews/2026-05-06T15-42-11',
      viewports: [{ id: 'desktop', label: 'Desktop/Laptop', width: 1440, height: 900 }],
      tours: [
        {
          id: 'truth-table',
          title: 'Truth Table Practice',
          description: 'A three-variable truth-table story.',
          viewports: [{ id: 'desktop', label: 'Desktop/Laptop' }],
          recordId: 'tt-09-three-variable-venn',
          recordTitle: 'Three-Variable Venn Practice',
        },
      ],
      screenshots: [
        {
          id: '001',
          filename: '001-truth-table-default-desktop.png',
          tourId: 'truth-table',
          tourTitle: 'Truth Table Practice',
          viewportId: 'desktop',
          viewportLabel: 'Desktop/Laptop',
          description: 'Initial page load.',
          interactionState: 'default',
          route: 'http://127.0.0.1:4173',
        },
      ],
    });

    const guide = buildTourMarkdown(manifest);
    const prompt = buildReviewStartingPrompt(manifest);
    const synthesisPrompt = buildSynthesisStartingPrompt(manifest);

    expect(guide).toContain('# Boolean Practice UI Tour Capture');
    expect(guide).toContain('Truth Table Practice');
    expect(guide).toContain('001-truth-table-default-desktop.png');
    expect(guide).toContain('Initial page load.');
    expect(prompt).toContain('deep experience reviewing data-driven educational web apps');
    expect(prompt).toContain('Do not inspect the codebase');
    expect(prompt).toContain('Capture folder: `local/ui-reviews/2026-05-06T15-42-11`');
    expect(prompt).toContain('Review subfolders: `local/ui-reviews/2026-05-06T15-42-11/reviews/`');
    expect(prompt).toContain('ignore review subfolders created by other agents');
    expect(prompt).toContain(
      'create a unique subfolder under `local/ui-reviews/2026-05-06T15-42-11/reviews/`',
    );
    expect(prompt).toContain('confusing UI, overwhelming UI, missing but expected UI elements');
    expect(prompt).toContain('severity: blocker, high, medium, or low');
    expect(prompt).toContain('affected screenshot numbers');
    expect(prompt).toContain('suggested fix direction');
    expect(synthesisPrompt).toContain('senior UI review synthesizer');
    expect(synthesisPrompt).toContain('implementation-ready handoff');
    expect(synthesisPrompt).toContain('Capture folder: `local/ui-reviews/2026-05-06T15-42-11`');
    expect(synthesisPrompt).toContain('Review subfolders: `local/ui-reviews/2026-05-06T15-42-11/reviews/`');
    expect(synthesisPrompt).toContain('proposed-fix-packets.md');
    expect(synthesisPrompt).toContain('Preserve reviewer disagreement');
  });
});

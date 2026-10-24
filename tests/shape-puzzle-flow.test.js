import { describe, expect, it } from 'vitest';
import { parsePuzzleUrl, buildPuzzleUrl } from '@/components/shape-puzzles/url.js';
import { getSheetMode } from '@/components/shape-puzzles/modes.js';
import {
  buildShapePuzzleShadeOnlyHint,
  buildShapePuzzleTableHint,
  buildTruthTableHint,
  getHintStage,
} from '@/components/shape-puzzles/feedback.js';
import { SET_SHAPES_1 } from '@shared/shape-puzzles/sets/shapes-1.js';
import { parseBooleanExpression } from '@shared/parser/index.js';

describe('Shape Puzzle Flow & Helpers', () => {
  describe('Mode Alternation & Defaults (modes.js)', () => {
    it('defaults to table for even indices (sheets 1 and 3) and shade for odd indices (sheets 2 and 4)', () => {
      expect(getSheetMode(0, null)).toBe('table'); // Sheet 1
      expect(getSheetMode(1, null)).toBe('shade'); // Sheet 2
      expect(getSheetMode(2, null)).toBe('table'); // Sheet 3
      expect(getSheetMode(3, null)).toBe('shade'); // Sheet 4
    });

    it('honors valid mode overrides regardless of sheet index', () => {
      expect(getSheetMode(0, 'shade')).toBe('shade');
      expect(getSheetMode(1, 'table')).toBe('table');
      expect(getSheetMode(2, 'shade')).toBe('shade');
      expect(getSheetMode(3, 'table')).toBe('table');
    });

    it('falls back to default alternation when override is invalid', () => {
      expect(getSheetMode(0, 'bogus')).toBe('table');
      expect(getSheetMode(1, 'invalid')).toBe('shade');
    });
  });

  describe('URL Contract & Mode Handling', () => {
    it('defaults to shapes-1 sheet 1 student mode when query is empty', () => {
      const res = parsePuzzleUrl('');
      expect(res.isValid).toBe(true);
      expect(res.setId).toBe('shapes-1');
      expect(res.sheetNumber).toBe(1);
      expect(res.mode).toBe('table');
      expect(res.modeOverride).toBe(null);
      expect(res.modeWarning).toBe(null);
      expect(res.isTeacher).toBe(false);
      expect(res.sheet.id).toBe(SET_SHAPES_1.sheets[0].id);
    });

    it('parses valid sheet number and teacher flag', () => {
      const res = parsePuzzleUrl('?set=shapes-1&sheet=3&teacher=1');
      expect(res.isValid).toBe(true);
      expect(res.sheetNumber).toBe(3);
      expect(res.mode).toBe('table');
      expect(res.isTeacher).toBe(true);
      expect(res.sheet.id).toBe(SET_SHAPES_1.sheets[2].id);
    });

    it('parses mode parameter when provided', () => {
      const res1 = parsePuzzleUrl('?set=shapes-1&sheet=1&mode=shade');
      expect(res1.isValid).toBe(true);
      expect(res1.mode).toBe('shade');
      expect(res1.modeOverride).toBe('shade');
      expect(res1.modeWarning).toBe(null);

      const res2 = parsePuzzleUrl('?set=shapes-1&sheet=2&mode=table');
      expect(res2.isValid).toBe(true);
      expect(res2.mode).toBe('table');
      expect(res2.modeOverride).toBe('table');
    });

    it('falls back with a warning when mode is unknown', () => {
      const res = parsePuzzleUrl('?set=shapes-1&sheet=1&mode=bogus');
      expect(res.isValid).toBe(true);
      expect(res.mode).toBe('table'); // fallback to sheet 1 default
      expect(res.modeOverride).toBe(null);
      expect(res.modeWarning).toContain('Unknown mode "bogus"');
    });

    it('returns error on unknown set', () => {
      const res = parsePuzzleUrl('?set=circuits-2&sheet=1');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Unknown puzzle set "circuits-2"');
    });

    it('returns error on out-of-range sheet', () => {
      const res = parsePuzzleUrl('?set=shapes-1&sheet=99');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Sheet "99" not found');
    });

    it('builds puzzle URL preserving mode only when explicitly provided', () => {
      expect(buildPuzzleUrl({ setId: 'shapes-1', sheetNumber: 2, isTeacher: false })).toBe(
        '?set=shapes-1&sheet=2',
      );
      expect(
        buildPuzzleUrl({ setId: 'shapes-1', sheetNumber: 2, isTeacher: false, mode: 'table' }),
      ).toBe('?set=shapes-1&sheet=2&mode=table');
      expect(buildPuzzleUrl({ setId: 'shapes-1', sheetNumber: 4, isTeacher: true })).toBe(
        '?set=shapes-1&sheet=4&teacher=1',
      );
    });
  });

  describe('Truth Table Hint Ladder', () => {
    const sheet = SET_SHAPES_1.sheets[0]; // Sun: a && !b
    const ast = parseBooleanExpression(sheet.expression);
    const step = { label: 'A AND NOT(B)', node: ast };
    const row = { assignment: { A: true, B: true } };

    it('returns neutral hint on attempt 1', () => {
      const hint = buildTruthTableHint({
        attemptCount: 1,
        step,
        row,
        isBlank: false,
      });
      expect(getHintStage(1)).toBe('neutral');
      expect(hint).toContain('does not match yet');
    });

    it('returns guided operator hint on attempt 2', () => {
      const hint = buildTruthTableHint({
        attemptCount: 2,
        step,
        row,
        isBlank: false,
      });
      expect(getHintStage(2)).toBe('guided');
      expect(hint).toContain('AND operator');
    });

    it('returns specific row hint on attempt 3+', () => {
      const hint = buildTruthTableHint({
        attemptCount: 3,
        step,
        row,
        isBlank: false,
      });
      expect(getHintStage(3)).toBe('specific');
      expect(hint).toContain('A=T, B=T');
    });
  });

  describe('Shade-Only Hint Ladder (Repair 02 / M3)', () => {
    const sheet = SET_SHAPES_1.sheets[1]; // Gem: a && b (slot 1 cand B)

    it('contains neither "table" nor "row" in any hint stage', () => {
      const h1 = buildShapePuzzleShadeOnlyHint({
        attemptCount: 1,
        sheet,
        missedRegionIds: [3],
        extraRegionIds: [],
      });
      expect(h1.toLowerCase()).not.toContain('table');
      expect(h1.toLowerCase()).not.toContain('row');
      expect(h1).toContain('For each region, decide whether it is inside or outside');

      const h2 = buildShapePuzzleShadeOnlyHint({
        attemptCount: 2,
        sheet,
        missedRegionIds: [3],
        extraRegionIds: [],
      });
      expect(h2.toLowerCase()).not.toContain('table');
      expect(h2.toLowerCase()).not.toContain('row');
      expect(h2).toContain('AND operator requires');

      const h3Missed = buildShapePuzzleShadeOnlyHint({
        attemptCount: 3,
        sheet,
        missedRegionIds: [3],
        extraRegionIds: [],
      });
      expect(h3Missed.toLowerCase()).not.toContain('table');
      expect(h3Missed.toLowerCase()).not.toContain('row');
      expect(h3Missed).toContain('The region inside Shape A and Shape B makes the expression TRUE');

      const h3Extra = buildShapePuzzleShadeOnlyHint({
        attemptCount: 3,
        sheet,
        missedRegionIds: [],
        extraRegionIds: [0],
      });
      expect(h3Extra.toLowerCase()).not.toContain('table');
      expect(h3Extra.toLowerCase()).not.toContain('row');
      expect(h3Extra).toContain('The region outside all shapes makes the expression FALSE');
    });
  });
});

describe('shape puzzle table hint wrapper', () => {
  const step = { label: 'A AND NOT(B)', node: parseBooleanExpression('a && !b') };
  const row = { assignment: { A: true, B: true } };

  it('first-stage hints address the whole column, not a current row', () => {
    const wrong = buildShapePuzzleTableHint({ attemptCount: 1, step, row, isBlank: false });
    const blank = buildShapePuzzleTableHint({ attemptCount: 1, step, row, isBlank: true });
    expect(wrong).toContain('do not match yet');
    expect(blank).toContain('still blank');
    for (const hint of [wrong, blank]) {
      expect(hint).not.toContain('current row');
    }
  });

  it('later stages reuse the shared truth-table hint unchanged', () => {
    for (const attemptCount of [2, 3]) {
      expect(buildShapePuzzleTableHint({ attemptCount, step, row })).toBe(
        buildTruthTableHint({ attemptCount, step, row }),
      );
    }
  });
});

import { describe, expect, it } from 'vitest';
import { parsePuzzleUrl, buildPuzzleUrl } from '@/components/shape-puzzles/url.js';
import {
  buildShapePuzzleShadingHint,
  buildTruthTableHint,
  getHintStage,
} from '@/components/shape-puzzles/feedback.js';
import { SET_SHAPES_1 } from '@shared/shape-puzzles/sets/shapes-1.js';
import { parseBooleanExpression } from '@shared/parser/index.js';

describe('Shape Puzzle Flow & Helpers', () => {
  describe('URL Contract', () => {
    it('defaults to shapes-1 sheet 1 student mode when query is empty', () => {
      const res = parsePuzzleUrl('');
      expect(res.isValid).toBe(true);
      expect(res.setId).toBe('shapes-1');
      expect(res.sheetNumber).toBe(1);
      expect(res.isTeacher).toBe(false);
      expect(res.sheet.id).toBe(SET_SHAPES_1.sheets[0].id);
    });

    it('parses valid sheet number and teacher flag', () => {
      const res = parsePuzzleUrl('?set=shapes-1&sheet=3&teacher=1');
      expect(res.isValid).toBe(true);
      expect(res.sheetNumber).toBe(3);
      expect(res.isTeacher).toBe(true);
      expect(res.sheet.id).toBe(SET_SHAPES_1.sheets[2].id);
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

    it('builds puzzle URL correctly', () => {
      expect(buildPuzzleUrl({ setId: 'shapes-1', sheetNumber: 2, isTeacher: false })).toBe(
        '?set=shapes-1&sheet=2',
      );
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

  describe('Shading Hint Ladder', () => {
    const sheet = SET_SHAPES_1.sheets[0]; // intendedTrueRows: [2]

    it('progresses through neutral -> guided -> specific', () => {
      const h1 = buildShapePuzzleShadingHint({
        attemptCount: 1,
        sheet,
        missedRegionIds: [2],
        extraRegionIds: [],
      });
      expect(h1).toContain('Recheck which rows are TRUE');

      const h2 = buildShapePuzzleShadingHint({
        attemptCount: 2,
        sheet,
        missedRegionIds: [2],
        extraRegionIds: [],
      });
      expect(h2).toContain('AND operator requires');

      const h3 = buildShapePuzzleShadingHint({
        attemptCount: 3,
        sheet,
        missedRegionIds: [2],
        extraRegionIds: [],
      });
      expect(h3).toContain('Row 3 is TRUE');
      expect(h3).toContain('inside Shape A');
    });
  });
});

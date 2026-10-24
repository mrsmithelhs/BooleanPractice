import { describe, expect, it } from 'vitest';
import { validateSheet } from '../src/shape-puzzles/validator.js';
import { SET_SHAPES_2 } from '../src/shape-puzzles/sets/shapes-2.js';
import { computeSheetGiveaway } from '../src/shape-puzzles/giveaway.js';

describe('shapes-2 set validator and giveaway', () => {
  it('validates every sheet and candidate in shapes-2', () => {
    const allCandidates = Object.values(SET_SHAPES_2.slots).flat();
    expect(allCandidates.length).toBe(16);

    for (const cand of allCandidates) {
      const result = validateSheet(cand);
      expect(result.valid, `Sheet ${cand.id} failed: ${result.errors.join('; ')}`).toBe(true);
      expect(result.metrics.independentCheckPasses).toBe(true);
      expect(result.metrics.evaluatorTrueRows.length).toBe(cand.intendedTrueRows.length);
    }
  });

  it('validates tier field on extension sheets 5 and 6', () => {
    for (const cand of SET_SHAPES_2.slots.slot5) {
      expect(cand.tier).toBe('extension');
    }
    for (const cand of SET_SHAPES_2.slots.slot6) {
      expect(cand.tier).toBe('extension');
    }
    // Slots 1 to 4 do not have tier: 'extension'
    for (let i = 1; i <= 4; i += 1) {
      for (const cand of SET_SHAPES_2.slots[`slot${i}`]) {
        expect(cand.tier).toBeUndefined();
      }
    }
  });

  it('computes giveaway metric for every candidate without errors', () => {
    const allCandidates = Object.values(SET_SHAPES_2.slots).flat();

    for (const cand of allCandidates) {
      const metric = computeSheetGiveaway(cand);
      expect(metric.maxIou).toBeGreaterThan(0);
      expect(metric.byShape).toBeDefined();
      expect(metric.allShapes).toBeDefined();
      expect(typeof metric.flagged).toBe('boolean');
    }
  });
});

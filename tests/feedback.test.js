import { describe, expect, it } from 'vitest';
import {
  buildTruthTableHint,
  buildVennHint,
  generateTruthTable,
  generateVennRegions,
  getHintStage,
} from '@shared/index';

describe('hint ladder', () => {
  it('moves from neutral to guided to specific hints by attempt count', () => {
    expect(getHintStage(1)).toBe('neutral');
    expect(getHintStage(2)).toBe('guided');
    expect(getHintStage(3)).toBe('specific');
    expect(getHintStage(0)).toBe('neutral');
  });

  it('keeps truth-table hints neutral on the first attempt and more specific later', () => {
    const table = generateTruthTable('!a');
    const step = table.subexpressions[0];
    const row = table.rows[0];

    expect(
      buildTruthTableHint({
        attemptCount: 1,
        step,
        row,
        isBlank: false,
        problemHints: ['Negation flips the value of a.'],
      }),
    ).toContain('does not match yet');

    expect(
      buildTruthTableHint({
        attemptCount: 2,
        step,
        row,
        isBlank: false,
        problemHints: ['Negation flips the value of a.'],
      }),
    ).toContain('The NOT operator flips the operand.');

    expect(
      buildTruthTableHint({
        attemptCount: 3,
        step,
        row,
        isBlank: false,
        problemHints: ['Negation flips the value of a.'],
      }),
    ).toContain('Hint: Negation flips the value of a.');
  });

  it('keeps Venn hints neutral first and then names missed and extra regions later', () => {
    const table = generateTruthTable('a && b');
    const step = table.subexpressions[0];
    const venn = generateVennRegions('a && b');

    expect(
      buildVennHint({
        attemptCount: 1,
        step,
        missedRegions: [venn.regions[3]],
        extraRegions: [venn.regions[0]],
        problemHints: ['Both parts must be true for the whole expression to be true.'],
      }),
    ).toContain('does not match');

    expect(
      buildVennHint({
        attemptCount: 2,
        step,
        missedRegions: [venn.regions[3]],
        extraRegions: [venn.regions[0]],
        problemHints: ['Both parts must be true for the whole expression to be true.'],
      }),
    ).toContain('The AND step keeps only the overlap of both operands.');

    expect(
      buildVennHint({
        attemptCount: 3,
        step,
        missedRegions: [venn.regions[3]],
        extraRegions: [venn.regions[0]],
        problemHints: ['Both parts must be true for the whole expression to be true.'],
      }),
    ).toContain('Missed regions: a=T, b=T.');

    expect(
      buildVennHint({
        attemptCount: 3,
        step,
        missedRegions: [venn.regions[3]],
        extraRegions: [venn.regions[0]],
        problemHints: ['Both parts must be true for the whole expression to be true.'],
      }),
    ).toContain('Extra regions: a=F, b=F.');
  });
});

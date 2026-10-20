import { describe, expect, it } from 'vitest';
import { renderKeyPageHtml, renderStudentPageHtml } from '../src/shape-puzzles/render/layout.js';
import { SET_SHAPES_1 } from '../src/shape-puzzles/sets/shapes-1.js';
import { validateSheet } from '../src/shape-puzzles/validator.js';

function countBadgesByRow(html) {
  const counts = new Map();
  for (const match of html.matchAll(/class="region-row-number-group"[^>]*data-row="(\d+)"/g)) {
    const row = Number(match[1]);
    counts.set(row, (counts.get(row) ?? 0) + 1);
  }
  return counts;
}

describe('region row-number badges', () => {
  const badgedSheets = SET_SHAPES_1.sheets.filter((sheet) => sheet.showRegionRowNumbers);
  const unbadgedSheets = SET_SHAPES_1.sheets.filter((sheet) => !sheet.showRegionRowNumbers);

  it('the exported set has badged and unbadged sheets', () => {
    expect(badgedSheets.length).toBeGreaterThan(0);
    expect(unbadgedSheets.length).toBeGreaterThan(0);
  });

  for (const sheet of badgedSheets) {
    it(`${sheet.id}: every piece of every non-outside row has its own badge`, () => {
      const { regions } = validateSheet(sheet);
      for (const render of [renderStudentPageHtml, renderKeyPageHtml]) {
        const counts = countBadgesByRow(render(sheet, regions));
        for (const region of regions) {
          const expected = region.includedVariables.length === 0 ? 1 : region.pieces.length;
          expect(counts.get(region.id + 1), `row ${region.id + 1}`).toBe(expected);
        }
      }
    });
  }

  for (const sheet of unbadgedSheets) {
    it(`${sheet.id}: no badges are rendered`, () => {
      const { regions } = validateSheet(sheet);
      expect(countBadgesByRow(renderStudentPageHtml(sheet, regions)).size).toBe(0);
    });
  }
});

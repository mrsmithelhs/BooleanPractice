/**
 * Shape puzzle representation modes:
 * - 'table': The student completes the truth table output column; regions cannot be shaded.
 *            Upon correct check, the true regions are shaded automatically.
 * - 'shade': The student shades regions directly from the expression; truth table is hidden.
 *            Upon correct check, the filled-in truth table appears.
 */

export function getSheetMode(sheetIndex, override) {
  if (override === 'table' || override === 'shade') {
    return override;
  }
  return sheetIndex % 2 === 0 ? 'table' : 'shade';
}

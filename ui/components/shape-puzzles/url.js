import { SET_SHAPES_1 } from '@shared/shape-puzzles/sets/shapes-1.js';

export const AVAILABLE_SETS = {
  [SET_SHAPES_1.id]: SET_SHAPES_1,
};

export function parsePuzzleUrl(searchString = '') {
  const params = new URLSearchParams(searchString);
  const setId = params.get('set') || 'shapes-1';
  const sheetParam = params.get('sheet') || '1';
  const teacherParam = params.get('teacher');
  const isTeacher = teacherParam === '1' || teacherParam === 'true';

  const set = AVAILABLE_SETS[setId];
  if (!set) {
    return {
      isValid: false,
      error: `Unknown puzzle set "${setId}". Available sets: ${Object.keys(AVAILABLE_SETS).join(', ')}.`,
      setId,
      sheetIndex: 0,
      sheet: null,
      isTeacher,
    };
  }

  const sheetNum = Number.parseInt(sheetParam, 10);
  if (!Number.isInteger(sheetNum) || sheetNum < 1 || sheetNum > set.sheets.length) {
    return {
      isValid: false,
      error: `Sheet "${sheetParam}" not found in set "${setId}". Available sheets: 1 to ${set.sheets.length}.`,
      setId,
      sheetIndex: 0,
      sheet: null,
      isTeacher,
    };
  }

  const sheetIndex = sheetNum - 1;
  return {
    isValid: true,
    error: null,
    setId,
    sheetIndex,
    sheetNumber: sheetNum,
    sheet: set.sheets[sheetIndex],
    isTeacher,
  };
}

export function buildPuzzleUrl({ setId = 'shapes-1', sheetNumber = 1, isTeacher = false }) {
  const params = new URLSearchParams();
  params.set('set', setId);
  params.set('sheet', String(sheetNumber));
  if (isTeacher) {
    params.set('teacher', '1');
  }
  return `?${params.toString()}`;
}

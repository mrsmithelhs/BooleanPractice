import { buildShapeRegions } from './geometry.js';
import { createRectangle } from './shapes.js';
import { evaluateBooleanAst } from '../evaluator/index.js';
import { parseBooleanExpression } from '../parser/index.js';

export const GIVEAWAY_FLAG_THRESHOLD = 0.75;

/**
 * Computes outline giveaway IoU metrics for a shape puzzle sheet.
 *
 * IoU is computed between the target picture (union of TRUE regions) and:
 * 1. Each individual shape (union of regions where that shape variable is true)
 * 2. The union of all shapes (union of all regions where at least one shape variable is true)
 *
 * Any value >= 0.75 is flagged.
 *
 * @param {Object} sheet - Sheet definition object
 * @param {Object} [options] - Optional precomputed data { regions, trueRows }
 * @returns {Object} Metric summary with byShape, allShapes, maxIou, flagged, flags
 */
export function computeSheetGiveaway(sheet, options = {}) {
  const vbW = sheet.viewBox?.width ?? 180;
  const vbH = sheet.viewBox?.height ?? 95;
  const framePolygon = sheet.framePolygon ?? createRectangle({ x: 0, y: 0, width: vbW, height: vbH });

  const regions = options.regions || buildShapeRegions({
    variables: sheet.variables,
    shapes: sheet.shapes,
    framePolygon,
  });

  // Determine true rows (picture)
  let trueRowIndices = options.trueRows;
  if (!trueRowIndices) {
    if (Array.isArray(sheet.intendedTrueRows)) {
      trueRowIndices = sheet.intendedTrueRows;
    } else {
      const ast = typeof sheet.expression === 'string'
        ? parseBooleanExpression(sheet.expression)
        : sheet.expression;
      trueRowIndices = regions
        .map((r, idx) => (evaluateBooleanAst(ast, r.assignment) ? idx : null))
        .filter((idx) => idx !== null);
    }
  }

  const trueSet = new Set(trueRowIndices);

  // Region areas
  const regionAreas = regions.map((r) => r.totalAreaMm2 || 0);

  // Picture area (union of TRUE regions)
  let pictureArea = 0;
  for (const idx of trueSet) {
    pictureArea += regionAreas[idx] || 0;
  }

  const byShape = {};
  const pairwiseUnions = {};
  const pairwiseIntersections = {};
  const flags = [];
  let maxIou = 0;

  // 1. IoU with each individual shape
  for (const v of sheet.variables || []) {
    let shapeArea = 0;
    let intersectionArea = 0;
    let unionArea = 0;

    for (let i = 0; i < regions.length; i += 1) {
      const inShape = Boolean(regions[i].assignment?.[v]);
      const inPicture = trueSet.has(i);
      const a = regionAreas[i];

      if (inShape) shapeArea += a;
      if (inShape && inPicture) intersectionArea += a;
      if (inShape || inPicture) unionArea += a;
    }

    const iou = unionArea > 0 ? intersectionArea / unionArea : 0;
    const roundedIou = Number(iou.toFixed(3));
    const flagged = roundedIou >= GIVEAWAY_FLAG_THRESHOLD;

    if (flagged) {
      flags.push(`high overlap with shape ${v} (IoU = ${roundedIou})`);
    }

    if (roundedIou > maxIou) {
      maxIou = roundedIou;
    }

    byShape[v] = {
      iou: roundedIou,
      flagged,
      shapeAreaMm2: Number(shapeArea.toFixed(1)),
      intersectionAreaMm2: Number(intersectionArea.toFixed(1)),
      unionAreaMm2: Number(unionArea.toFixed(1)),
    };
  }

  // 2. Pairwise unions and pairwise intersections (F2)
  const vars = sheet.variables || [];
  for (let j = 0; j < vars.length; j += 1) {
    for (let k = j + 1; k < vars.length; k += 1) {
      const v1 = vars[j];
      const v2 = vars[k];

      // Pairwise Union: v1 || v2
      let unionOfShapesArea = 0;
      let uIntersectPicArea = 0;
      let uUnionPicArea = 0;

      for (let i = 0; i < regions.length; i += 1) {
        const inUnion = Boolean(regions[i].assignment?.[v1] || regions[i].assignment?.[v2]);
        const inPicture = trueSet.has(i);
        const a = regionAreas[i];

        if (inUnion) unionOfShapesArea += a;
        if (inUnion && inPicture) uIntersectPicArea += a;
        if (inUnion || inPicture) uUnionPicArea += a;
      }

      const unionIou = uUnionPicArea > 0 ? uIntersectPicArea / uUnionPicArea : 0;
      const roundedUnionIou = Number(unionIou.toFixed(3));
      const unionKey = `${v1} | ${v2}`;
      const unionFlagged = roundedUnionIou >= GIVEAWAY_FLAG_THRESHOLD;
      if (unionFlagged) {
        flags.push(`high overlap with union of ${unionKey} (IoU = ${roundedUnionIou})`);
      }
      if (roundedUnionIou > maxIou) {
        maxIou = roundedUnionIou;
      }
      pairwiseUnions[unionKey] = {
        iou: roundedUnionIou,
        flagged: unionFlagged,
        shapeAreaMm2: Number(unionOfShapesArea.toFixed(1)),
        intersectionAreaMm2: Number(uIntersectPicArea.toFixed(1)),
        unionAreaMm2: Number(uUnionPicArea.toFixed(1)),
      };

      // Pairwise Intersection: v1 && v2
      let interOfShapesArea = 0;
      let iIntersectPicArea = 0;
      let iUnionPicArea = 0;

      for (let i = 0; i < regions.length; i += 1) {
        const inInter = Boolean(regions[i].assignment?.[v1] && regions[i].assignment?.[v2]);
        const inPicture = trueSet.has(i);
        const a = regionAreas[i];

        if (inInter) interOfShapesArea += a;
        if (inInter && inPicture) iIntersectPicArea += a;
        if (inInter || inPicture) iUnionPicArea += a;
      }

      const interIou = iUnionPicArea > 0 ? iIntersectPicArea / iUnionPicArea : 0;
      const roundedInterIou = Number(interIou.toFixed(3));
      const interKey = `${v1} & ${v2}`;
      // For 2-variable sheets where picture is defined as A && B, the intersection is
      // the problem objective rather than a shortcut outline giveaway.
      // For 3+ variables, a pairwise intersection >= 0.75 gives away the picture.
      const shouldFlagInter = vars.length >= 3 && roundedInterIou >= GIVEAWAY_FLAG_THRESHOLD;
      if (shouldFlagInter) {
        flags.push(`high overlap with intersection of ${interKey} (IoU = ${roundedInterIou})`);
      }
      if (vars.length >= 3 && roundedInterIou > maxIou) {
        maxIou = roundedInterIou;
      }
      pairwiseIntersections[interKey] = {
        iou: roundedInterIou,
        flagged: shouldFlagInter,
        shapeAreaMm2: Number(interOfShapesArea.toFixed(1)),
        intersectionAreaMm2: Number(iIntersectPicArea.toFixed(1)),
        unionAreaMm2: Number(iUnionPicArea.toFixed(1)),
      };
    }
  }

  // 3. IoU with union of all shapes
  let allShapesArea = 0;
  let allIntersectionArea = 0;
  let allUnionArea = 0;

  for (let i = 0; i < regions.length; i += 1) {
    // A region is inside "all shapes union" if at least one shape variable is true
    const inAnyShape = (sheet.variables || []).some((v) => Boolean(regions[i].assignment?.[v]));
    const inPicture = trueSet.has(i);
    const a = regionAreas[i];

    if (inAnyShape) allShapesArea += a;
    if (inAnyShape && inPicture) allIntersectionArea += a;
    if (inAnyShape || inPicture) allUnionArea += a;
  }

  const allIou = allUnionArea > 0 ? allIntersectionArea / allUnionArea : 0;
  const roundedAllIou = Number(allIou.toFixed(3));
  const allFlagged = roundedAllIou >= GIVEAWAY_FLAG_THRESHOLD;

  if (allFlagged) {
    flags.push(`high overlap with all shapes union (IoU = ${roundedAllIou})`);
  }

  if (roundedAllIou > maxIou) {
    maxIou = roundedAllIou;
  }

  return {
    byShape,
    pairwiseUnions,
    pairwiseIntersections,
    allShapes: {
      iou: roundedAllIou,
      flagged: allFlagged,
      allShapesAreaMm2: Number(allShapesArea.toFixed(1)),
      intersectionAreaMm2: Number(allIntersectionArea.toFixed(1)),
      unionAreaMm2: Number(allUnionArea.toFixed(1)),
    },
    pictureAreaMm2: Number(pictureArea.toFixed(1)),
    maxIou,
    flagged: maxIou >= GIVEAWAY_FLAG_THRESHOLD,
    flags,
  };
}

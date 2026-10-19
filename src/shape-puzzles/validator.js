import { collectBooleanVariables, parseBooleanExpression } from '../parser/index.js';
import { evaluateBooleanAst } from '../evaluator/index.js';
import { buildShapeRegions, toMultiPolygon } from './geometry.js';
import { createRectangle } from './shapes.js';

export const DEFAULT_THRESHOLDS = {
  minRegionAreaMm2: 150,
  minRegionInscribedDiaMm: 6,
  minPieceAreaMm2: 40,
  minPieceInscribedDiaMm: 4,
  minNumberedRegionInscribedDiaMm: 8,
  maxShapeVertices: 250,
};

function countPolygonVertices(geom) {
  const mp = toMultiPolygon(geom);
  let total = 0;
  for (const poly of mp) {
    for (const ring of poly) {
      total += Math.max(0, ring.length - 1);
    }
  }
  return total;
}

function linesIntersect(p1, p2, p3, p4) {
  function ccw(a, b, c) {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  }
  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

function hasSelfIntersection(geom) {
  const mp = toMultiPolygon(geom);
  for (const poly of mp) {
    for (const ring of poly) {
      const n = ring.length - 1;
      for (let i = 0; i < n; i += 1) {
        for (let j = i + 2; j < n; j += 1) {
          if (i === 0 && j === n - 1) continue; // adjacent in closed loop
          if (linesIntersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function isInsideBox(geom, width, height) {
  const mp = toMultiPolygon(geom);
  for (const poly of mp) {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        if (x < -0.01 || x > width + 0.01 || y < -0.01 || y > height + 0.01) {
          return false;
        }
      }
    }
  }
  return true;
}

export function validateSheet(sheet, options = {}) {
  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(options.thresholds || {}),
  };

  const errors = [];
  const warnings = [];

  // 1. Variable count: 2 or 3 variables only
  if (!Array.isArray(sheet.variables) || (sheet.variables.length !== 2 && sheet.variables.length !== 3)) {
    errors.push(`Sheet "${sheet.id}" must have 2 or 3 variables; found ${sheet.variables?.length}.`);
  }

  // 2. Parse expression and check variable set equality
  let ast = null;
  let exprVars = [];
  try {
    ast = typeof sheet.expression === 'string' ? parseBooleanExpression(sheet.expression) : sheet.expression;
    exprVars = collectBooleanVariables(ast).map((v) => v.toUpperCase());
  } catch (err) {
    errors.push(`Sheet "${sheet.id}" expression syntax error: ${err.message}`);
  }

  if (ast) {
    const sheetVarsUpper = (sheet.variables || []).map((v) => v.toUpperCase()).sort();
    const sortedExprVars = [...exprVars].sort();
    if (JSON.stringify(sheetVarsUpper) !== JSON.stringify(sortedExprVars)) {
      errors.push(
        `Sheet "${sheet.id}" variables [${sheetVarsUpper.join(', ')}] do not match expression variables [${sortedExprVars.join(', ')}].`
      );
    }
  }

  // 3. Frame / viewBox
  const viewBoxWidth = sheet.viewBox?.width ?? 140;
  const viewBoxHeight = sheet.viewBox?.height ?? 100;
  const framePolygon = sheet.framePolygon ?? createRectangle({ x: 0, y: 0, width: viewBoxWidth, height: viewBoxHeight });

  // 4. Shape validation (vertex count, self-intersection, inside viewbox)
  for (const variable of sheet.variables || []) {
    const shape = sheet.shapes?.[variable];
    if (!shape) {
      errors.push(`Sheet "${sheet.id}" is missing shape geometry for variable "${variable}".`);
      continue;
    }

    const vertexCount = countPolygonVertices(shape);
    if (vertexCount > thresholds.maxShapeVertices) {
      errors.push(
        `Shape "${variable}" has ${vertexCount} vertices, exceeding maximum of ${thresholds.maxShapeVertices}.`
      );
    }

    if (hasSelfIntersection(shape)) {
      errors.push(`Shape "${variable}" has self-intersecting polygon boundaries.`);
    }

    if (!isInsideBox(shape, viewBoxWidth, viewBoxHeight)) {
      errors.push(`Shape "${variable}" extends outside the viewBox boundary (${viewBoxWidth}x${viewBoxHeight}).`);
    }
  }

  // Stop if basic structure is invalid
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      metrics: null,
      regions: [],
    };
  }

  // 5. Region builder
  const regions = buildShapeRegions({
    variables: sheet.variables,
    shapes: sheet.shapes,
    framePolygon,
  });

  // 6. Evaluator evaluation & neither always true nor always false
  const rowEvaluations = regions.map((region) =>
    evaluateBooleanAst(ast, region.assignment)
  );

  const trueRowCount = rowEvaluations.filter(Boolean).length;
  if (trueRowCount === 0) {
    errors.push(`Expression "${sheet.expression}" is always FALSE.`);
  } else if (trueRowCount === regions.length) {
    errors.push(`Expression "${sheet.expression}" is always TRUE.`);
  }

  // 7. Independent picture check: evaluator rows must equal intendedTrueRows
  const evaluatorTrueRows = rowEvaluations
    .map((val, idx) => (val ? idx : null))
    .filter((idx) => idx !== null)
    .sort((a, b) => a - b);

  const intendedTrueRows = (sheet.intendedTrueRows || []).slice().sort((a, b) => a - b);

  const independentCheckPasses =
    JSON.stringify(evaluatorTrueRows) === JSON.stringify(intendedTrueRows);

  if (!independentCheckPasses) {
    errors.push(
      `Independent picture check failed for sheet "${sheet.id}": evaluator computed rows [${evaluatorTrueRows.join(', ')}] but intendedTrueRows declared [${intendedTrueRows.join(', ')}].`
    );
  }

  // 8. Region size & inscribed circle checks
  const rowMetrics = [];
  for (const region of regions) {
    const isOutsideRegion = region.includedVariables.length === 0;
    const passesArea = region.totalAreaMm2 >= thresholds.minRegionAreaMm2;
    const passesInscribedDia = region.inscribedCircleDiaMm >= thresholds.minRegionInscribedDiaMm;

    if (!passesArea) {
      errors.push(
        `Region ${region.id} (bits ${region.bits}) has area ${region.totalAreaMm2.toFixed(1)} mm², below minimum of ${thresholds.minRegionAreaMm2} mm².`
      );
    }

    if (!passesInscribedDia) {
      errors.push(
        `Region ${region.id} (bits ${region.bits}) has inscribed circle diameter ${region.inscribedCircleDiaMm.toFixed(1)} mm, below minimum of ${thresholds.minRegionInscribedDiaMm} mm.`
      );
    }

    // Disconnected piece checks
    if (region.pieceCount > 1) {
      warnings.push(
        `Region ${region.id} is split into ${region.pieceCount} disconnected pieces.`
      );
    }

    for (let pIdx = 0; pIdx < region.pieces.length; pIdx += 1) {
      const piece = region.pieces[pIdx];
      if (piece.areaMm2 < thresholds.minPieceAreaMm2) {
        errors.push(
          `Region ${region.id} piece ${pIdx + 1} has area ${piece.areaMm2.toFixed(1)} mm², below piece minimum of ${thresholds.minPieceAreaMm2} mm².`
        );
      }
      if (piece.inscribedCircleDiaMm < thresholds.minPieceInscribedDiaMm) {
        errors.push(
          `Region ${region.id} piece ${pIdx + 1} has inscribed circle diameter ${piece.inscribedCircleDiaMm.toFixed(1)} mm, below piece minimum of ${thresholds.minPieceInscribedDiaMm} mm.`
        );
      }
    }

    // Numbered region check
    if (sheet.showRegionRowNumbers) {
      if (region.inscribedCircleDiaMm < thresholds.minNumberedRegionInscribedDiaMm) {
        errors.push(
          `Region ${region.id} has inscribed circle diameter ${region.inscribedCircleDiaMm.toFixed(1)} mm, below numbered region minimum of ${thresholds.minNumberedRegionInscribedDiaMm} mm.`
        );
      }
    }

    rowMetrics.push({
      id: region.id,
      bits: region.bits,
      assignment: region.assignment,
      isOutsideRegion,
      areaMm2: Number(region.totalAreaMm2.toFixed(2)),
      inscribedCircleDiaMm: Number(region.inscribedCircleDiaMm.toFixed(2)),
      labelPoint: region.labelPoint,
      pieceCount: region.pieceCount,
      pieces: region.pieces.map((p) => ({
        areaMm2: Number(p.areaMm2.toFixed(2)),
        inscribedCircleDiaMm: Number(p.inscribedCircleDiaMm.toFixed(2)),
      })),
      passesArea,
      passesInscribedDia,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    regions,
    metrics: {
      sheetId: sheet.id,
      title: sheet.title,
      variables: sheet.variables,
      expression: sheet.expression,
      evaluatorTrueRows,
      intendedTrueRows,
      independentCheckPasses,
      rows: rowMetrics,
    },
  };
}

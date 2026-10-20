import polygonClipping from 'polygon-clipping';

export function formatSvgNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return Number.parseFloat(value.toFixed(3)).toString();
}

export function ringToPath(ring) {
  if (!Array.isArray(ring) || ring.length === 0) return '';
  return `${ring
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${formatSvgNumber(point[0])} ${formatSvgNumber(point[1])}`)
    .join(' ')} Z`;
}

export function geometryToPathData(geometry) {
  const mp = toMultiPolygon(geometry);
  if (!Array.isArray(mp) || mp.length === 0) return '';
  return mp
    .map((polygon) => polygon.map((ring) => ringToPath(ring)).join(' '))
    .join(' ');
}

export function ringArea(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const j = i === 0 ? ring.length - 1 : i - 1;
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return area / 2;
}

export function polygonArea(poly) {
  if (!Array.isArray(poly) || poly.length === 0) return 0;
  let area = Math.abs(ringArea(poly[0]));
  for (let h = 1; h < poly.length; h += 1) {
    area -= Math.abs(ringArea(poly[h]));
  }
  return Math.max(0, area);
}

export function toMultiPolygon(geom) {
  if (!Array.isArray(geom) || geom.length === 0) return [];
  // Depth 3: [ [ [x, y], ... ] ] -> polygon
  if (typeof geom[0]?.[0]?.[0] === 'number') {
    return [geom];
  }
  // Depth 4: [ [ [ [x, y], ... ] ] ] -> already multipolygon
  return geom;
}

export function multiPolygonArea(multiPoly) {
  const mp = toMultiPolygon(multiPoly);
  return mp.reduce((sum, poly) => sum + polygonArea(poly), 0);
}

export function pointInRing(px, py, ring) {
  let inside = false;
  for (let i = 0; i < ring.length; i += 1) {
    const j = i === 0 ? ring.length - 1 : i - 1;
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInPolygon(px, py, polygon) {
  if (!Array.isArray(polygon) || polygon.length === 0) return false;
  if (!pointInRing(px, py, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i += 1) {
    if (pointInRing(px, py, polygon[i])) return false;
  }
  return true;
}

export function isPointInMultiPolygon(px, py, multiPoly) {
  const mp = toMultiPolygon(multiPoly);
  return mp.some((poly) => isPointInPolygon(px, py, poly));
}

export function distToSegmentSquared(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2;
}

export function pointToPolygonDistance(px, py, polygon) {
  if (!Array.isArray(polygon) || polygon.length === 0) return -Infinity;
  const inside = isPointInPolygon(px, py, polygon);

  let minDistSq = Infinity;
  for (const ring of polygon) {
    for (let i = 0; i < ring.length; i += 1) {
      const j = i === 0 ? ring.length - 1 : i - 1;
      const dSq = distToSegmentSquared(px, py, ring[j][0], ring[j][1], ring[i][0], ring[i][1]);
      if (dSq < minDistSq) minDistSq = dSq;
    }
  }

  const dist = Math.sqrt(minDistSq);
  return inside ? dist : -dist;
}

export function distanceToOutline(px, py, geometry) {
  const mp = toMultiPolygon(geometry);
  let minDistSq = Infinity;
  for (const poly of mp) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length; i += 1) {
        const j = i === 0 ? ring.length - 1 : i - 1;
        const dSq = distToSegmentSquared(px, py, ring[j][0], ring[j][1], ring[i][0], ring[i][1]);
        if (dSq < minDistSq) minDistSq = dSq;
      }
    }
  }
  return Math.sqrt(minDistSq);
}

/**
 * Determines whether two line segments (p1-p2 and p3-p4) intersect.
 */
export function segmentsIntersect(p1, p2, p3, p4) {
  const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Checks whether a leader line segment (p1-p2) intersects any outline segment of otherShapes.
 */
export function leaderIntersectsAnyShape(p1, p2, otherShapes) {
  for (const sh of otherShapes) {
    const mp = toMultiPolygon(sh);
    for (const poly of mp) {
      for (const ring of poly) {
        for (let r = 0; r < ring.length - 1; r += 1) {
          const q1 = { x: ring[r][0], y: ring[r][1] };
          const q2 = { x: ring[r + 1][0], y: ring[r + 1][1] };
          if (segmentsIntersect(p1, p2, q1, q2)) return true;
        }
      }
    }
  }
  return false;
}

/**
 * Computes minimum distance from an axis-aligned box to a shape geometry.
 * Returns 0 if box intersects shape interior or contains shape vertices.
 */
export function boxDistanceToGeometry(box, shape) {
  const { x1, y1, x2, y2 } = box;
  const corners = [
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
  ];

  // If any corner is inside shape
  for (const [cx, cy] of corners) {
    if (pointToPolygonDistance(cx, cy, shape) > 0) return 0;
  }

  // If any vertex of shape is inside box
  const mp = toMultiPolygon(shape);
  for (const poly of mp) {
    for (const ring of poly) {
      for (const [vx, vy] of ring) {
        if (vx >= x1 && vx <= x2 && vy >= y1 && vy <= y2) return 0;
      }
    }
  }

  // Sample points along all 4 edges of the box
  let minD = Infinity;
  for (let x = x1; x <= x2; x += 1.0) {
    minD = Math.min(minD, distanceToOutline(x, y1, shape), distanceToOutline(x, y2, shape));
  }
  for (let y = y1; y <= y2; y += 1.0) {
    minD = Math.min(minD, distanceToOutline(x1, y, shape), distanceToOutline(x2, y, shape));
  }
  return minD;
}

/**
 * Finds an optimal, obstacle-free location for a label box with width W and height H,
 * ensuring >= 3.0 mm clearance from all shape outlines and from the frame, and >= 5 mm from other boxes.
 */
export function findLabelBoxPosition(
  v,
  anchor,
  allShapes,
  viewBox,
  placedBoxes = [],
  boxWidth = 27,
  boxHeight = 15
) {
  const vbWidth = viewBox?.width ?? 180;
  const vbHeight = viewBox?.height ?? 95;
  const hw = boxWidth / 2;
  const hh = boxHeight / 2;

  // Candidate ranges by variable quadrant
  const xRange = v === 'A' ? [18, 55] : v === 'B' ? [vbWidth - 55, vbWidth - 18] : [18, 55];
  const yRange = v === 'C' ? [65, 83] : [12, 38];

  let bestCandidate = null;
  let bestScore = -Infinity;

  for (let x = xRange[0]; x <= xRange[1]; x += 2) {
    for (let y = yRange[0]; y <= yRange[1]; y += 2) {
      const box = { x1: x - hw, y1: y - hh, x2: x + hw, y2: y + hh };

      // Frame clearance >= 3.0 mm (frame at [1,1] to [vbWidth-1, vbHeight-1])
      if (box.x1 < 4.0 || box.x2 > vbWidth - 4.0 || box.y1 < 4.0 || box.y2 > vbHeight - 4.0) {
        continue;
      }

      // Check distance to all shapes >= 3.0 mm
      let minClear = Infinity;
      for (const shGeom of allShapes) {
        const d = boxDistanceToGeometry(box, shGeom);
        if (d < minClear) minClear = d;
      }
      if (minClear < 3.0) continue;

      // Check separation from already placed label boxes >= 5.0 mm
      let boxOverlap = false;
      for (const pb of placedBoxes) {
        const dx = Math.max(0, Math.max(pb.x1 - box.x2, box.x1 - pb.x2));
        const dy = Math.max(0, Math.max(pb.y1 - box.y2, box.y1 - pb.y2));
        if (Math.hypot(dx, dy) < 5.0) {
          boxOverlap = true;
          break;
        }
      }
      if (boxOverlap) continue;

      const distToAnchor = Math.hypot(x - anchor.x, y - anchor.y);
      const score = minClear * 2 - Math.abs(distToAnchor - 32);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = { x, y, box, minClear, distToAnchor };
      }
    }
  }

  // Fallback if no quadrant candidate passed
  if (!bestCandidate) {
    const fallbackX = v === 'A' ? 22 : v === 'B' ? vbWidth - 22 : 22;
    const fallbackY = v === 'C' ? vbHeight - 16 : 16;
    return {
      x: fallbackX,
      y: fallbackY,
      box: {
        x1: fallbackX - hw,
        y1: fallbackY - hh,
        x2: fallbackX + hw,
        y2: fallbackY + hh,
      },
    };
  }

  return bestCandidate;
}

/**
 * Finds an obstacle-free position for Region 0 badge (radius R=2.6mm)
 * with >= 1.0 mm clearance from all label boxes, leader lines, leader dots, and region boundaries.
 */
export function findObstacleFreeBadgePoint(
  reg0,
  labelBoxes,
  leaderLines,
  viewBox,
  badgeRadius = 2.6
) {
  const vbWidth = viewBox?.width ?? 180;
  const vbHeight = viewBox?.height ?? 95;
  const minClearance = badgeRadius + 1.0; // 3.6 mm

  let bestPt = null;
  let maxMargin = -Infinity;

  for (let x = 18; x <= vbWidth - 18; x += 2) {
    for (let y = 12; y <= vbHeight - 12; y += 2) {
      let dReg = -Infinity;
      for (const p of reg0.pieces || []) {
        const d = pointToPolygonDistance(x, y, p.polygon);
        if (d > dReg) dReg = d;
      }
      if (dReg < minClearance) continue;

      let dBox = Infinity;
      for (const b of labelBoxes) {
        const dx = Math.max(0, Math.max(b.x1 - x, x - b.x2));
        const dy = Math.max(0, Math.max(b.y1 - y, y - b.y2));
        dBox = Math.min(dBox, Math.hypot(dx, dy));
      }
      if (dBox < minClearance) continue;

      let dLeader = Infinity;
      for (const l of leaderLines) {
        const d = Math.sqrt(distToSegmentSquared(x, y, l.x1, l.y1, l.x2, l.y2));
        dLeader = Math.min(dLeader, d);
      }
      if (dLeader < minClearance) continue;

      const margin = Math.min(dReg, dBox, dLeader);
      if (margin > maxMargin) {
        maxMargin = margin;
        bestPt = { x, y, margin };
      }
    }
  }

  return bestPt ? { x: bestPt.x, y: bestPt.y } : (reg0.pieces[0]?.center || { x: 150, y: 75 });
}

function sampleRingPoints(ring, step = 0.5) {
  const pts = [];
  for (let i = 0; i < ring.length; i += 1) {
    const j = i === 0 ? ring.length - 1 : i - 1;
    const x1 = ring[j][0];
    const y1 = ring[j][1];
    const x2 = ring[i][0];
    const y2 = ring[i][1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 0; k < n; k += 1) {
      pts.push({ x: x1 + (k / n) * (x2 - x1), y: y1 + (k / n) * (y2 - y1) });
    }
  }
  return pts;
}

export function findOutlineAnchorPoint(shapeGeom, otherShapeGeoms = [], options = {}) {
  const {
    targetAngle = Math.PI * 0.5,
    centerX = 90,
    centerY = 48,
    minClearanceMm = 6.0,
    sampleStep = 0.5,
  } = options;

  const mp = toMultiPolygon(shapeGeom);
  const allPts = mp.flatMap((p) => sampleRingPoints(p[0], sampleStep));

  const candidates = allPts
    .map((pt) => {
      const dOthers = otherShapeGeoms.map((s) => distanceToOutline(pt.x, pt.y, s));
      const minDist = otherShapeGeoms.length > 0 ? Math.min(...dOthers) : Infinity;
      const ang = Math.atan2(centerY - pt.y, pt.x - centerX);
      let diff = Math.abs(ang - targetAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      return { pt, minDist, diff };
    })
    .filter((x) => x.minDist >= minClearanceMm);

  if (candidates.length === 0) {
    allPts.sort((a, b) => {
      const dOthersA = otherShapeGeoms.length > 0 ? Math.min(...otherShapeGeoms.map((s) => distanceToOutline(a.x, a.y, s))) : Infinity;
      const dOthersB = otherShapeGeoms.length > 0 ? Math.min(...otherShapeGeoms.map((s) => distanceToOutline(b.x, b.y, s))) : Infinity;
      return dOthersB - dOthersA;
    });
    return allPts[0];
  }

  candidates.sort((a, b) => a.diff - b.diff || b.minDist - a.minDist);
  return candidates[0].pt;
}

/**
 * Finds the pole of inaccessibility (center of the largest inscribed circle) of a simple or holed polygon.
 */
export function findPoleOfInaccessibility(polygon, precision = 0.1) {
  if (!Array.isArray(polygon) || polygon.length === 0 || polygon[0].length < 3) {
    return { x: 0, y: 0, radius: 0, diameter: 0 };
  }

  const outer = polygon[0];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of outer) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const cellSize = Math.min(width, height);
  if (cellSize <= 0) {
    return { x: minX, y: minY, radius: 0, diameter: 0 };
  }

  let h = cellSize / 2;

  // Initial candidate: bounding box center
  let bestPoint = { x: minX + width / 2, y: minY + height / 2 };
  let bestDist = pointToPolygonDistance(bestPoint.x, bestPoint.y, polygon);

  // If bounding box center is outside, probe vertices/centroid
  if (bestDist < 0) {
    let sumX = 0;
    let sumY = 0;
    for (const [x, y] of outer) {
      sumX += x;
      sumY += y;
    }
    const centroidX = sumX / outer.length;
    const centroidY = sumY / outer.length;
    const centroidDist = pointToPolygonDistance(centroidX, centroidY, polygon);
    if (centroidDist > bestDist) {
      bestDist = centroidDist;
      bestPoint = { x: centroidX, y: centroidY };
    }
  }

  // Build grid of cells
  const queue = [];
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      const cx = x + h;
      const cy = y + h;
      const d = pointToPolygonDistance(cx, cy, polygon);
      const max = d + h * Math.SQRT2;
      queue.push({ x: cx, y: cy, h, d, max });
    }
  }

  // Sort queue by max descending
  queue.sort((a, b) => b.max - a.max);

  while (queue.length > 0) {
    const cell = queue.shift();

    if (cell.d > bestDist) {
      bestDist = cell.d;
      bestPoint = { x: cell.x, y: cell.y };
    }

    if (cell.max - bestDist <= precision) {
      continue;
    }

    // Subdivide into 4 quadrants
    h = cell.h / 2;
    const subCells = [
      { x: cell.x - h, y: cell.y - h },
      { x: cell.x + h, y: cell.y - h },
      { x: cell.x - h, y: cell.y + h },
      { x: cell.x + h, y: cell.y + h },
    ];

    for (const sc of subCells) {
      const d = pointToPolygonDistance(sc.x, sc.y, polygon);
      const max = d + h * Math.SQRT2;
      if (max > bestDist) {
        queue.push({ x: sc.x, y: sc.y, h, d, max });
      }
    }

    queue.sort((a, b) => b.max - a.max);
  }

  const radius = Math.max(0, bestDist);
  return {
    x: bestPoint.x,
    y: bestPoint.y,
    radius,
    diameter: radius * 2,
  };
}

export function buildShapeRegions({ variables, shapes, framePolygon }) {
  if (!Array.isArray(variables) || variables.length < 2 || variables.length > 3) {
    throw new RangeError('Shape puzzle region engine supports 2 or 3 variables.');
  }

  const totalRows = 2 ** variables.length;
  const regions = [];

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    const assignment = {};
    const includedVariables = [];
    const excludedVariables = [];
    const bitsArr = [];

    variables.forEach((variable, variableIndex) => {
      const bitPosition = variables.length - variableIndex - 1;
      const isTrue = Boolean(rowIndex & (1 << bitPosition));
      assignment[variable] = isTrue;
      assignment[variable.toLowerCase()] = isTrue;
      assignment[variable.toUpperCase()] = isTrue;
      bitsArr.push(isTrue ? '1' : '0');
      if (isTrue) {
        includedVariables.push(variable);
      } else {
        excludedVariables.push(variable);
      }
    });

    const bits = bitsArr.join('');

    // Compute region geometry
    let geom = [];
    if (includedVariables.length === 0) {
      geom = framePolygon;
    } else {
      geom = polygonClipping.intersection(shapes[includedVariables[0]], framePolygon);
      for (let i = 1; i < includedVariables.length; i += 1) {
        geom = polygonClipping.intersection(geom, shapes[includedVariables[i]]);
        if (geom.length === 0) break;
      }
    }

    if (geom.length > 0) {
      for (const excVar of excludedVariables) {
        geom = polygonClipping.difference(geom, shapes[excVar]);
        if (geom.length === 0) break;
      }
    }

    // Filter out degenerate zero-area slivers from numerical clipping precision
    const validPolygons = geom.filter((poly) => polygonArea(poly) > 0.01);

    const pieces = validPolygons.map((poly) => {
      const area = polygonArea(poly);
      const pole = findPoleOfInaccessibility(poly);
      return {
        polygon: poly,
        areaMm2: area,
        inscribedCircleDiaMm: pole.diameter,
        inscribedRadiusMm: pole.radius,
        center: { x: pole.x, y: pole.y },
      };
    });

    const totalAreaMm2 = pieces.reduce((sum, p) => sum + p.areaMm2, 0);
    const bestPiece = pieces.reduce(
      (best, p) => (p.inscribedCircleDiaMm > best.inscribedCircleDiaMm ? p : best),
      { inscribedCircleDiaMm: 0, center: { x: 0, y: 0 } }
    );

    let labelPoint = bestPiece.center;
    if (includedVariables.length === 0 && bestPiece.polygon) {
      const brCandidate = { x: 154, y: 78 };
      if (pointToPolygonDistance(brCandidate.x, brCandidate.y, bestPiece.polygon) >= 8) {
        labelPoint = brCandidate;
      }
    }

    regions.push({
      id: rowIndex,
      bits,
      assignment,
      includedVariables,
      excludedVariables,
      geometry: validPolygons,
      pathD: geometryToPathData(validPolygons),
      totalAreaMm2,
      inscribedCircleDiaMm: bestPiece.inscribedCircleDiaMm,
      labelPoint,
      pieceCount: pieces.length,
      pieces,
    });
  }

  return regions;
}

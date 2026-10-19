import polygonClipping from 'polygon-clipping';

function closeRing(ring) {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...ring, [first[0], first[1]]];
  }
  return ring;
}

export function createCircle({ cx, cy, r, segments = 64 }) {
  const ring = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    ring.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return [closeRing(ring)];
}

export function createEllipse({ cx, cy, rx, ry, segments = 64 }) {
  const ring = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    ring.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }
  return [closeRing(ring)];
}

export function createRectangle({ x, y, width, height }) {
  const ring = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
    [x, y],
  ];
  return [ring];
}

export function createRoundedRectangle({ x, y, width, height, radius = 5, segments = 8 }) {
  const r = Math.min(radius, width / 2, height / 2);
  const ring = [];

  // Top-right corner
  for (let i = 0; i <= segments; i += 1) {
    const angle = -Math.PI / 2 + (i / segments) * (Math.PI / 2);
    ring.push([x + width - r + r * Math.cos(angle), y + r + r * Math.sin(angle)]);
  }
  // Bottom-right corner
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * (Math.PI / 2);
    ring.push([x + width - r + r * Math.cos(angle), y + height - r + r * Math.sin(angle)]);
  }
  // Bottom-left corner
  for (let i = 0; i <= segments; i += 1) {
    const angle = Math.PI / 2 + (i / segments) * (Math.PI / 2);
    ring.push([x + r + r * Math.cos(angle), y + height - r + r * Math.sin(angle)]);
  }
  // Top-left corner
  for (let i = 0; i <= segments; i += 1) {
    const angle = Math.PI + (i / segments) * (Math.PI / 2);
    ring.push([x + r + r * Math.cos(angle), y + r + r * Math.sin(angle)]);
  }

  return [closeRing(ring)];
}

export function createRegularPolygon({ cx, cy, r, sides = 5, startAngle = -Math.PI / 2 }) {
  const ring = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = startAngle + (i / sides) * Math.PI * 2;
    ring.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return [closeRing(ring)];
}

export function createStarPolygon({ cx, cy, rOuter, rInner, points = 5, startAngle = -Math.PI / 2 }) {
  const ring = [];
  const totalVertices = points * 2;
  for (let i = 0; i < totalVertices; i += 1) {
    const angle = startAngle + (i / totalVertices) * Math.PI * 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    ring.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return [closeRing(ring)];
}

export function createPolygon(points) {
  return [closeRing(points.map(([x, y]) => [x, y]))];
}

function mapCoordinates(geom, transformPoint) {
  if (!Array.isArray(geom)) return geom;

  // Detect Point [x, y]
  if (geom.length === 2 && typeof geom[0] === 'number' && typeof geom[1] === 'number') {
    return transformPoint(geom[0], geom[1]);
  }

  return geom.map((child) => mapCoordinates(child, transformPoint));
}

export function translate(geom, dx, dy) {
  return mapCoordinates(geom, (x, y) => [x + dx, y + dy]);
}

export function scale(geom, sx, sy = sx, [originX = 0, originY = 0] = []) {
  return mapCoordinates(geom, (x, y) => [
    originX + (x - originX) * sx,
    originY + (y - originY) * sy,
  ]);
}

export function rotate(geom, angleRad, [originX = 0, originY = 0] = []) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return mapCoordinates(geom, (x, y) => {
    const dx = x - originX;
    const dy = y - originY;
    return [
      originX + dx * cos - dy * sin,
      originY + dx * sin + dy * cos,
    ];
  });
}

export function unionShapes(...shapes) {
  if (shapes.length === 0) return [];
  if (shapes.length === 1) return shapes[0];
  return polygonClipping.union(shapes[0], ...shapes.slice(1));
}

export function differenceShapes(subject, ...clippers) {
  if (clippers.length === 0) return subject;
  return polygonClipping.difference(subject, ...clippers);
}

export function intersectShapes(...shapes) {
  if (shapes.length === 0) return [];
  if (shapes.length === 1) return shapes[0];
  return polygonClipping.intersection(shapes[0], ...shapes.slice(1));
}

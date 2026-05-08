import polygonClipping from 'polygon-clipping';

const ONE_VARIABLE_CIRCLES = [
  {
    variableIndex: 0,
    cx: 50,
    cy: 58,
    r: 28,
    labelX: 50,
    labelY: 58,
  },
];

const TWO_VARIABLE_CIRCLES = [
  {
    variableIndex: 0,
    cx: 40,
    cy: 56,
    r: 26,
    labelX: 40,
    labelY: 56,
  },
  {
    variableIndex: 1,
    cx: 60,
    cy: 56,
    r: 26,
    labelX: 60,
    labelY: 56,
  },
];

const THREE_VARIABLE_CIRCLES = [
  {
    variableIndex: 0,
    cx: 39,
    cy: 60,
    r: 24,
    labelX: 39,
    labelY: 60,
  },
  {
    variableIndex: 1,
    cx: 61,
    cy: 60,
    r: 24,
    labelX: 61,
    labelY: 60,
  },
  {
    variableIndex: 2,
    cx: 50,
    cy: 38,
    r: 24,
    labelX: 50,
    labelY: 38,
  },
];

const REGION_ANCHORS = {
  1: {
    0: { x: 50, y: 26, width: 36, height: 22 },
    1: { x: 50, y: 58, width: 42, height: 24 },
  },
  2: {
    0: { x: 50, y: 20, width: 34, height: 20 },
    1: { x: 68, y: 56, width: 34, height: 20 },
    2: { x: 32, y: 56, width: 34, height: 20 },
    3: { x: 50, y: 56, width: 36, height: 22 },
  },
  3: {
    0: { x: 50, y: 18, width: 34, height: 20 },
    1: { x: 50, y: 31, width: 30, height: 18 },
    2: { x: 68, y: 56, width: 30, height: 18 },
    3: { x: 62, y: 46, width: 28, height: 18 },
    4: { x: 32, y: 56, width: 30, height: 18 },
    5: { x: 38, y: 46, width: 28, height: 18 },
    6: { x: 50, y: 73, width: 30, height: 18 },
    7: { x: 50, y: 56, width: 30, height: 18 },
  },
};

const STATE_LABELS = {
  available: 'available',
  neutral: 'available',
  selected: 'selected',
  correct: 'correct',
  missed: 'missed',
  extra: 'extra',
  locked: 'locked',
  match: 'match',
  diff: 'different',
};

const STATE_ICONS = {
  available: '○',
  neutral: '○',
  selected: '●',
  correct: '✓',
  missed: '!',
  extra: '×',
  locked: '▣',
  match: '✓',
  diff: '×',
};

const REGION_POLYGON_SEGMENTS = 96;
const VIEWBOX_POLYGON = [[[
  [0, 0],
  [100, 0],
  [100, 100],
  [0, 100],
  [0, 0],
]]];

function getVariableCount(variables) {
  if (!Array.isArray(variables) || variables.length < 1 || variables.length > 3) {
    throw new RangeError('Venn diagram layout supports one to three variables.');
  }

  return variables.length;
}

function getCircleDescriptors(variables) {
  const count = getVariableCount(variables);

  if (count === 1) {
    return ONE_VARIABLE_CIRCLES.map((circle, index) => ({
      ...circle,
      variable: variables[index],
    }));
  }

  if (count === 2) {
    return TWO_VARIABLE_CIRCLES.map((circle, index) => ({
      ...circle,
      variable: variables[index],
    }));
  }

  return THREE_VARIABLE_CIRCLES.map((circle, index) => ({
    ...circle,
    variable: variables[index],
  }));
}

function getRegionAnchor(regionId, variableCount) {
  const anchors = REGION_ANCHORS[variableCount];
  if (!anchors) {
    throw new RangeError('Venn diagram layout supports one to three variables.');
  }

  const anchor = anchors[regionId];
  if (!anchor) {
    throw new RangeError(`No Venn layout anchor is defined for region ${regionId}.`);
  }

  return anchor;
}

function getRegionDisplayLabel(bits, variables) {
  const activeVariables = bits
    .split('')
    .map((bit, index) => (bit === '1' ? variables[index] : null))
    .filter(Boolean);

  if (activeVariables.length === 0) {
    return 'outside all sets';
  }

  if (activeVariables.length === variables.length) {
    if (variables.length === 1) {
      return `inside ${variables[0]}`;
    }

    if (variables.length === 2) {
      return 'inside both sets';
    }

    return 'inside all three sets';
  }

  if (activeVariables.length === 1) {
    return `inside ${activeVariables[0]} only`;
  }

  return `inside ${activeVariables.join(' and ')} only`;
}

function getRegionLabelLines(displayLabel) {
  const words = displayLabel.split(' ').filter(Boolean);

  if (words.length <= 2 || displayLabel.length <= 13) {
    return [displayLabel];
  }

  if (words.length === 3) {
    return [`${words[0]} ${words[1]}`, words[2]];
  }

  const splitIndex = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, splitIndex).join(' ');
  const secondLine = words.slice(splitIndex).join(' ');

  return secondLine ? [firstLine, secondLine] : [firstLine];
}

function getRegionMembership(bits, variables) {
  const includedVariables = [];
  const excludedVariables = [];

  bits.split('').forEach((bit, index) => {
    if (bit === '1') {
      includedVariables.push(variables[index]);
      return;
    }

    excludedVariables.push(variables[index]);
  });

  return {
    includedVariables,
    excludedVariables,
  };
}

function formatSvgNumber(value) {
  return Number.parseFloat(value.toFixed(3)).toString();
}

function createCirclePolygon(circle, segments = REGION_POLYGON_SEGMENTS) {
  const ring = Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2 - Math.PI / 2;

    return [
      circle.cx + circle.r * Math.cos(angle),
      circle.cy + circle.r * Math.sin(angle),
    ];
  });

  ring.push(ring[0]);

  return [ring];
}

function cloneGeometry(geometry) {
  return geometry.map((polygon) => polygon.map((ring) => ring.map((point) => [...point])));
}

function buildRegionGeometry(region, circleByVariable) {
  // Build an actual SVG-ready region shape so browser hit-testing follows the region geometry,
  // not a full-rect overlay.
  let geometry = cloneGeometry(VIEWBOX_POLYGON);

  for (const variable of region.includedVariables) {
    geometry = polygonClipping.intersection(geometry, createCirclePolygon(circleByVariable[variable]));

    if (!geometry.length) {
      return geometry;
    }
  }

  for (const variable of region.excludedVariables) {
    geometry = polygonClipping.difference(geometry, createCirclePolygon(circleByVariable[variable]));

    if (!geometry.length) {
      return geometry;
    }
  }

  return geometry;
}

function ringToPath(ring) {
  if (!Array.isArray(ring) || ring.length === 0) {
    return '';
  }

  return `${ring
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${formatSvgNumber(point[0])} ${formatSvgNumber(point[1])}`)
    .join(' ')} Z`;
}

function geometryToPathData(geometry) {
  if (!Array.isArray(geometry) || geometry.length === 0) {
    return '';
  }

  return geometry
    .map((polygon) => polygon.map((ring) => ringToPath(ring)).join(' '))
    .join(' ');
}

function resolveRegionState(state) {
  return STATE_LABELS[state] ?? STATE_LABELS.neutral;
}

function resolveRegionIcon(state) {
  return STATE_ICONS[state] ?? STATE_ICONS.neutral;
}

function buildRegionAriaLabel(region, stateLabel, displayLabel) {
  const parts = [displayLabel, region.accessibleLabel];

  if (stateLabel) {
    parts.push(stateLabel);
  }

  return parts.join(', ');
}

export function buildVennDiagramModel(blueprint, { stateByRegionId = {}, focusRegionIds = [] } = {}) {
  const variableCount = getVariableCount(blueprint.variables);
  const circles = getCircleDescriptors(blueprint.variables);
  const focusSet = new Set(focusRegionIds);
  const circleByVariable = Object.fromEntries(circles.map((circle) => [circle.variable, circle]));

  return {
    ...blueprint,
    circles,
    regions: blueprint.regions.map((region) => {
      const state = stateByRegionId[region.id] ?? 'neutral';
      const anchor = getRegionAnchor(region.id, variableCount);
      const displayLabel = getRegionDisplayLabel(region.bits, blueprint.variables);
      const stateLabel = resolveRegionState(state);
      const membership = getRegionMembership(region.bits, blueprint.variables);
      const pathD = geometryToPathData(buildRegionGeometry(membership, circleByVariable));

      return {
        ...region,
        state,
        focused: focusSet.has(region.id),
        icon: resolveRegionIcon(state),
        displayLabel,
        labelLines: getRegionLabelLines(displayLabel),
        stateLabel,
        ariaLabel: buildRegionAriaLabel(region, stateLabel, displayLabel),
        anchor,
        pathD,
        ...membership,
      };
    }),
  };
}

export function getVennDiagramCircleDescriptors(variables) {
  return getCircleDescriptors(variables);
}

export function getVennDiagramRegionAnchor(regionId, variableCount) {
  return getRegionAnchor(regionId, variableCount);
}

export function getVennDiagramRegionDisplayLabel(bits, variables) {
  return getRegionDisplayLabel(bits, variables);
}

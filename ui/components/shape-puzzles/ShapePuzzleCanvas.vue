<template>
  <div
    class="shape-puzzle-canvas-root"
    :class="{ 'is-greyscale': isGreyscale, 'is-solved': isSolved }"
    data-testid="shape-puzzle-canvas"
  >
    <div class="canvas-header-bar">
      <h3 class="canvas-title">
        Shape Diagram
      </h3>
      <span
        v-if="mode === 'shade'"
        class="canvas-subtitle"
      >Shade TRUE regions</span>
      <span
        v-else-if="isSolved"
        class="canvas-subtitle"
      >TRUE regions revealed</span>
      <span
        v-else
        class="canvas-subtitle"
      >Visual diagram</span>
    </div>

    <div
      v-if="mode === 'shade'"
      class="canvas-toolbar"
    >
      <button
        type="button"
        class="btn-canvas-action"
        data-testid="btn-check-shading"
        :disabled="isSolved && !isTeacher"
        @click="emit('check-shading')"
      >
        <span v-if="isSolved">✓ Solved</span>
        <span v-else>Check Shading</span>
      </button>

      <button
        type="button"
        class="btn-canvas-action btn-canvas-secondary"
        data-testid="btn-clear-shading"
        :disabled="isSolved && !isTeacher"
        @click="emit('clear-shading')"
      >
        Clear Shading
      </button>
    </div>

    <div class="svg-stage-container">
      <svg
        ref="svgRef"
        class="shape-puzzle-svg"
        :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        :aria-label="`Interactive logic puzzle diagram for ${sheet.title}`"
      >
        <defs>
          <filter
            id="focus-glow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.2"
              flood-color="#f59e0b"
              flood-opacity="0.9"
            />
          </filter>
        </defs>

        <!-- Outer Boundary Frame Background -->
        <path
          :d="framePathD"
          fill="#ffffff"
          stroke="none"
          class="frame-background"
        />

        <!-- Interactive Region Layers (Hit & Fill) -->
        <g
          class="region-layer"
          role="group"
          aria-label="Puzzle regions to shade"
        >
          <g
            v-for="region in regions"
            :key="region.id"
            class="region-group"
            :class="{
              'is-hovered': activeHoverRow === region.id + 1,
              'is-focused': activeFocusRow === region.id + 1,
              'is-shaded': shadedRegionIds.has(region.id),
              'is-correct': isSolved && isRegionIntendedTrue(region.id),
              'is-static': mode === 'table',
            }"
            :role="mode === 'shade' ? 'button' : undefined"
            :tabindex="mode === 'shade' ? 0 : -1"
            :data-testid="`region-${region.id}`"
            :aria-label="regionAriaLabel(region)"
            :aria-pressed="mode === 'shade' ? shadedRegionIds.has(region.id) : undefined"
            @click="onRegionClick(region.id)"
            @keydown.enter.prevent="onRegionClick(region.id)"
            @keydown.space.prevent="onRegionClick(region.id)"
            @focus="mode === 'shade' && emit('region-focus', region.id + 1)"
            @blur="mode === 'shade' && emit('region-focus', null)"
            @mouseenter="mode === 'shade' && emit('region-hover', region.id + 1)"
            @mouseleave="mode === 'shade' && emit('region-hover', null)"
          >
            <path
              :d="region.pathD"
              :fill="getRegionFill(region.id)"
              :stroke="getRegionStroke(region.id)"
              :stroke-width="getRegionStrokeWidth(region.id)"
              class="region-path"
            />
          </g>
        </g>

        <!-- Outer Boundary Frame Outline (rendered above regions so region fills never cover stroke) -->
        <path
          :d="framePathD"
          fill="none"
          stroke="#475569"
          stroke-width="0.5"
          class="frame-boundary"
          data-testid="frame-boundary"
          pointer-events="none"
        />

        <!-- Reveal Overlay Layer (Online only, drawn after success or in teacher view) -->
        <g
          v-if="(isSolved || isTeacher) && currentOverlay && currentOverlay.length > 0"
          class="reveal-overlay-layer"
          aria-hidden="true"
          data-testid="reveal-overlay-layer"
          pointer-events="none"
        >
          <template
            v-for="(prim, pIdx) in currentOverlay"
            :key="`ovl-${pIdx}`"
          >
            <line
              v-if="prim.type === 'line'"
              :x1="prim.x1"
              :y1="prim.y1"
              :x2="prim.x2"
              :y2="prim.y2"
              :class="`overlay-prim overlay-${prim.style}`"
            />
            <circle
              v-else-if="prim.type === 'circle'"
              :cx="prim.cx"
              :cy="prim.cy"
              :r="prim.r"
              :class="`overlay-prim overlay-${prim.style}`"
            />
            <ellipse
              v-else-if="prim.type === 'ellipse'"
              :cx="prim.cx"
              :cy="prim.cy"
              :rx="prim.rx"
              :ry="prim.ry"
              :class="`overlay-prim overlay-${prim.style}`"
            />
            <polyline
              v-else-if="prim.type === 'polyline'"
              :points="prim.points"
              :class="`overlay-prim overlay-${prim.style}`"
            />
            <polygon
              v-else-if="prim.type === 'polygon'"
              :points="prim.points"
              :class="`overlay-prim overlay-${prim.style}`"
            />
            <path
              v-else-if="prim.type === 'path'"
              :d="prim.d"
              :class="`overlay-prim overlay-${prim.style}`"
            />
          </template>
        </g>

        <!-- Shape Outlines Layer (Solid / Dashed / Dash-dot with Distinct Colors) -->
        <g
          class="shape-outlines-layer"
          pointer-events="none"
        >
          <path
            v-for="outline in shapeOutlines"
            :key="outline.variable"
            :d="outline.pathD"
            fill="none"
            :stroke="outline.stroke"
            :stroke-width="outline.strokeWidth"
            :stroke-dasharray="outline.dashArray"
            class="shape-boundary-path"
          />
        </g>

        <!-- Outside Shape Labels Layer (Boxes, Leaders, and Swatches) -->
        <g
          class="shape-labels-layer"
          pointer-events="none"
        >
          <g
            v-for="lbl in labelBoxes"
            :key="`lbl-${lbl.variable}`"
            class="shape-label-item"
          >
            <!-- Leader Line -->
            <line
              :x1="lbl.lineStart.x"
              :y1="lbl.lineStart.y"
              :x2="lbl.anchor.x"
              :y2="lbl.anchor.y"
              stroke="#64748b"
              stroke-width="0.35"
              stroke-dasharray="1.5 1.5"
            />
            <!-- Anchor Dot on Shape Edge -->
            <circle
              :cx="lbl.anchor.x"
              :cy="lbl.anchor.y"
              r="0.9"
              :fill="lbl.color"
            />
            <!-- Outside Label Box -->
            <rect
              :x="lbl.box.x"
              :y="lbl.box.y"
              :width="lbl.box.width"
              :height="lbl.box.height"
              rx="2.5"
              fill="#ffffff"
              fill-opacity="0.96"
              :stroke="lbl.color"
              stroke-width="0.5"
            />
            <!-- Shape Variable Letter -->
            <text
              :x="lbl.textPos.x"
              :y="lbl.textPos.y"
              dominant-baseline="central"
              text-anchor="middle"
              font-family="system-ui, sans-serif"
              font-size="5.2"
              font-weight="bold"
              :fill="lbl.color"
            >
              {{ lbl.variable }}
            </text>
            <!-- Line Style Swatch Line -->
            <line
              :x1="lbl.swatch.x1"
              :y1="lbl.swatch.y"
              :x2="lbl.swatch.x2"
              :y2="lbl.swatch.y"
              :stroke="lbl.color"
              :stroke-width="lbl.strokeWidth"
              :stroke-dasharray="lbl.dashArray"
            />
          </g>
        </g>

        <!-- Row Badges Layer (Fading Scaffold) -->
        <g
          v-if="sheet.showRegionRowNumbers"
          class="row-badges-layer"
          pointer-events="none"
        >
          <template
            v-for="region in regions"
            :key="`badges-${region.id}`"
          >
            <g
              v-for="(badge, bIdx) in regionBadges[region.id]"
              :key="`b-${region.id}-${bIdx}`"
              class="row-badge-group"
            >
              <circle
                :cx="badge.x"
                :cy="badge.y"
                r="2.6"
                fill="#ffffff"
                fill-opacity="0.92"
                stroke="#475569"
                stroke-width="0.35"
              />
              <text
                :x="badge.x"
                :y="badge.y"
                dominant-baseline="central"
                text-anchor="middle"
                font-family="system-ui, sans-serif"
                font-size="3.2"
                font-weight="bold"
                fill="#0f172a"
              >
                {{ region.id + 1 }}
              </text>
            </g>
          </template>
        </g>
      </svg>
    </div>

    <!-- Screen-reader Region List Fallback -->
    <details class="canvas-sr-details">
      <summary class="canvas-sr-summary">
        Text region breakdown{{ mode === 'shade' ? ' & toggle controls' : '' }}
      </summary>
      <ul class="canvas-sr-list">
        <li
          v-for="region in regions"
          :key="`sr-${region.id}`"
        >
          <span class="fallback-region-desc">{{ regionAriaLabel(region) }}</span>
          <button
            v-if="mode === 'shade'"
            type="button"
            class="btn-sr-toggle"
            :disabled="isSolved && !isTeacher"
            @click="onRegionClick(region.id)"
          >
            Toggle Shading
          </button>
        </li>
      </ul>
    </details>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  buildShapeRegions,
  findLabelBoxPosition,
  findObstacleFreeBadgePoint,
  findOutlineAnchorPoint,
  geometryToPathData,
} from '@shared/shape-puzzles/geometry.js';
import { createRectangle } from '@shared/shape-puzzles/shapes.js';
import { SHAPE_STYLES } from '@shared/shape-puzzles/render/layout.js';
import { getSheetOverlay } from '@shared/shape-puzzles/reveal-overlays/index.js';

const props = defineProps({
  sheet: {
    type: Object,
    required: true,
  },
  shadedRegionIds: {
    type: Set,
    required: true,
  },
  outputsCorrect: {
    type: Boolean,
    default: false,
  },
  shadingChecked: {
    type: Boolean,
    default: false,
  },
  shadingCorrect: {
    type: Boolean,
    default: false,
  },
  isSolved: {
    type: Boolean,
    default: false,
  },
  isTeacher: {
    type: Boolean,
    default: false,
  },
  activeHoverRow: {
    type: Number,
    default: null,
  },
  activeFocusRow: {
    type: Number,
    default: null,
  },
  isGreyscale: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'shade',
    validator: (v) => ['table', 'shade'].includes(v),
  },
});

const emit = defineEmits([
  'toggle-region',
  'check-shading',
  'clear-shading',
  'region-hover',
  'region-focus',
]);

const viewBox = computed(() => ({
  width: props.sheet.viewBox?.width ?? 180,
  height: props.sheet.viewBox?.height ?? 95,
}));

const framePolygon = computed(() => {
  return (
    props.sheet.framePolygon ??
    createRectangle({ x: 0, y: 0, width: viewBox.value.width, height: viewBox.value.height })
  );
});

const framePathD = computed(() => geometryToPathData(framePolygon.value));

const regions = computed(() => {
  return buildShapeRegions({
    variables: props.sheet.variables,
    shapes: props.sheet.shapes,
    framePolygon: framePolygon.value,
  });
});

const trueRowsSet = computed(() => new Set(props.sheet.intendedTrueRows || []));

const currentOverlay = computed(() => {
  return props.sheet?.id ? getSheetOverlay(props.sheet.id, props.sheet?.setId) : [];
});

function isRegionIntendedTrue(id) {
  return trueRowsSet.value.has(id);
}

// Color palette for shape outlines and outside labels (Plan-38 Option c)
const COLOR_MAP = {
  A: '#2563eb', // Blue
  B: '#dc2626', // Crimson
  C: '#059669', // Emerald
};

const shapeOutlines = computed(() => {
  return (props.sheet.variables || []).map((v) => {
    const geom = props.sheet.shapes[v];
    const pathD = geometryToPathData(geom);
    const baseStyle = SHAPE_STYLES[v] || { strokeWidth: '0.7', dashArray: 'none', stroke: '#111' };
    const override = props.sheet.shapeStyles?.[v] || {};
    const style = { ...baseStyle, ...override };

    return {
      variable: v,
      pathD,
      stroke: COLOR_MAP[v] || '#0f172a',
      strokeWidth: style.strokeWidth || '0.7',
      dashArray: style.dashArray,
    };
  });
});

const labelBoxes = computed(() => {
  const vbW = viewBox.value.width;
  const vbH = viewBox.value.height;
  const placedBoxes = [];
  const leaderLines = [];
  const results = [];
  const allShapes = (props.sheet.variables || []).map((v) => props.sheet.shapes[v]);

  for (const v of props.sheet.variables || []) {
    const shapeGeom = props.sheet.shapes[v];
    const otherVars = (props.sheet.variables || []).filter((x) => x !== v);
    const otherShapes = otherVars.map((x) => props.sheet.shapes[x]);
    const baseStyle = SHAPE_STYLES[v] || {
      strokeWidth: '0.7',
      dashArray: 'none',
      stroke: '#111',
      targetAngle: Math.PI * 0.5,
    };
    const override = props.sheet.shapeStyles?.[v] || {};
    const style = { ...baseStyle, ...override };

    const anchor = findOutlineAnchorPoint(shapeGeom, otherShapes, {
      targetAngle: style.targetAngle,
      centerX: vbW / 2,
      centerY: vbH / 2,
      minClearanceMm: 6.0,
    });

    const boxWidth = 27.0;
    const boxHeight = 15.0;
    const hw = boxWidth / 2;
    const hh = boxHeight / 2;

    const pos = findLabelBoxPosition(
      v,
      anchor,
      allShapes,
      props.sheet.viewBox,
      placedBoxes,
      boxWidth,
      boxHeight,
    );
    placedBoxes.push(pos.box);

    const badgeX = pos.x;
    const badgeY = pos.y;

    const vx = anchor.x - badgeX;
    const vy = anchor.y - badgeY;
    const t = Math.min(hw / Math.abs(vx || 1e-6), hh / Math.abs(vy || 1e-6));
    const startX = badgeX + vx * t;
    const startY = badgeY + vy * t;

    leaderLines.push({ x1: startX, y1: startY, x2: anchor.x, y2: anchor.y });

    results.push({
      variable: v,
      anchor,
      lineStart: { x: startX, y: startY },
      box: { x: badgeX - hw, y: badgeY - hh, width: boxWidth, height: boxHeight },
      textPos: { x: badgeX, y: badgeY - 2.0 },
      swatch: { x1: badgeX - 11.5, x2: badgeX + 11.5, y: badgeY + 4.2 },
      strokeWidth: style.strokeWidth,
      dashArray: style.dashArray,
      color: COLOR_MAP[v] || '#0f172a',
    });
  }

  return results;
});

const regionBadges = computed(() => {
  const map = {};
  const placedBoxes = labelBoxes.value.map((l) => l.box);
  const leaderLines = labelBoxes.value.map((l) => ({
    x1: l.lineStart.x,
    y1: l.lineStart.y,
    x2: l.anchor.x,
    y2: l.anchor.y,
  }));

  const reg0 = regions.value.find((r) => r.includedVariables.length === 0);
  const badge0Point = reg0
    ? findObstacleFreeBadgePoint(reg0, placedBoxes, leaderLines, props.sheet.viewBox, 2.6)
    : { x: 154, y: 78 };

  const minBadgePieceDiaMm = 2 * (2.6 + 1.0);

  for (const r of regions.value) {
    if (r.includedVariables.length === 0) {
      map[r.id] = [badge0Point];
    } else {
      // For disconnected split regions, badge each valid piece
      const validPieces = r.pieces.filter((p) => p.inscribedCircleDiaMm >= minBadgePieceDiaMm);
      if (validPieces.length > 0) {
        map[r.id] = validPieces.map((p) => p.center);
      } else {
        map[r.id] = [r.pieces[0]?.center || { x: 90, y: 45 }];
      }
    }
  }
  return map;
});

function getRegionFill(id) {
  // When solved: solid vibrant picture fill!
  if (props.isSolved) {
    if (isRegionIntendedTrue(id)) {
      return '#059669'; // Emerald picture fill
    }
    return '#f8fafc'; // Clean unshaded background
  }

  // During practice:
  if (props.shadedRegionIds.has(id)) {
    return '#2563eb'; // Vibrant clean blue two-state shading
  }
  return 'transparent'; // Clean unshaded
}

function getRegionStroke(id) {
  const displayRow = id + 1;
  if (props.activeFocusRow === displayRow) {
    return '#f59e0b'; // Amber high-contrast focus ring
  }
  if (props.activeHoverRow === displayRow) {
    return '#0284c7'; // Cyan hover ring
  }
  return 'none';
}

function getRegionStrokeWidth(id) {
  const displayRow = id + 1;
  if (props.activeFocusRow === displayRow || props.activeHoverRow === displayRow) {
    return '1.5';
  }
  return '0';
}

function regionAriaLabel(r) {
  const parts = [];
  if (props.sheet.showRegionRowNumbers) {
    parts.push(`Row ${r.id + 1}:`);
  }
  const inc =
    r.includedVariables.length > 0 ? `inside ${r.includedVariables.join(' and ')}` : 'outside all shapes';
  const exc = (props.sheet.variables || []).filter((v) => !r.includedVariables.includes(v));
  const excText =
    exc.length > 0 && r.includedVariables.length > 0 ? `, outside ${exc.join(' and ')}` : '';
  parts.push(`${inc}${excText}`);
  if (props.mode === 'shade') {
    const state = props.shadedRegionIds.has(r.id) ? 'shaded' : 'unshaded';
    parts.push(`currently ${state}`);
  }
  return parts.join(' ');
}

function onRegionClick(id) {
  if (props.mode === 'table') return;
  if (props.isSolved && !props.isTeacher) return;
  emit('toggle-region', id);
}
</script>

<style scoped>
.shape-puzzle-canvas-root {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

/* Greyscale Mode */
.shape-puzzle-canvas-root.is-greyscale {
  filter: grayscale(100%);
}

.canvas-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 14px 6px 14px;
  border-bottom: 1px solid #e2e8f0;
}

.canvas-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.canvas-subtitle {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.canvas-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.btn-canvas-action {
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
  background: #059669;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-canvas-action:hover:not(:disabled) {
  background: #047857;
}

.btn-canvas-action:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-canvas-secondary {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn-canvas-secondary:hover:not(:disabled) {
  background: #f1f5f9;
}

.svg-stage-container {
  padding: 8px 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.shape-puzzle-svg {
  display: block;
  width: 100%;
  max-height: 330px;
  background: #ffffff;
  overflow: visible;
}

/* Outer boundary frame */
.frame-boundary {
  stroke: #475569;
  stroke-width: 0.5px;
}

/* Reveal Overlay Layer */
.reveal-overlay-layer {
  pointer-events: none;
}

.overlay-prim {
  animation: overlay-draw-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes overlay-draw-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay-prim {
    animation: none !important;
  }
}

.overlay-detail-stroke {
  fill: none;
  stroke: var(--overlay-detail-stroke, #0f172a);
  stroke-width: 0.45;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.overlay-detail-fill {
  fill: var(--overlay-detail-fill, rgba(255, 255, 255, 0.9));
  stroke: var(--overlay-detail-stroke, #0f172a);
  stroke-width: 0.35;
  stroke-linejoin: round;
}

.overlay-accent {
  fill: var(--overlay-accent, #f59e0b);
  stroke: var(--overlay-accent-stroke, #d97706);
  stroke-width: 0.4;
  stroke-linejoin: round;
}

.overlay-highlight {
  fill: var(--overlay-highlight, #ffffff);
  stroke: var(--overlay-highlight, #ffffff);
  stroke-width: 0.3;
}

.overlay-star {
  fill: var(--overlay-star, #fbbf24);
  stroke: var(--overlay-accent-stroke, #d97706);
  stroke-width: 0.35;
  stroke-linecap: round;
}

.region-group {
  cursor: pointer;
  outline: none;
  transition: opacity 0.12s ease;
}

.region-group.is-static {
  cursor: default;
}

.region-group:hover:not(.is-solved):not(.is-static) .region-path {
  fill-opacity: 0.85;
}

.region-group.is-focused .region-path {
  filter: url(#focus-glow);
}

/* Accessibility Details */
.canvas-sr-details {
  padding: 6px 14px 10px 14px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.78rem;
  color: #64748b;
}

.canvas-sr-summary {
  cursor: pointer;
  user-select: none;
}

.canvas-sr-list {
  margin: 6px 0 0 0;
  padding-left: 20px;
}

.canvas-sr-list li {
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-sr-toggle {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  cursor: pointer;
}
</style>

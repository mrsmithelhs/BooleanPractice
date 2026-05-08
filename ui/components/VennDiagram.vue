<template>
  <article
    class="venn-diagram"
    :class="`venn-diagram--${diagramModel.variables.length}`"
    :aria-label="ariaLabel"
  >
    <div class="venn-diagram__stage">
      <svg
        class="venn-diagram__svg"
        viewBox="-4 -8 108 116"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern
            :id="neutralPatternId"
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
            patternTransform="rotate(45)"
          >
            <rect
              width="8"
              height="8"
              fill="rgba(109, 174, 255, 0.06)"
            />
            <rect
              x="0"
              y="0"
              width="3"
              height="8"
              fill="rgba(188, 208, 255, 0.26)"
            />
          </pattern>
        </defs>

        <g class="venn-diagram__region-layer">
          <template
            v-for="region in orderedRegions"
            :key="region.id"
          >
            <path
              v-bind="regionHitAttrs(region)"
              :style="regionFillStyle(region)"
              :d="region.pathD"
              @click="handleRegionClick(region.id)"
              @keydown.enter.prevent="handleRegionKeydown(region.id)"
              @keydown.space.prevent="handleRegionKeydown(region.id)"
            />
          </template>
        </g>

        <g
          class="venn-diagram__circle-layer"
          pointer-events="none"
        >
          <g
            v-for="circle in diagramModel.circles"
            :key="circle.variable"
          >
            <circle
              class="venn-diagram__circle"
              :class="`venn-diagram__circle--${circle.variableIndex}`"
              :cx="circle.cx"
              :cy="circle.cy"
              :r="circle.r"
            />
            <text
              class="venn-diagram__circle-label"
              :x="circle.labelX"
              :y="circle.labelY"
            >
              {{ circle.variable }}
            </text>
          </g>
        </g>

        <g
          v-if="showDetailedLabels"
          class="venn-diagram__text-layer"
          pointer-events="none"
        >
          <g
            v-for="region in diagramModel.regions"
            :key="`${region.id}-text`"
          >
            <text
              class="venn-diagram__region-label"
              :x="region.anchor.x"
              :y="region.anchor.y"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              <tspan
                v-for="(line, index) in region.labelLines"
                :key="`${region.id}-line-${index}`"
                :x="region.anchor.x"
                :dy="region.labelLines.length > 1 ? (index === 0 ? '-0.35em' : '1.05em') : '0'"
              >
                {{ line }}
              </tspan>
            </text>
          </g>
        </g>
      </svg>
    </div>

    <section
      v-if="showLegend"
      class="venn-diagram__legend"
      :aria-label="`${diagramLabel} legend`"
    >
      <span
        v-for="item in legendItems"
        :key="item.state"
        class="venn-diagram__legend-item"
      >
        <span
          class="venn-diagram__legend-icon"
          aria-hidden="true"
        >
          {{ item.icon }}
        </span>
        <span>{{ item.label }}</span>
      </span>
    </section>

    <details
      v-if="showFallbackList"
      class="details-card venn-diagram__fallback"
    >
      <summary class="details-card__summary">
        {{ fallbackLabel }}
      </summary>
      <ul class="venn-diagram__fallback-list">
        <li
          v-for="region in diagramModel.regions"
          :key="region.id"
        >
          <strong>{{ region.bits }}</strong>
          <span>{{ region.displayLabel }}</span>
          <span>({{ region.label }})</span>
        </li>
      </ul>
    </details>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { buildVennDiagramModel } from '@shared/index';

const props = defineProps({
  variables: {
    type: Array,
    required: true,
  },
  regions: {
    type: Array,
    required: true,
  },
  stateByRegionId: {
    type: Object,
    default: () => ({}),
  },
  focusRegionIds: {
    type: Array,
    default: () => [],
  },
  interactive: {
    type: Boolean,
    default: false,
  },
  showLegend: {
    type: Boolean,
    default: true,
  },
  showFallbackList: {
    type: Boolean,
    default: false,
  },
  showDetailedLabels: {
    type: Boolean,
    default: false,
  },
  fallbackLabel: {
    type: String,
    default: 'Exact region list',
  },
  diagramLabel: {
    type: String,
    default: 'Venn diagram',
  },
  ariaLabel: {
    type: String,
    default: 'Venn diagram',
  },
  testIdPrefix: {
    type: String,
    default: 'venn-region',
  },
});

const emit = defineEmits(['toggle-region']);
const diagramInstanceId = `venn-${Math.random().toString(36).slice(2, 10)}`;
const neutralPatternId = `${diagramInstanceId}-neutral-pattern`;

const diagramModel = computed(() =>
  buildVennDiagramModel(
    {
      variables: props.variables,
      regions: props.regions,
    },
    {
      stateByRegionId: props.stateByRegionId,
      focusRegionIds: props.focusRegionIds,
    },
  ),
);

const legendItems = computed(() => [
  { state: 'selected', label: 'Selected', icon: '●' },
  { state: 'correct', label: 'Correct', icon: '✓' },
  { state: 'missed', label: 'Missed', icon: '!' },
  { state: 'extra', label: 'Extra', icon: '×' },
  { state: 'available', label: 'Available', icon: '○' },
]);

const orderedRegions = computed(() =>
  [...diagramModel.value.regions].sort((left, right) => {
    const specificityDelta = left.includedVariables.length - right.includedVariables.length;

    if (specificityDelta !== 0) {
      return specificityDelta;
    }

    return left.id - right.id;
  }),
);

function regionHitAttrs(region) {
  return {
    class: ['venn-diagram__region-hit', regionHitClasses(region)],
    'data-testid': `${props.testIdPrefix}-${region.id}`,
    'data-region-state': region.state,
    'aria-label': props.interactive ? region.ariaLabel : undefined,
    'aria-pressed': props.interactive ? String(isRegionSelected(region.id)) : undefined,
    'aria-disabled': props.interactive ? 'false' : undefined,
    'aria-hidden': props.interactive ? undefined : 'true',
    role: props.interactive ? 'button' : undefined,
    tabindex: props.interactive ? 0 : undefined,
    focusable: props.interactive ? 'true' : 'false',
    title: props.showDetailedLabels ? undefined : region.ariaLabel,
  };
}

function regionFillStyle(region) {
  if (region.state === 'neutral') {
    return { fill: `url(#${neutralPatternId})` };
  }

  return null;
}

function regionHitClasses(region) {
  // Three-state visual contract for the SVG region hit areas:
  // - selected: true / shaded
  // - available: false / explicitly unselected
  // - neutral: unset / pending and not yet ready for inspection
  return {
    [`venn-diagram__region-hit--${region.state}`]: true,
    'venn-diagram__region-hit--focused': region.focused,
    'venn-diagram__region-hit--interactive': props.interactive,
  };
}

function handleRegionClick(regionId) {
  if (!props.interactive) {
    return;
  }

  emit('toggle-region', regionId);
}

function handleRegionKeydown(regionId) {
  handleRegionClick(regionId);
}

function isRegionSelected(regionId) {
  return props.stateByRegionId[regionId] === 'selected' || props.stateByRegionId[regionId] === 'correct';
}
</script>

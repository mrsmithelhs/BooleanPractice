<template>
  <article
    class="venn-diagram"
    :class="`venn-diagram--${diagramModel.variables.length}`"
    :aria-label="ariaLabel"
  >
    <div class="venn-diagram__stage">
      <svg
        class="venn-diagram__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <template
            v-for="region in diagramModel.regions"
            :key="region.id"
          >
            <clipPath
              :id="clipPathId(region.id)"
              clipPathUnits="userSpaceOnUse"
            >
              <circle
                v-for="variable in region.includedVariables"
                :key="`${region.id}-clip-${variable}`"
                :cx="circleByVariable[variable].cx"
                :cy="circleByVariable[variable].cy"
                :r="circleByVariable[variable].r"
              />
            </clipPath>
            <mask
              :id="maskId(region.id)"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
            >
              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="white"
              />
              <circle
                v-for="variable in region.excludedVariables"
                :key="`${region.id}-mask-${variable}`"
                :cx="circleByVariable[variable].cx"
                :cy="circleByVariable[variable].cy"
                :r="circleByVariable[variable].r"
                fill="black"
              />
            </mask>
          </template>
        </defs>

        <g class="venn-diagram__region-layer">
          <rect
            v-for="region in diagramModel.regions"
            :key="region.id"
            class="venn-diagram__region-hit"
            :class="regionHitClasses(region)"
            x="0"
            y="0"
            width="100"
            height="100"
            :clip-path="region.includedVariables.length > 0 ? clipPathUrl(region.id) : undefined"
            :mask="region.excludedVariables.length > 0 ? maskUrl(region.id) : undefined"
            :data-testid="`${testIdPrefix}-${region.id}`"
            :aria-label="interactive ? region.ariaLabel : undefined"
            :aria-pressed="interactive ? String(isRegionSelected(region.id)) : undefined"
            :aria-disabled="interactive ? 'false' : undefined"
            :aria-hidden="interactive ? undefined : 'true'"
            :role="interactive ? 'button' : undefined"
            :tabindex="interactive ? 0 : undefined"
            :focusable="interactive ? 'true' : 'false'"
            :title="showDetailedLabels ? undefined : region.ariaLabel"
            @click="handleRegionClick(region.id)"
            @keydown.enter.prevent="handleRegionKeydown(region.id)"
            @keydown.space.prevent="handleRegionKeydown(region.id)"
          />
        </g>

        <g class="venn-diagram__circle-layer">
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
            :transform="`translate(${region.anchor.x}, ${region.anchor.y})`"
          >
            <text
              class="venn-diagram__region-icon"
              text-anchor="middle"
              x="0"
              y="0"
            >
              {{ region.icon }}
            </text>
            <text
              class="venn-diagram__region-label"
              text-anchor="middle"
              x="0"
              y="4.2"
            >
              <tspan
                x="0"
                dy="0"
              >
                {{ region.displayLabel }}
              </tspan>
            </text>
            <text
              class="venn-diagram__region-bits"
              text-anchor="middle"
              x="0"
              y="8.5"
            >
              <tspan
                x="0"
                dy="0"
              >
                {{ region.bits }}
              </tspan>
            </text>
            <text
              class="venn-diagram__region-state"
              text-anchor="middle"
              x="0"
              y="12.5"
            >
              <tspan
                x="0"
                dy="0"
              >
                {{ region.stateLabel }}
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

const circleByVariable = computed(() =>
  Object.fromEntries(diagramModel.value.circles.map((circle) => [circle.variable, circle])),
);

const legendItems = computed(() => [
  { state: 'selected', label: 'Selected', icon: '●' },
  { state: 'correct', label: 'Correct', icon: '✓' },
  { state: 'missed', label: 'Missed', icon: '!' },
  { state: 'extra', label: 'Extra', icon: '×' },
  { state: 'available', label: 'Available', icon: '○' },
]);

function clipPathId(regionId) {
  return `${diagramInstanceId}-clip-${regionId}`;
}

function maskId(regionId) {
  return `${diagramInstanceId}-mask-${regionId}`;
}

function clipPathUrl(regionId) {
  return `url(#${clipPathId(regionId)})`;
}

function maskUrl(regionId) {
  return `url(#${maskId(regionId)})`;
}

function regionHitClasses(region) {
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

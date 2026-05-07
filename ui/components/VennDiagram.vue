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
        aria-hidden="true"
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
      </svg>

      <div class="venn-diagram__regions">
        <button
          v-for="region in diagramModel.regions"
          :key="region.id"
          type="button"
          class="venn-diagram__region"
          :class="regionClasses(region)"
          :style="regionStyle(region)"
          :data-testid="`${testIdPrefix}-${region.id}`"
          :aria-label="region.ariaLabel"
          :aria-pressed="interactive ? String(isRegionSelected(region.id)) : undefined"
          :aria-disabled="interactive ? 'false' : 'true'"
          @click="handleRegionClick(region.id)"
          @keydown.enter.prevent="handleRegionClick(region.id)"
          @keydown.space.prevent="handleRegionClick(region.id)"
        >
          <span
            class="venn-diagram__region-icon"
            aria-hidden="true"
          >
            {{ region.icon }}
          </span>
          <span class="venn-diagram__region-label">
            {{ region.displayLabel }}
          </span>
          <span class="venn-diagram__region-bits">
            {{ region.bits }}
          </span>
          <span class="venn-diagram__region-state">
            {{ region.stateLabel }}
          </span>
        </button>
      </div>
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

function regionStyle(region) {
  return {
    left: `${region.anchor.x}%`,
    top: `${region.anchor.y}%`,
    width: `${region.anchor.width}%`,
    height: `${region.anchor.height}%`,
  };
}

function regionClasses(region) {
  return {
    [`venn-diagram__region--${region.state}`]: true,
    'venn-diagram__region--focused': region.focused,
    'venn-diagram__region--interactive': props.interactive,
  };
}

function handleRegionClick(regionId) {
  if (!props.interactive) {
    return;
  }

  emit('toggle-region', regionId);
}

function isRegionSelected(regionId) {
  return props.stateByRegionId[regionId] === 'selected' || props.stateByRegionId[regionId] === 'correct';
}
</script>

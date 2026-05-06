<template>
  <article
    v-if="comparison?.pairs?.length"
    class="assignment-region-comparison mini-card"
    :data-testid="testId"
  >
    <div class="assignment-region-comparison__header">
      <div>
        <p class="problem-review-summary__eyebrow">
          Cross-Representation Comparison
        </p>
        <h4>Truth Table Rows And Venn Regions</h4>
        <p class="assignment-region-comparison__lede">
          Each row and region below describe the same assignment. Select one pair to inspect the
          matching row and region together.
        </p>
      </div>
      <div class="assignment-region-comparison__meta">
        <span class="badge">{{ comparison.pairs.length }} shared assignments</span>
        <span class="badge badge--subtle">{{ comparison.variables.join(', ') }}</span>
      </div>
    </div>

    <div class="assignment-region-comparison__layout">
      <div
        class="assignment-region-comparison__picker"
        role="group"
        :aria-label="`Comparison pairs for ${comparison.expression}`"
      >
        <button
          v-for="pair in comparison.pairs"
          :key="pair.id"
          type="button"
          class="assignment-region-comparison__pair"
          :class="{ 'assignment-region-comparison__pair--selected': selectedPairId === pair.id }"
          :data-testid="`comparison-pair-${pair.id}`"
          :aria-pressed="selectedPairId === pair.id"
          :aria-label="pairAriaLabel(pair)"
          @click="selectedPairId = pair.id"
          @keydown.enter.prevent="selectedPairId = pair.id"
          @keydown.space.prevent="selectedPairId = pair.id"
        >
          <span class="assignment-region-comparison__pair-label">Row {{ pair.rowNumber }}</span>
          <strong>{{ pair.assignmentLabel }}</strong>
          <span class="assignment-region-comparison__pair-subtle">{{ pair.assignmentBits }}</span>
          <span class="assignment-region-comparison__pair-subtle">Region {{ pair.regionBits }}</span>
        </button>
      </div>

      <div
        v-if="activePair"
        class="assignment-region-comparison__detail"
        aria-live="polite"
      >
        <article
          class="assignment-region-comparison__card assignment-region-comparison__card--row"
          :class="{ 'assignment-region-comparison__card--selected': activePair }"
          :data-testid="`comparison-row-${activePair.id}`"
        >
          <p class="assignment-region-comparison__card-eyebrow">
            Truth Table Row {{ activePair.rowNumber }}
          </p>
          <h5>{{ activePair.assignmentLabel }}</h5>
          <p>{{ activePair.assignmentAccessibleLabel }}</p>
          <p class="assignment-region-comparison__card-result">
            Row result: {{ formatBoolean(activePair.rowResult) }}
          </p>
        </article>

        <article
          class="assignment-region-comparison__card assignment-region-comparison__card--region"
          :class="{ 'assignment-region-comparison__card--selected': activePair }"
          :data-testid="`comparison-region-${activePair.regionId}`"
        >
          <p class="assignment-region-comparison__card-eyebrow">
            Matching Venn Region {{ activePair.regionBits }}
          </p>
          <h5>{{ activePair.regionLabel }}</h5>
          <p>{{ activePair.regionAccessibleLabel }}</p>
          <p class="assignment-region-comparison__card-result">
            Region result: {{ formatBoolean(activePair.regionResult) }}
          </p>
        </article>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  comparison: {
    type: Object,
    default: null,
  },
  testId: {
    type: String,
    default: 'assignment-region-comparison',
  },
});

const selectedPairId = ref(props.comparison?.pairs?.[0]?.id ?? null);

watch(
  () => props.comparison?.pairs?.[0]?.id ?? null,
  (nextSelectedId) => {
    selectedPairId.value = nextSelectedId;
  },
  { immediate: true },
);

const activePair = computed(
  () =>
    props.comparison?.pairs.find((pair) => pair.id === selectedPairId.value) ??
    props.comparison?.pairs[0] ??
    null,
);

function formatBoolean(value) {
  return value ? 'T' : 'F';
}

function pairAriaLabel(pair) {
  return `Row ${pair.rowNumber}, ${pair.assignmentLabel}, matching region ${pair.regionBits}`;
}
</script>

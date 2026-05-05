<template>
  <section
    class="venn-practice"
    aria-labelledby="venn-practice-heading"
    data-testid="venn-practice"
  >
    <div class="venn-practice__header">
      <div>
        <p class="venn-practice__eyebrow">
          Venn Practice
        </p>
        <h2 id="venn-practice-heading">
          {{ problem.title }}
        </h2>
        <p class="venn-practice__expression">
          {{ vennBlueprint.expression }}
        </p>
      </div>

      <div class="venn-practice__meta">
        <span class="badge">Step {{ currentStepPosition }}</span>
        <span
          class="badge badge--subtle"
          data-testid="venn-current-step"
        >
          {{ revealedStepCount }}/{{ stepDefinitions.length }} revealed
        </span>
      </div>
    </div>

    <div class="venn-practice__summary-grid">
      <article class="mini-card">
        <h3>Current Step</h3>
        <p>
          {{ currentStepLabel }}
        </p>
      </article>

      <article class="mini-card">
        <h3>Operand Preview</h3>
        <ul class="venn-practice__preview-list">
          <li
            v-for="item in currentStepPreview"
            :key="item.label"
          >
            <strong>{{ item.label }}:</strong> {{ item.expression }}
          </li>
        </ul>
      </article>

      <article class="mini-card">
        <h3>Region Count</h3>
        <p>
          {{ vennBlueprint.regions.length }} regions based on {{ vennBlueprint.variables.join(', ') }}
        </p>
      </article>
    </div>

    <div class="venn-practice__toolbar">
      <button
        type="button"
        class="action-button"
        data-testid="venn-check-selection"
        @click="checkCurrentStep"
      >
        Check Regions
      </button>
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="venn-reset"
        @click="resetPractice"
      >
        Reset Regions
      </button>
    </div>

    <p
      class="venn-practice__status"
      aria-live="polite"
      data-testid="venn-feedback"
    >
      {{ feedbackMessage }}
    </p>

    <div
      v-if="latestCheck"
      class="venn-practice__review"
      aria-live="polite"
    >
      <h3>Region Feedback</h3>
      <ul>
        <li v-if="latestCheck.missedRegions.length">
          Missed regions: {{ latestCheck.missedRegions.map((region) => region.label).join(', ') }}
        </li>
        <li v-if="latestCheck.extraRegions.length">
          Extra regions: {{ latestCheck.extraRegions.map((region) => region.label).join(', ') }}
        </li>
      </ul>
    </div>

    <div
      class="venn-practice__diagram"
      :class="`venn-practice__diagram--${vennBlueprint.regions.length}`"
      role="group"
      :aria-label="`Venn regions for ${problem.title}`"
    >
      <button
        v-for="region in vennBlueprint.regions"
        :key="region.id"
        type="button"
        class="venn-region"
        :class="regionClasses(region.id)"
        :data-testid="`venn-region-${region.id}`"
        :aria-pressed="isRegionSelected(region.id)"
        :aria-label="regionAriaLabel(region)"
        @click="toggleRegion(region.id)"
        @keydown.enter.prevent="toggleRegion(region.id)"
        @keydown.space.prevent="toggleRegion(region.id)"
      >
        <span class="venn-region__bits">{{ region.bits }}</span>
        <span class="venn-region__label">{{ region.label }}</span>
        <span class="venn-region__state">{{ regionStateLabel(region.id) }}</span>
      </button>
    </div>

    <div class="venn-practice__footer">
      <article class="mini-card">
        <h3>Selection Guide</h3>
        <p>
          Select every region that makes {{ currentStepLabel }} true. The region buttons are
          keyboard-accessible and stay in sync with the feedback below.
        </p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { evaluateBooleanAst, formatBooleanExpression, generateTruthTable, generateVennRegions } from '@shared/index';

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
});

const problemSource = computed(() => props.problem.ast ?? props.problem.expression);

const vennBlueprint = computed(() => generateVennRegions(problemSource.value));
const truthTable = computed(() => generateTruthTable(problemSource.value));

const stepDefinitions = computed(() =>
  truthTable.value.subexpressions.length > 0
    ? truthTable.value.subexpressions
    : [
        {
          id: 'result',
          label: truthTable.value.expression,
          node: truthTable.value.ast,
        },
      ],
);

const currentStepIndex = ref(0);
const feedbackMessage = ref('Select the regions that make the current step true, then check your work.');
const latestCheck = ref(null);
const stepStatuses = reactive({});
const selectionsByStep = reactive({});

const currentStep = computed(() => {
  if (currentStepIndex.value >= stepDefinitions.value.length) {
    return null;
  }

  const step = stepDefinitions.value[currentStepIndex.value];
  return stepStatuses[step.id] === 'correct' ? null : step;
});

const currentStepLabel = computed(() => currentStep.value?.label ?? 'All regions are complete');

const currentStepPosition = computed(() => {
  if (!currentStep.value) {
    return '0';
  }

  return `${Math.min(currentStepIndex.value + 1, stepDefinitions.value.length)}`;
});

const revealedStepCount = computed(() => {
  const completed = stepDefinitions.value.filter((step) => stepStatuses[step.id] === 'correct').length;
  return completed + (currentStep.value ? 1 : 0);
});

const currentSelection = computed(() => {
  if (!currentStep.value) {
    return [];
  }

  return ensureSelectionForStep(currentStep.value.id);
});

const currentStepPreview = computed(() => {
  if (!currentStep.value) {
    return [];
  }

  return describeStepPreview(currentStep.value.node);
});

watch(
  () => props.problem?.id,
  () => {
    resetPractice();
  },
  { immediate: true },
);

function resetPractice() {
  currentStepIndex.value = 0;
  feedbackMessage.value = `Work through ${currentStepLabel.value}.`;
  latestCheck.value = null;

  Object.keys(stepStatuses).forEach((key) => {
    delete stepStatuses[key];
  });

  Object.keys(selectionsByStep).forEach((key) => {
    delete selectionsByStep[key];
  });

  if (stepDefinitions.value.length > 0) {
    ensureSelectionForStep(stepDefinitions.value[0].id);
  }
}

function ensureSelectionForStep(stepId) {
  if (!selectionsByStep[stepId]) {
    selectionsByStep[stepId] = [];
  }

  return selectionsByStep[stepId];
}

function toggleRegion(regionId) {
  if (!currentStep.value) {
    return;
  }

  const selection = ensureSelectionForStep(currentStep.value.id);
  const index = selection.indexOf(regionId);

  if (index === -1) {
    selection.push(regionId);
  } else {
    selection.splice(index, 1);
  }

  latestCheck.value = null;
  feedbackMessage.value = `Select the regions that make ${currentStepLabel.value} true, then check your work.`;
}

function isRegionSelected(regionId) {
  return currentSelection.value.includes(regionId);
}

function regionStateLabel(regionId) {
  if (!currentStep.value) {
    return 'complete';
  }

  if (latestCheck.value?.missedRegionIds.includes(regionId)) {
    return 'missed';
  }

  if (latestCheck.value?.extraRegionIds.includes(regionId)) {
    return 'extra';
  }

  if (stepStatuses[currentStep.value.id] === 'correct') {
    return 'correct';
  }

  return isRegionSelected(regionId) ? 'selected' : 'available';
}

function regionClasses(regionId) {
  return {
    'venn-region--selected': isRegionSelected(regionId),
    'venn-region--missed': latestCheck.value?.missedRegionIds.includes(regionId),
    'venn-region--extra': latestCheck.value?.extraRegionIds.includes(regionId),
    'venn-region--correct': stepStatuses[currentStep.value?.id] === 'correct' && isRegionSelected(regionId),
  };
}

function regionAriaLabel(region) {
  const state = isRegionSelected(region.id) ? 'selected' : 'not selected';
  return `${region.accessibleLabel}, ${state}`;
}

function expectedRegionIdsForStep(step) {
  return vennBlueprint.value.regions
    .filter((region) => evaluateBooleanAst(step.node, region.assignment))
    .map((region) => region.id);
}

function describeStepPreview(node) {
  if (!node) {
    return [];
  }

  switch (node.type) {
    case 'UnaryExpression':
      return [
        {
          label: 'Operand',
          expression: formatBooleanExpression(node.argument),
        },
      ];
    case 'BinaryExpression':
      return [
        {
          label: 'Left operand',
          expression: formatBooleanExpression(node.left),
        },
        {
          label: 'Right operand',
          expression: formatBooleanExpression(node.right),
        },
      ];
    default:
      return [
        {
          label: 'Expression',
          expression: formatBooleanExpression(node),
        },
      ];
  }
}

function describeStepReasoning(step) {
  switch (step.node.type) {
    case 'UnaryExpression':
      return `Start with the operand ${formatBooleanExpression(step.node.argument)}, then invert those regions for ${step.label}.`;
    case 'BinaryExpression':
      if (step.node.operator === '&&') {
        return `A region belongs only when both ${formatBooleanExpression(step.node.left)} and ${formatBooleanExpression(step.node.right)} are true.`;
      }

      if (step.node.operator === '||') {
        return `A region belongs when either ${formatBooleanExpression(step.node.left)} or ${formatBooleanExpression(step.node.right)} is true.`;
      }

      return `Use the operands to decide ${step.label}.`;
    default:
      return `Select every region where ${step.label} is true.`;
  }
}

function checkCurrentStep() {
  if (!currentStep.value) {
    feedbackMessage.value = 'All Venn regions are complete.';
    return;
  }

  const selection = [...currentSelection.value];
  const expectedRegionIds = expectedRegionIdsForStep(currentStep.value);
  const expectedSet = new Set(expectedRegionIds);
  const selectedSet = new Set(selection);
  const regionById = new Map(vennBlueprint.value.regions.map((region) => [region.id, region]));
  const missedRegionIds = expectedRegionIds.filter((regionId) => !selectedSet.has(regionId));
  const extraRegionIds = selection.filter((regionId) => !expectedSet.has(regionId));

  latestCheck.value = {
    missedRegionIds,
    extraRegionIds,
    missedRegions: missedRegionIds.map((regionId) => regionById.get(regionId)).filter(Boolean),
    extraRegions: extraRegionIds.map((regionId) => regionById.get(regionId)).filter(Boolean),
  };

  if (missedRegionIds.length > 0 || extraRegionIds.length > 0) {
    const missedLabels = latestCheck.value.missedRegions.map((region) => region.label).join(', ');
    const extraLabels = latestCheck.value.extraRegions.map((region) => region.label).join(', ');
    const parts = [];

    if (missedLabels) {
      parts.push(`Missed regions: ${missedLabels}.`);
    }

    if (extraLabels) {
      parts.push(`Extra regions: ${extraLabels}.`);
    }

    parts.push(describeStepReasoning(currentStep.value));
    feedbackMessage.value = parts.join(' ');
    return;
  }

  const completedStepLabel = currentStep.value.label;
  stepStatuses[currentStep.value.id] = 'correct';

  if (currentStepIndex.value < stepDefinitions.value.length - 1) {
    currentStepIndex.value += 1;
    ensureSelectionForStep(stepDefinitions.value[currentStepIndex.value].id);
    feedbackMessage.value = `Great work. ${completedStepLabel} is complete, so ${currentStepLabel.value} is now revealed.`;
    return;
  }

  feedbackMessage.value = `Great work. ${completedStepLabel} is complete and the Venn answer is finished.`;
}
</script>

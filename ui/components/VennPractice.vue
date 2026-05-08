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
          {{ vennBlueprint.regions.length }} regions based on
          {{ vennBlueprint.variables.join(', ') }}
        </p>
      </article>

      <PredicateAtomLegend
        :atoms="predicateAtomLegend"
        test-id="venn-predicate-legend"
      />

      <article
        v-if="currentMemoryState"
        class="mini-card venn-practice__memory"
        data-testid="venn-session-memory"
      >
        <h3>Session Memory</h3>
        <p>
          {{ currentMemoryText }}
        </p>
        <p
          v-if="currentMemoryState.canAutofill"
          class="venn-practice__memory-note"
        >
          Remembered regions are ready for this step. You can restore them, clear the selection,
          or forget the stored memory for this session.
        </p>
        <div
          v-if="currentMemoryState.canAutofill"
          class="venn-practice__memory-actions"
        >
          <button
            type="button"
            class="action-button action-button--secondary"
            data-testid="venn-restore-memory"
            @click="restoreRememberedSelection"
          >
            Restore Remembered Regions
          </button>
          <button
            type="button"
            class="action-button action-button--secondary"
            data-testid="venn-forget-memory"
            @click="forgetRememberedSelection"
          >
            Forget Memory
          </button>
        </div>
      </article>
    </div>

    <div class="venn-practice__toolbar">
      <button
        type="button"
        class="action-button"
        data-testid="venn-check-selection"
        :disabled="!currentStep || currentStepHasNeutralRegions"
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

    <div
      class="venn-practice__bulk-actions"
      role="group"
      aria-label="Bulk edit controls"
    >
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="venn-shade-all"
        :disabled="!currentStep"
        @click="shadeAllRegions"
      >
        Shade All
      </button>
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="venn-clear-selection"
        :disabled="!currentStep"
        @click="clearCurrentSelection"
      >
        <span
          class="venn-practice__neutral-swatch"
          aria-hidden="true"
        />
        Clear / Neutral
      </button>
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="venn-copy-previous"
        :disabled="!hasPreviousStep"
        @click="copyPreviousStepSelection"
      >
        Copy Previous Step
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
        <li
          v-for="entry in latestCheck.details"
          :key="entry.key"
        >
          {{ entry.message }}
        </li>
      </ul>
    </div>

    <VennDiagram
      :variables="vennBlueprint.variables"
      :regions="vennBlueprint.regions"
      :state-by-region-id="diagramStateByRegionId"
      :focus-region-ids="diagramFocusRegionIds"
      :show-detailed-labels="showDetailedLabels"
      aria-label="Interactive Venn diagram"
      diagram-label="Interactive Venn diagram"
      test-id-prefix="venn-region"
      :interactive="true"
      :show-legend="true"
      @toggle-region="toggleRegion"
    />

    <ProblemReviewSummary
      v-if="completionSummary"
      :summary="completionSummary"
      :submission-payload="submissionPayload"
      test-id="venn-review-summary"
    />
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import {
  AUTOMATION_THRESHOLD,
  buildProblemReviewSummary,
  buildVennHint,
  clearSessionMemory,
  evaluateBooleanAst,
  formatBooleanExpression,
  buildSubmissionPayload,
  generateTruthTable,
  generateVennRegions,
  readSessionMemory,
  writeSessionMemory,
  VERSION,
  resolveBuildTarget,
  getPredicateAtomLegend,
} from '@shared/index';
import ProblemReviewSummary from './ProblemReviewSummary.vue';
import PredicateAtomLegend from './PredicateAtomLegend.vue';
import VennDiagram from './VennDiagram.vue';

const emit = defineEmits(['complete']);

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
  assignmentContext: {
    type: Object,
    default: null,
  },
  showDetailedLabels: {
    type: Boolean,
    default: false,
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
const feedbackMessage = ref(
  'Select the regions that make the current step true, then check your work.',
);
const latestCheck = ref(null);
const completionSummary = ref(null);
const submissionPayload = ref(null);
const stepStatuses = reactive({});
const selectionsByStep = reactive({});
const regionStatesByStep = reactive({});
const attemptCountsByStep = reactive({});
const stepReviewHistory = reactive({});
const memoryAutoAppliedByStep = reactive({});
const bulkActionCount = ref(0);
const autofillCount = ref(0);
const currentMemoryState = ref(null);
const predicateAtomLegend = computed(() => getPredicateAtomLegend(props.problem));

const currentStep = computed(() => {
  if (currentStepIndex.value >= stepDefinitions.value.length) {
    return null;
  }

  const step = stepDefinitions.value[currentStepIndex.value];
  return stepStatuses[step.id] === 'correct' ? null : step;
});

const currentStepLabel = computed(() => currentStep.value?.label ?? 'All regions are complete');
const hasPreviousStep = computed(() => currentStepIndex.value > 0);
const currentMemoryText = computed(() => {
  if (!currentMemoryState.value) {
    return 'No remembered regions are available for this step yet.';
  }

  if (currentMemoryState.value.canAutofill) {
    return `This step has been solved ${currentMemoryState.value.solveCount} time(s) in this session.`;
  }

  return `This step has been solved ${currentMemoryState.value.solveCount} time(s); solve it one more time to enable remembered autofill.`;
});

const currentStepPosition = computed(() => {
  if (!currentStep.value) {
    return '0';
  }

  return `${Math.min(currentStepIndex.value + 1, stepDefinitions.value.length)}`;
});

const revealedStepCount = computed(() => {
  const completed = stepDefinitions.value.filter(
    (step) => stepStatuses[step.id] === 'correct',
  ).length;
  return completed + (currentStep.value ? 1 : 0);
});

const currentSelection = computed(() => {
  if (!currentStep.value) {
    return [];
  }

  return ensureSelectionForStep(currentStep.value.id);
});

const currentStepHasNeutralRegions = computed(() => {
  if (!currentStep.value) {
    return false;
  }

  const stateByRegionId = ensureRegionStatesForStep(currentStep.value.id);
  return vennBlueprint.value.regions.some((region) => stateByRegionId[region.id] === 'neutral');
});

const currentStepPreview = computed(() => {
  if (!currentStep.value) {
    return [];
  }

  return describeStepPreview(currentStep.value.node);
});

// Region states should be understood as a three-way interaction contract:
// selected = true/shaded, available = false/unselected, neutral = unset/pending.
const diagramStateByRegionId = computed(() => {
  const stateByRegionId = {};
  const currentStepId = currentStep.value?.id ?? null;
  const currentRegionStates = currentStepId ? ensureRegionStatesForStep(currentStepId) : {};
  const missedSet = new Set(latestCheck.value?.missedRegionIds ?? []);
  const extraSet = new Set(latestCheck.value?.extraRegionIds ?? []);

  for (const region of vennBlueprint.value.regions) {
    if (missedSet.has(region.id)) {
      stateByRegionId[region.id] = 'missed';
      continue;
    }

    if (extraSet.has(region.id)) {
      stateByRegionId[region.id] = 'extra';
      continue;
    }

    if (stepStatuses[currentStepId] === 'correct') {
      stateByRegionId[region.id] = 'correct';
      continue;
    }

    stateByRegionId[region.id] = currentRegionStates[region.id] ?? 'neutral';
  }

  return stateByRegionId;
});

const diagramFocusRegionIds = computed(() => [
  ...(latestCheck.value?.missedRegionIds ?? []),
  ...(latestCheck.value?.extraRegionIds ?? []),
]);

watch(
  () => props.problem?.id,
  () => {
    resetPractice();
  },
  { immediate: true },
);

watch(
  [() => currentStep.value?.id ?? null, () => vennBlueprint.value.expression, () => vennBlueprint.value.regions.length],
  () => {
    syncCurrentStepMemory();
  },
  { immediate: true },
);

function resetPractice() {
  currentStepIndex.value = 0;
  latestCheck.value = null;
  completionSummary.value = null;
  submissionPayload.value = null;

  Object.keys(stepStatuses).forEach((key) => {
    delete stepStatuses[key];
  });

  Object.keys(selectionsByStep).forEach((key) => {
    delete selectionsByStep[key];
  });

  Object.keys(regionStatesByStep).forEach((key) => {
    delete regionStatesByStep[key];
  });

  Object.keys(attemptCountsByStep).forEach((key) => {
    delete attemptCountsByStep[key];
  });

  Object.keys(stepReviewHistory).forEach((key) => {
    delete stepReviewHistory[key];
  });

  Object.keys(memoryAutoAppliedByStep).forEach((key) => {
    delete memoryAutoAppliedByStep[key];
  });

  bulkActionCount.value = 0;
  autofillCount.value = 0;

  currentMemoryState.value = null;

  if (stepDefinitions.value.length > 0) {
    ensureSelectionForStep(stepDefinitions.value[0].id);
  }

  feedbackMessage.value = `Work through ${stepDefinitions.value[0]?.label ?? 'the current step'}.`;
}

function ensureSelectionForStep(stepId) {
  if (!selectionsByStep[stepId]) {
    selectionsByStep[stepId] = [];
  }

  ensureRegionStatesForStep(stepId);
  return selectionsByStep[stepId];
}

function ensureRegionStatesForStep(stepId) {
  if (!regionStatesByStep[stepId]) {
    const stateByRegionId = {};

    for (const region of vennBlueprint.value.regions) {
      stateByRegionId[region.id] = 'neutral';
    }

    regionStatesByStep[stepId] = stateByRegionId;
  }

  return regionStatesByStep[stepId];
}

function syncSelectionFromRegionStates(stepId) {
  const selection = ensureSelectionForStep(stepId);
  const stateByRegionId = ensureRegionStatesForStep(stepId);
  const selectedRegionIds = vennBlueprint.value.regions
    .filter((region) => stateByRegionId[region.id] === 'selected')
    .map((region) => region.id);

  selection.splice(0, selection.length, ...selectedRegionIds);
}

function setCurrentStepRegionState(regionId, state) {
  if (!currentStep.value) {
    return;
  }

  const stateByRegionId = ensureRegionStatesForStep(currentStep.value.id);
  stateByRegionId[regionId] = state;
  syncSelectionFromRegionStates(currentStep.value.id);
}

function copyStatesToCurrentStep(stateByRegionId) {
  if (!currentStep.value) {
    return;
  }

  const currentStateByRegionId = ensureRegionStatesForStep(currentStep.value.id);

  for (const region of vennBlueprint.value.regions) {
    currentStateByRegionId[region.id] = stateByRegionId[region.id] ?? 'neutral';
  }

  syncSelectionFromRegionStates(currentStep.value.id);
}

function setCurrentStepAllRegions(state) {
  if (!currentStep.value) {
    return;
  }

  const stateByRegionId = ensureRegionStatesForStep(currentStep.value.id);

  for (const region of vennBlueprint.value.regions) {
    stateByRegionId[region.id] = state;
  }

  syncSelectionFromRegionStates(currentStep.value.id);
}

function toggleRegion(regionId) {
  if (!currentStep.value) {
    return;
  }

  const stateByRegionId = ensureRegionStatesForStep(currentStep.value.id);
  const currentState = stateByRegionId[regionId] ?? 'neutral';
  const nextState = currentState === 'neutral' ? 'selected' : currentState === 'selected' ? 'available' : 'neutral';
  setCurrentStepRegionState(regionId, nextState);

  latestCheck.value = null;
  feedbackMessage.value = `Click each region to cycle it through neutral, selected, and available, then check your work.`;
}

function replaceCurrentSelection(regionIds) {
  if (!currentStep.value) {
    return;
  }

  const stateByRegionId = ensureRegionStatesForStep(currentStep.value.id);

  for (const region of vennBlueprint.value.regions) {
    stateByRegionId[region.id] = regionIds.includes(region.id) ? 'selected' : 'available';
  }

  syncSelectionFromRegionStates(currentStep.value.id);
  latestCheck.value = null;
}

function replaceCurrentRegionStates(stateByRegionId) {
  if (!currentStep.value) {
    return;
  }

  copyStatesToCurrentStep(stateByRegionId);
  latestCheck.value = null;
}

function shadeAllRegions() {
  if (!currentStep.value) {
    return;
  }

  setCurrentStepAllRegions('selected');
  latestCheck.value = null;
  bulkActionCount.value += 1;
  feedbackMessage.value = `Shaded all regions for ${currentStepLabel.value}. Check your work when you are ready.`;
}

function clearCurrentSelection() {
  if (!currentStep.value) {
    return;
  }

  setCurrentStepAllRegions('neutral');
  bulkActionCount.value += 1;
  feedbackMessage.value = `Cleared ${currentStepLabel.value}. Build the selection again when you are ready.`;
}

function copyPreviousStepSelection() {
  if (!currentStep.value || !hasPreviousStep.value) {
    return;
  }

  const previousStep = stepDefinitions.value[currentStepIndex.value - 1];
  const previousStates = ensureRegionStatesForStep(previousStep.id);
  replaceCurrentRegionStates(previousStates);
  bulkActionCount.value += 1;
  feedbackMessage.value = `Copied ${previousStep.label} into ${currentStepLabel.value}. Check your work when you are ready.`;
}

function buildCurrentStepMemoryDescriptor() {
  if (!currentStep.value) {
    return null;
  }

  return {
    mode: 'venn',
    expression: formatBooleanExpression(currentStep.value.node),
    variables: vennBlueprint.value.variables,
  };
}

function syncCurrentStepMemory() {
  currentMemoryState.value = null;

  if (!currentStep.value) {
    return;
  }

  const descriptor = buildCurrentStepMemoryDescriptor();
  if (!descriptor) {
    return;
  }

  const memory = readSessionMemory(descriptor, {
    validatePayload: validateRememberedRegions,
    threshold: AUTOMATION_THRESHOLD,
  });

  currentMemoryState.value = memory;

  if (!memory?.canAutofill || memoryAutoAppliedByStep[currentStep.value.id]) {
    return;
  }

  const selection = ensureSelectionForStep(currentStep.value.id);
  if (selection.length > 0) {
    return;
  }

  replaceCurrentSelection(memory.payload);
  memoryAutoAppliedByStep[currentStep.value.id] = true;
  autofillCount.value += 1;
  feedbackMessage.value = `Restored remembered regions for ${currentStep.value.label} from this session.`;
}

function restoreRememberedSelection() {
  if (!currentStep.value || !currentMemoryState.value?.canAutofill) {
    return;
  }

  replaceCurrentSelection(currentMemoryState.value.payload);
  memoryAutoAppliedByStep[currentStep.value.id] = true;
  autofillCount.value += 1;
  feedbackMessage.value = `Restored remembered regions for ${currentStep.value.label}.`;
}

function forgetRememberedSelection() {
  const descriptor = buildCurrentStepMemoryDescriptor();

  if (!descriptor) {
    return;
  }

  clearSessionMemory(descriptor);
  currentMemoryState.value = null;
  if (currentStep.value) {
    delete memoryAutoAppliedByStep[currentStep.value.id];
  }
  feedbackMessage.value = `Forgot the remembered regions for ${currentStep.value?.label ?? 'this step'}.`;
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

function checkCurrentStep() {
  const step = currentStep.value;

  if (!step) {
    feedbackMessage.value = 'All Venn regions are complete.';
    return;
  }

  if (currentStepHasNeutralRegions.value) {
    feedbackMessage.value =
      'Decide every region before checking. One or more regions are still neutral.';
    latestCheck.value = null;
    return;
  }

  const selection = [...currentSelection.value];
  const attemptCount = (attemptCountsByStep[step.id] ?? 0) + 1;
  attemptCountsByStep[step.id] = attemptCount;
  const expectedRegionIds = expectedRegionIdsForStep(step);
  const expectedSet = new Set(expectedRegionIds);
  const selectedSet = new Set(selection);
  const regionById = new Map(vennBlueprint.value.regions.map((region) => [region.id, region]));
  const missedRegionIds = expectedRegionIds.filter((regionId) => !selectedSet.has(regionId));
  const extraRegionIds = selection.filter((regionId) => !expectedSet.has(regionId));
  const missedRegions = missedRegionIds.map((regionId) => regionById.get(regionId)).filter(Boolean);
  const extraRegions = extraRegionIds.map((regionId) => regionById.get(regionId)).filter(Boolean);
  const message = buildVennHint({
    attemptCount,
    step,
    missedRegions,
    extraRegions,
    problemHints: props.problem.hints ?? [],
  });

  recordStepReview(step, attemptCount, {
    completed: missedRegionIds.length === 0 && extraRegionIds.length === 0,
    failedChecks: missedRegionIds.length > 0 || extraRegionIds.length > 0 ? attemptCount : Math.max(0, attemptCount - 1),
    lastMistake:
      missedRegionIds.length > 0 || extraRegionIds.length > 0
        ? {
            type: 'regions',
            missedRegionLabels: missedRegions.map((region) => region.label),
            extraRegionLabels: extraRegions.map((region) => region.label),
            summary: buildRegionSummary(missedRegions, extraRegions, step.label),
          }
        : stepReviewHistory[step.id]?.lastMistake ?? null,
  });

  latestCheck.value = {
    details: [
      {
        key: `${step.id}-${attemptCount}`,
        message,
      },
    ],
    missedRegionIds,
    extraRegionIds,
    missedRegions,
    extraRegions,
  };

  if (missedRegionIds.length > 0 || extraRegionIds.length > 0) {
    feedbackMessage.value = message;
    return;
  }

  const completedStepLabel = step.label;
  recordRememberedSelection(step, expectedRegionIds);
  stepStatuses[step.id] = 'correct';
  latestCheck.value = null;
  recordStepReview(step, attemptCount, {
    completed: true,
    failedChecks: Math.max(0, attemptCount - 1),
    lastMistake: stepReviewHistory[step.id]?.lastMistake ?? null,
  });

  if (currentStepIndex.value < stepDefinitions.value.length - 1) {
    currentStepIndex.value += 1;
    ensureSelectionForStep(stepDefinitions.value[currentStepIndex.value].id);
    feedbackMessage.value = `Great work. ${completedStepLabel} is complete, so ${currentStepLabel.value} is now revealed.`;
    return;
  }

  feedbackMessage.value = `Great work. ${completedStepLabel} is complete and the Venn answer is finished.`;
  completionSummary.value = buildProblemReviewSummary({
    problem: props.problem,
    mode: 'venn',
    stepDefinitions: stepDefinitions.value,
    stepReviews: Object.values(stepReviewHistory),
  });
  submissionPayload.value = buildSubmissionPayload({
    problem: props.problem,
    mode: 'venn',
    summary: completionSummary.value,
    attempts: completionSummary.value.totalAttempts,
    hintsUsed: completionSummary.value.totalHintsUsed,
    autofillUses: autofillCount.value,
    bulkActionUses: bulkActionCount.value,
    appVersion: VERSION,
    buildTarget: resolveBuildTarget(),
    assignmentContext: props.assignmentContext,
  });

  emit('complete', {
    summary: completionSummary.value,
    submissionPayload: submissionPayload.value,
    assignmentContext: props.assignmentContext,
  });
}

function buildRegionSummary(missedRegions, extraRegions, label) {
  const parts = [];

  if (missedRegions.length > 0) {
    parts.push(`Missed regions: ${missedRegions.map((region) => region.label).join(', ')}.`);
  }

  if (extraRegions.length > 0) {
    parts.push(`Extra regions: ${extraRegions.map((region) => region.label).join(', ')}.`);
  }

  if (parts.length === 0) {
    return `The selection for ${label} is correct.`;
  }

  parts.push(`Recheck how ${label} combines its operands.`);
  return parts.join(' ');
}

function recordStepReview(step, attemptCount, { completed, failedChecks, lastMistake }) {
  stepReviewHistory[step.id] = {
    stepId: step.id,
    label: step.label,
    attemptCount,
    failedChecks,
    completed,
    lastMistake,
  };
}

function recordRememberedSelection(step, regionIds) {
  const descriptor = {
    mode: 'venn',
    expression: formatBooleanExpression(step.node),
    variables: vennBlueprint.value.variables,
  };

  currentMemoryState.value = writeSessionMemory(descriptor, regionIds, {
    validatePayload: validateRememberedRegions,
    threshold: AUTOMATION_THRESHOLD,
  });
}

function validateRememberedRegions(payload) {
  return (
    Array.isArray(payload) &&
    payload.every(
      (regionId) =>
        Number.isInteger(regionId) &&
        regionId >= 0 &&
        regionId < vennBlueprint.value.regions.length,
    )
  );
}
</script>

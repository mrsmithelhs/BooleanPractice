<template>
  <section
    class="truth-table-practice"
    aria-labelledby="truth-table-heading"
    data-testid="truth-table-practice"
  >
    <div class="truth-table-practice__header">
      <div>
        <p class="truth-table-practice__eyebrow">
          Truth Table Practice
        </p>
        <h2 id="truth-table-heading">
          {{ problem.title }}
        </h2>
        <p class="truth-table-practice__expression">
          {{ truthTable.expression }}
        </p>
      </div>

      <div class="truth-table-practice__meta">
        <span class="badge">Step {{ currentStepPosition }}</span>
        <span
          class="badge badge--subtle"
          data-testid="truth-table-current-step"
        >
          {{ revealedStepCount }}/{{ stepDefinitions.length }} revealed
        </span>
      </div>
    </div>

    <div class="truth-table-practice__toolbar">
      <button
        type="button"
        class="action-button"
        data-testid="truth-table-check-step"
        @click="checkCurrentStep"
      >
        Check Step
      </button>
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="truth-table-reset"
        @click="resetPractice"
      >
        Reset Table
      </button>
    </div>

    <div
      class="truth-table-practice__bulk-actions"
      role="group"
      aria-label="Bulk edit controls"
    >
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="truth-table-fill-true"
        :disabled="!activeStep"
        @click="fillCurrentStep(true)"
      >
        Fill All True
      </button>
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="truth-table-fill-false"
        :disabled="!activeStep"
        @click="fillCurrentStep(false)"
      >
        Fill All False
      </button>
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="truth-table-clear-column"
        :disabled="!activeStep"
        @click="clearCurrentStep()"
      >
        Clear Column
      </button>
      <button
        type="button"
        class="action-button action-button--secondary"
        data-testid="truth-table-copy-previous"
        :disabled="!hasPreviousStep"
        @click="copyPreviousStepAnswers"
      >
        Copy Previous Step
      </button>
    </div>

    <p
      class="truth-table-practice__status"
      aria-live="polite"
      data-testid="truth-table-feedback"
    >
      {{ feedbackMessage }}
    </p>

    <div
      v-if="latestCheck"
      class="truth-table-practice__review"
      aria-live="polite"
    >
      <h3>Row Feedback</h3>
      <ul>
        <li
          v-for="entry in latestCheck.details"
          :key="entry.rowNumber"
        >
          Row {{ entry.rowNumber }}: {{ entry.message }}
        </li>
      </ul>
    </div>

    <div class="truth-table-practice__table-wrap">
      <table class="truth-table">
        <thead>
          <tr>
            <th scope="col">
              Row
            </th>
            <th
              v-for="variable in truthTable.variables"
              :key="variable"
              scope="col"
              class="truth-table__predicate-header"
            >
              <span class="truth-table__predicate-header-alias">
                {{ displayVariableLabel(variable) }}
              </span>
              <span
                v-if="displayPredicateLabel(variable)"
                class="truth-table__predicate-header-predicate"
              >
                {{ displayPredicateLabel(variable) }}
              </span>
            </th>
            <th
              v-for="step in completedSteps"
              :key="step.id"
              scope="col"
            >
              {{ step.label }}
            </th>
            <th
              v-if="activeStep"
              scope="col"
            >
              {{ activeStep.label }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, rowIndex) in truthTable.rows"
            :key="rowIndex"
            :class="rowClasses(rowIndex)"
          >
            <th scope="row">
              {{ rowIndex + 1 }}
            </th>
            <td
              v-for="variable in truthTable.variables"
              :key="variable"
              class="truth-table__fixed-cell"
            >
              <span
                class="truth-table__value truth-table__value--fixed"
                :data-state="row.assignment[variable] ? 'true' : 'false'"
              >
                {{ formatBoolean(row.assignment[variable]) }}
              </span>
            </td>

            <td
              v-for="step in completedSteps"
              :key="step.id"
            >
              <span
                class="truth-table__value truth-table__value--complete"
                :data-state="completedValue(row, step) ? 'true' : 'false'"
              >
                {{ formatBoolean(completedValue(row, step)) }}
              </span>
            </td>

            <td v-if="activeStep">
              <button
                type="button"
                class="truth-table__cell-button"
                :data-testid="`truth-cell-${activeStep.id}-${rowIndex}`"
                :aria-label="`Row ${rowIndex + 1}, ${activeStep.label}, ${formatAnswerLabel(currentAnswers[rowIndex])}`"
                :aria-pressed="currentAnswers[rowIndex] !== null"
                @click="toggleAnswer(rowIndex)"
                @keydown.enter.prevent="toggleAnswer(rowIndex)"
                @keydown.space.prevent="toggleAnswer(rowIndex)"
              >
                {{ formatAnswer(currentAnswers[rowIndex]) }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="truth-table-practice__summary">
      <article class="mini-card">
        <h3>Current Step</h3>
        <p>
          {{ currentStepLabel }}
        </p>
      </article>

      <article class="mini-card">
        <h3>Row Guide</h3>
        <p>
          Use the fixed variable columns to decide the current subexpression, then check your answer
          for every row.
        </p>
      </article>

      <PredicateAtomLegend
        :atoms="predicateAtomLegend"
        test-id="truth-table-predicate-legend"
      />

      <article
        v-if="currentMemoryState"
        class="mini-card truth-table-practice__memory"
        data-testid="truth-table-session-memory"
      >
        <h3>Session Memory</h3>
        <p>
          {{ currentMemoryText }}
        </p>
        <p
          v-if="currentMemoryState.canAutofill"
          class="truth-table-practice__memory-note"
        >
          Remembered answers are ready for this step. You can restore them, clear the step, or
          forget the stored memory for this session.
        </p>
        <div
          v-if="currentMemoryState.canAutofill"
          class="truth-table-practice__memory-actions"
        >
          <button
            type="button"
            class="action-button action-button--secondary"
            data-testid="truth-table-restore-memory"
            @click="restoreRememberedAnswers"
          >
            Restore Remembered Answer
          </button>
          <button
            type="button"
            class="action-button action-button--secondary"
            data-testid="truth-table-forget-memory"
            @click="forgetRememberedAnswers"
          >
            Forget Memory
          </button>
        </div>
      </article>
    </div>

    <ProblemReviewSummary
      v-if="completionSummary"
      :summary="completionSummary"
      :submission-payload="submissionPayload"
      test-id="truth-table-review-summary"
    />
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import {
  AUTOMATION_THRESHOLD,
  buildProblemReviewSummary,
  buildTruthTableHint,
  clearSessionMemory,
  generateTruthTable,
  readSessionMemory,
  buildSubmissionPayload,
  getPredicateAtomDisplayLabel,
  getPredicateAtomLegend,
  writeSessionMemory,
  formatBooleanExpression,
  VERSION,
  resolveBuildTarget,
} from '@shared/index';
import ProblemReviewSummary from './ProblemReviewSummary.vue';
import PredicateAtomLegend from './PredicateAtomLegend.vue';

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
});

const truthTable = computed(() =>
  generateTruthTable(props.problem.ast ?? props.problem.expression),
);

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
const feedbackMessage = ref('Fill the current column, then check your work.');
const latestCheck = ref(null);
const completionSummary = ref(null);
const submissionPayload = ref(null);
const stepStatuses = reactive({});
const answersByStep = reactive({});
const attemptCountsByStep = reactive({});
const stepReviewHistory = reactive({});
const memoryAutoAppliedByStep = reactive({});
const bulkActionCount = ref(0);
const autofillCount = ref(0);
const currentMemoryState = ref(null);
const predicateAtomLegend = computed(() => getPredicateAtomLegend(props.problem));

const activeStep = computed(() => {
  if (currentStepIndex.value >= stepDefinitions.value.length) {
    return null;
  }

  const step = stepDefinitions.value[currentStepIndex.value];
  return stepStatuses[step.id] === 'correct' ? null : step;
});

const completedSteps = computed(() =>
  stepDefinitions.value.filter((step, index) => {
    if (stepStatuses[step.id] === 'correct') {
      return true;
    }

    return index < currentStepIndex.value;
  }),
);

const currentStep = computed(
  () =>
    stepDefinitions.value[currentStepIndex.value] ??
    stepDefinitions.value[stepDefinitions.value.length - 1] ??
    null,
);

const currentStepPosition = computed(() => {
  if (!currentStep.value) {
    return '0';
  }

  return `${Math.min(currentStepIndex.value + 1, stepDefinitions.value.length)}`;
});

const revealedStepCount = computed(() => completedSteps.value.length + (activeStep.value ? 1 : 0));

const currentAnswers = computed(() => {
  if (!currentStep.value) {
    return [];
  }

  return ensureAnswersForStep(currentStep.value.id);
});

const currentStepLabel = computed(() => activeStep.value?.label ?? 'All steps complete');
const hasPreviousStep = computed(() => currentStepIndex.value > 0);
const currentMemoryText = computed(() => {
  if (!currentMemoryState.value) {
    return 'No remembered answer is available for this step yet.';
  }

  if (currentMemoryState.value.canAutofill) {
    return `This step has been solved ${currentMemoryState.value.solveCount} time(s) in this session.`;
  }

  return `This step has been solved ${currentMemoryState.value.solveCount} time(s); solve it one more time to enable remembered autofill.`;
});

watch(
  () => props.problem?.id,
  () => {
    resetPractice();
  },
  { immediate: true },
);

watch(
  truthTable,
  () => {
    resetPractice();
  },
  { immediate: true },
);

watch(
  [() => activeStep.value?.id ?? null, () => truthTable.value.expression, () => truthTable.value.rows.length],
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

  Object.keys(answersByStep).forEach((key) => {
    delete answersByStep[key];
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
    ensureAnswersForStep(stepDefinitions.value[0].id);
  }

  feedbackMessage.value = `Work through ${stepDefinitions.value[0]?.label ?? 'the current column'}.`;
}

function ensureAnswersForStep(stepId) {
  if (!answersByStep[stepId]) {
    answersByStep[stepId] = truthTable.value.rows.map(() => null);
  }

  return answersByStep[stepId];
}

function completedValue(row, step) {
  return step.id === 'result' ? row.result : row.values[step.id];
}

function toggleAnswer(rowIndex) {
  if (!activeStep.value) {
    return;
  }

  const answers = ensureAnswersForStep(activeStep.value.id);
  answers[rowIndex] = nextAnswerValue(answers[rowIndex]);
  latestCheck.value = null;
  feedbackMessage.value = `Fill ${activeStep.value.label} for each row, then check your work.`;
}

function fillCurrentStep(value) {
  if (!activeStep.value) {
    return;
  }

  const answers = ensureAnswersForStep(activeStep.value.id);
  answers.fill(value);
  bulkActionCount.value += 1;
  latestCheck.value = null;
  feedbackMessage.value = `Filled ${activeStep.value.label} with ${formatAnswerLabel(value)} answers. Check your work when you are ready.`;
}

function clearCurrentStep() {
  if (!activeStep.value) {
    return;
  }

  const answers = ensureAnswersForStep(activeStep.value.id);
  answers.fill(null);
  bulkActionCount.value += 1;
  latestCheck.value = null;
  feedbackMessage.value = `Cleared ${activeStep.value.label}. Fill it again when you are ready.`;
}

function copyPreviousStepAnswers() {
  if (!activeStep.value || !hasPreviousStep.value) {
    return;
  }

  const previousStep = stepDefinitions.value[currentStepIndex.value - 1];
  const currentAnswers = ensureAnswersForStep(activeStep.value.id);
  const previousAnswers = ensureAnswersForStep(previousStep.id);
  currentAnswers.splice(0, currentAnswers.length, ...previousAnswers);
  bulkActionCount.value += 1;
  latestCheck.value = null;
  feedbackMessage.value = `Copied ${previousStep.label} into ${activeStep.value.label}. Check your work when you are ready.`;
}

function buildCurrentStepMemoryDescriptor() {
  if (!activeStep.value) {
    return null;
  }

  return {
    mode: 'truth-table',
    expression: formatBooleanExpression(activeStep.value.node),
    variables: truthTable.value.variables,
  };
}

function syncCurrentStepMemory() {
  currentMemoryState.value = null;

  if (!activeStep.value) {
    return;
  }

  const descriptor = buildCurrentStepMemoryDescriptor();
  if (!descriptor) {
    return;
  }

  const memory = readSessionMemory(descriptor, {
    expectedLength: truthTable.value.rows.length,
    threshold: AUTOMATION_THRESHOLD,
  });

  currentMemoryState.value = memory;

  if (!memory?.canAutofill || memoryAutoAppliedByStep[activeStep.value.id]) {
    return;
  }

  const answers = ensureAnswersForStep(activeStep.value.id);
  if (!answers.every((answer) => answer === null)) {
    return;
  }

  answers.splice(0, answers.length, ...memory.payload);
  memoryAutoAppliedByStep[activeStep.value.id] = true;
  autofillCount.value += 1;
  latestCheck.value = null;
  feedbackMessage.value = `Restored remembered answers for ${activeStep.value.label} from this session.`;
}

function restoreRememberedAnswers() {
  if (!activeStep.value || !currentMemoryState.value?.canAutofill) {
    return;
  }

  const answers = ensureAnswersForStep(activeStep.value.id);
  answers.splice(0, answers.length, ...currentMemoryState.value.payload);
  memoryAutoAppliedByStep[activeStep.value.id] = true;
  autofillCount.value += 1;
  latestCheck.value = null;
  feedbackMessage.value = `Restored remembered answers for ${activeStep.value.label}.`;
}

function forgetRememberedAnswers() {
  const descriptor = buildCurrentStepMemoryDescriptor();

  if (!descriptor) {
    return;
  }

  clearSessionMemory(descriptor);
  currentMemoryState.value = null;
  if (activeStep.value) {
    delete memoryAutoAppliedByStep[activeStep.value.id];
  }
  feedbackMessage.value = `Forgot the remembered answer for ${activeStep.value?.label ?? 'this step'}.`;
}

function nextAnswerValue(value) {
  if (value === null) {
    return true;
  }

  if (value === true) {
    return false;
  }

  return null;
}

function formatBoolean(value) {
  return value ? 'T' : 'F';
}

function displayVariableLabel(variable) {
  return getPredicateAtomDisplayLabel(props.problem, variable);
}

function displayPredicateLabel(variable) {
  return predicateAtomLegend.value.find((atom) => atom.variable === variable)?.predicate ?? '';
}

function formatAnswer(value) {
  if (value === true) {
    return 'T';
  }

  if (value === false) {
    return 'F';
  }

  return '—';
}

function formatAnswerLabel(value) {
  if (value === true) {
    return 'true';
  }

  if (value === false) {
    return 'false';
  }

  return 'blank';
}

function rowClasses(rowIndex) {
  return {
    'truth-table__row--incorrect': latestCheck.value?.incorrectRowIndexes.includes(rowIndex),
    'truth-table__row--correct': latestCheck.value?.correctRowIndexes.includes(rowIndex),
  };
}

function checkCurrentStep() {
  const step = activeStep.value;

  if (!step) {
    feedbackMessage.value = 'All truth table columns are complete.';
    return;
  }

  const answers = ensureAnswersForStep(step.id);
  const attemptCount = (attemptCountsByStep[step.id] ?? 0) + 1;
  attemptCountsByStep[step.id] = attemptCount;
  const details = [];
  const incorrectRowIndexes = [];
  const correctRowIndexes = [];

  const incompleteRowIndex = answers.findIndex((answer) => answer === null);
  if (incompleteRowIndex !== -1) {
    const rowNumber = incompleteRowIndex + 1;
    const row = truthTable.value.rows[incompleteRowIndex];
    feedbackMessage.value = buildTruthTableHint({
      attemptCount,
      step,
      row,
      isBlank: true,
      problemHints: props.problem.hints ?? [],
    });
    recordStepReview(step, attemptCount, {
      completed: false,
      failedChecks: attemptCount,
      lastMistake: {
        type: 'rows',
        rowNumbers: [rowNumber],
        summary: `Row ${rowNumber} for ${step.label} is still blank.`,
      },
    });
    latestCheck.value = {
      message: feedbackMessage.value,
      details: [
        {
          rowNumber,
          message: feedbackMessage.value,
        },
      ],
      incorrectRowIndexes: [incompleteRowIndex],
      correctRowIndexes: [],
    };
    return;
  }

  answers.forEach((answer, rowIndex) => {
    const row = truthTable.value.rows[rowIndex];
    const expected = completedValue(row, step);
    const rowNumber = rowIndex + 1;

    if (answer === expected) {
      correctRowIndexes.push(rowIndex);
      details.push({
        rowNumber,
        message: `Correct for ${formatAssignment(row.assignment)}.`,
      });
      return;
    }

    incorrectRowIndexes.push(rowIndex);
    details.push({
      rowNumber,
      message: buildTruthTableHint({
        attemptCount,
        step,
        row,
        isBlank: false,
        problemHints: props.problem.hints ?? [],
      }),
    });
  });

  recordStepReview(step, attemptCount, {
    completed: incorrectRowIndexes.length === 0,
    failedChecks: incorrectRowIndexes.length > 0 ? attemptCount : Math.max(0, attemptCount - 1),
    lastMistake:
      incorrectRowIndexes.length > 0
        ? {
            type: 'rows',
            rowNumbers: incorrectRowIndexes.map((index) => index + 1),
            summary: `Rows ${formatNumberList(incorrectRowIndexes.map((index) => index + 1))} needed another look for ${step.label}.`,
          }
        : stepReviewHistory[step.id]?.lastMistake ?? null,
  });

  const firstWrongRow = incorrectRowIndexes[0];
  const firstWrongRowNumber = firstWrongRow + 1;
  const firstWrongRowMessage =
    details.find((entry) => entry.rowNumber === firstWrongRowNumber)?.message ??
    buildTruthTableHint({
      attemptCount,
      step,
      row: truthTable.value.rows[firstWrongRow],
      isBlank: false,
      problemHints: props.problem.hints ?? [],
    });

  latestCheck.value = {
    message: '',
    details,
    incorrectRowIndexes,
    correctRowIndexes,
  };

  if (incorrectRowIndexes.length > 0) {
    feedbackMessage.value = firstWrongRowMessage;
    return;
  }

  const completedStepLabel = step.label;
  recordRememberedAnswers(step, answers);
  stepStatuses[step.id] = 'correct';
  latestCheck.value = null;
  recordStepReview(step, attemptCount, {
    completed: true,
    failedChecks: Math.max(0, attemptCount - 1),
    lastMistake: stepReviewHistory[step.id]?.lastMistake ?? null,
  });

  if (currentStepIndex.value < stepDefinitions.value.length - 1) {
    currentStepIndex.value += 1;
    ensureAnswersForStep(stepDefinitions.value[currentStepIndex.value].id);
    feedbackMessage.value = `Great work. ${completedStepLabel} is complete, so ${currentStepLabel.value} is now revealed.`;
    return;
  }

  feedbackMessage.value = `Great work. ${completedStepLabel} is complete and the truth table is finished.`;
  completionSummary.value = buildProblemReviewSummary({
    problem: props.problem,
    mode: 'truth-table',
    stepDefinitions: stepDefinitions.value,
    stepReviews: Object.values(stepReviewHistory),
  });
  submissionPayload.value = buildSubmissionPayload({
    problem: props.problem,
    mode: 'truth-table',
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

function formatAssignment(assignment) {
  return truthTable.value.variables
    .map((variable) => `${variable}=${formatBoolean(assignment[variable])}`)
    .join(', ');
}

function formatNumberList(numbers) {
  if (numbers.length === 1) {
    return `${numbers[0]}`;
  }

  if (numbers.length === 2) {
    return `${numbers[0]} and ${numbers[1]}`;
  }

  const head = numbers.slice(0, -1).join(', ');
  return `${head}, and ${numbers[numbers.length - 1]}`;
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

function recordRememberedAnswers(step, answers) {
  const descriptor = {
    mode: 'truth-table',
    expression: formatBooleanExpression(step.node),
    variables: truthTable.value.variables,
  };

  currentMemoryState.value = writeSessionMemory(descriptor, answers, {
    expectedLength: truthTable.value.rows.length,
    threshold: AUTOMATION_THRESHOLD,
  });
}
</script>

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
            >
              {{ variable }}
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
          Use the fixed variable columns to decide the current subexpression, then check your
          answer for every row.
        </p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { evaluateBooleanAst, formatBooleanExpression, generateTruthTable } from '@shared/index';

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
});

const truthTable = computed(() => generateTruthTable(props.problem.ast ?? props.problem.expression));

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
const stepStatuses = reactive({});
const answersByStep = reactive({});

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

const currentStep = computed(() =>
  stepDefinitions.value[currentStepIndex.value] ?? stepDefinitions.value[stepDefinitions.value.length - 1] ?? null,
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

const currentStepLabel = computed(() => currentStep.value?.label ?? 'All steps complete');

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

function resetPractice() {
  currentStepIndex.value = 0;
  feedbackMessage.value = `Work through ${currentStepLabel.value}.`;
  latestCheck.value = null;

  Object.keys(stepStatuses).forEach((key) => {
    delete stepStatuses[key];
  });

  Object.keys(answersByStep).forEach((key) => {
    delete answersByStep[key];
  });

  if (stepDefinitions.value.length > 0) {
    ensureAnswersForStep(stepDefinitions.value[0].id);
  }
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
  if (!activeStep.value) {
    feedbackMessage.value = 'All truth table columns are complete.';
    return;
  }

  const answers = ensureAnswersForStep(activeStep.value.id);
  const details = [];
  const incorrectRowIndexes = [];
  const correctRowIndexes = [];

  const incompleteRowIndex = answers.findIndex((answer) => answer === null);
  if (incompleteRowIndex !== -1) {
    const rowNumber = incompleteRowIndex + 1;
    const row = truthTable.value.rows[incompleteRowIndex];
    feedbackMessage.value = `Row ${rowNumber} is still blank for ${activeStep.value.label}. Use ${formatAssignment(row.assignment)} to decide it.`;
    latestCheck.value = {
      message: feedbackMessage.value,
      details: [
        {
          rowNumber,
          message: describeStepReasoning(activeStep.value, row),
        },
      ],
      incorrectRowIndexes: [incompleteRowIndex],
      correctRowIndexes: [],
    };
    return;
  }

  answers.forEach((answer, rowIndex) => {
    const row = truthTable.value.rows[rowIndex];
    const expected = completedValue(row, activeStep.value);
    const rowNumber = rowIndex + 1;

    if (answer === expected) {
      correctRowIndexes.push(rowIndex);
      details.push({
        rowNumber,
        message: `Correct for ${formatAssignment(row.assignment)}. ${describeStepReasoning(activeStep.value, row)}`,
      });
      return;
    }

    incorrectRowIndexes.push(rowIndex);
    details.push({
      rowNumber,
      message: `Expected ${formatBoolean(expected)} for ${formatAssignment(row.assignment)}. ${describeStepReasoning(activeStep.value, row)}`,
    });
  });

  latestCheck.value = {
    message: '',
    details,
    incorrectRowIndexes,
    correctRowIndexes,
  };

  if (incorrectRowIndexes.length > 0) {
    const firstWrongRow = incorrectRowIndexes[0] + 1;
    feedbackMessage.value = `Row ${firstWrongRow} needs another look for ${activeStep.value.label}. ${describeStepReasoning(activeStep.value, truthTable.value.rows[incorrectRowIndexes[0]])}`;
    return;
  }

  const completedStepLabel = activeStep.value.label;
  stepStatuses[activeStep.value.id] = 'correct';

  if (currentStepIndex.value < stepDefinitions.value.length - 1) {
    currentStepIndex.value += 1;
    ensureAnswersForStep(stepDefinitions.value[currentStepIndex.value].id);
    feedbackMessage.value = `Great work. ${completedStepLabel} is complete, so ${currentStepLabel.value} is now revealed.`;
    return;
  }

  feedbackMessage.value = `Great work. ${completedStepLabel} is complete and the truth table is finished.`;
}

function formatAssignment(assignment) {
  return truthTable.value.variables.map((variable) => `${variable}=${formatBoolean(assignment[variable])}`).join(', ');
}

function describeStepReasoning(step, row) {
  const assignmentText = formatAssignment(row.assignment);

  switch (step.node.type) {
    case 'UnaryExpression': {
      const argumentValue = evaluateBooleanAst(step.node.argument, row.assignment);
      const stepValue = evaluateBooleanAst(step.node, row.assignment);
      return `Use ${assignmentText} to decide ${step.label}. Since ${formatBooleanExpression(step.node.argument)} is ${formatBoolean(argumentValue)}, ${step.label} should be ${formatBoolean(stepValue)}.`;
    }
    case 'BinaryExpression': {
      const leftValue = evaluateBooleanAst(step.node.left, row.assignment);
      const rightValue = evaluateBooleanAst(step.node.right, row.assignment);
      const stepValue = evaluateBooleanAst(step.node, row.assignment);
      return `Use ${assignmentText} to decide ${step.label}. Since ${formatBooleanExpression(step.node.left)} is ${formatBoolean(leftValue)} and ${formatBooleanExpression(step.node.right)} is ${formatBoolean(rightValue)}, ${step.label} should be ${formatBoolean(stepValue)}.`;
    }
    default: {
      const stepValue = evaluateBooleanAst(step.node, row.assignment);
      return `Use ${assignmentText} to decide ${step.label}. ${step.label} should be ${formatBoolean(stepValue)}.`;
    }
  }
}
</script>

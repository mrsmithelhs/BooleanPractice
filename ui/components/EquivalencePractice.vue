<template>
  <article
    class="equivalence-practice"
    data-testid="equivalence-practice"
  >
    <div class="equivalence-practice__header">
      <div>
        <p class="equivalence-practice__eyebrow">
          Equivalence Mode
        </p>
        <h2>Are these expressions equivalent?</h2>
        <p class="equivalence-practice__expression">
          Use the shared proof tools to compare both sides before answering.
        </p>
      </div>

      <div class="equivalence-practice__toolbar">
        <button
          class="action-button"
          type="button"
          :class="{ 'action-button--selected': selectedDecision === 'equivalent' }"
          :aria-pressed="selectedDecision === 'equivalent'"
          data-testid="equivalence-choice-equivalent"
          @click="selectedDecision = 'equivalent'"
        >
          Equivalent
        </button>
        <button
          class="action-button"
          type="button"
          :class="{ 'action-button--selected': selectedDecision === 'not-equivalent' }"
          :aria-pressed="selectedDecision === 'not-equivalent'"
          data-testid="equivalence-choice-not-equivalent"
          @click="selectedDecision = 'not-equivalent'"
        >
          Not Equivalent
        </button>
        <button
          class="action-button action-button--secondary"
          type="button"
          data-testid="equivalence-check"
          @click="checkAnswer"
        >
          Check
        </button>
        <button
          class="action-button action-button--secondary"
          type="button"
          data-testid="equivalence-reset"
          @click="resetChallenge"
        >
          Reset
        </button>
      </div>
    </div>

    <section class="equivalence-practice__pair">
      <article class="mini-card">
        <p class="equivalence-practice__card-eyebrow">
          Left Expression
        </p>
        <h3>{{ challenge.leftExpression }}</h3>
      </article>

      <article class="mini-card">
        <p class="equivalence-practice__card-eyebrow">
          Right Expression
        </p>
        <h3>{{ challenge.rightExpression }}</h3>
      </article>
    </section>

    <section
      class="equivalence-practice__status"
      aria-live="polite"
      data-testid="equivalence-feedback"
    >
      <p>{{ feedbackMessage }}</p>
    </section>

    <section class="equivalence-practice__proof">
      <div class="equivalence-practice__proof-header">
        <div>
          <p class="equivalence-practice__card-eyebrow">
            Proof View
          </p>
          <h3>{{ proofModeLabel }} Comparison</h3>
          <p class="equivalence-practice__proof-lede">
            The same assignment ids drive both proof paths, so the first mismatch stays consistent.
          </p>
        </div>

        <div class="equivalence-practice__toolbar">
          <button
            class="stepper__button"
            type="button"
            :class="{ 'stepper__button--selected': proofMode === 'truth-table' }"
            :aria-pressed="proofMode === 'truth-table'"
            data-testid="equivalence-proof-truth-table"
            @click="proofMode = 'truth-table'"
          >
            Truth Table
          </button>
          <button
            class="stepper__button"
            type="button"
            :class="{ 'stepper__button--selected': proofMode === 'venn' }"
            :aria-pressed="proofMode === 'venn'"
            data-testid="equivalence-proof-venn"
            @click="proofMode = 'venn'"
          >
            Venn Diagram
          </button>
        </div>
      </div>

      <div
        class="equivalence-practice__difference"
        data-testid="equivalence-first-difference"
      >
        <strong>First difference:</strong>
        <span>{{ firstDifferenceText }}</span>
      </div>

      <div class="equivalence-practice__proof-surface">
        <template v-if="proof.mode === 'truth-table'">
          <table class="equivalence-proof-table">
            <thead>
              <tr>
                <th scope="col">
                  Row
                </th>
                <th
                  v-for="variable in proof.variables"
                  :key="variable"
                  scope="col"
                >
                  {{ variable }}
                </th>
                <th scope="col">
                  Left
                </th>
                <th scope="col">
                  Right
                </th>
                <th scope="col">
                  Match
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in proof.rows"
                :key="row.id"
                :class="{
                  'equivalence-proof-table__row--match': row.matches,
                  'equivalence-proof-table__row--diff': !row.matches,
                }"
                :data-testid="`equivalence-proof-row-${row.id}`"
              >
                <th scope="row">
                  {{ row.rowNumber }}
                </th>
                <td
                  v-for="variable in proof.variables"
                  :key="variable"
                >
                  {{ booleanLabel(row.assignment[variable]) }}
                </td>
                <td>{{ booleanLabel(row.leftResult) }}</td>
                <td>{{ booleanLabel(row.rightResult) }}</td>
                <td>{{ row.matches ? '✓' : '✗' }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <template v-else>
          <div
            class="equivalence-practice__diagram"
            :class="`equivalence-practice__diagram--${proof.regions.length}`"
          >
            <button
              v-for="region in proof.regions"
              :key="region.id"
              type="button"
              class="equivalence-region"
              :class="{
                'equivalence-region--match': region.matches,
                'equivalence-region--diff': !region.matches,
                'equivalence-region--focus': proof.firstDifference?.id === region.id,
              }"
              :data-testid="`equivalence-proof-region-${region.id}`"
            >
              <span class="equivalence-region__bits">{{ region.bits }}</span>
              <span class="equivalence-region__label">{{ region.label }}</span>
              <span class="equivalence-region__state">
                Left {{ booleanLabel(region.leftResult) }} · Right {{ booleanLabel(region.rightResult) }}
              </span>
            </button>
          </div>
        </template>
      </div>
    </section>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { buildEquivalenceProof } from '@shared/index';

const emit = defineEmits(['complete']);

const props = defineProps({
  challenge: {
    type: Object,
    required: true,
  },
});

const proofMode = ref('truth-table');
const selectedDecision = ref('');
const feedbackMessage = ref('Pick whether the pair is equivalent, then check your reasoning.');

const proof = computed(() => buildEquivalenceProof(props.challenge, proofMode.value).proof);

const proofModeLabel = computed(() =>
  proofMode.value === 'truth-table' ? 'Truth Table' : 'Venn Diagram',
);

const firstDifferenceText = computed(() => {
  if (!proof.value.firstDifference) {
    return 'No differing rows or regions were found.';
  }

  if (proof.value.mode === 'truth-table') {
    const row = proof.value.firstDifference;
    return `Row ${row.rowNumber}: ${row.assignmentLabel} -> left ${booleanLabel(row.leftResult)}, right ${booleanLabel(row.rightResult)}.`;
  }

  const region = proof.value.firstDifference;
  return `Region ${region.bits} (${region.label}) -> left ${booleanLabel(region.leftResult)}, right ${booleanLabel(region.rightResult)}.`;
});

watch(
  () => props.challenge.id,
  () => {
    resetChallenge();
  },
);

function booleanLabel(value) {
  return value ? 'T' : 'F';
}

function resetChallenge() {
  selectedDecision.value = '';
  proofMode.value = 'truth-table';
  feedbackMessage.value = 'Pick whether the pair is equivalent, then check your reasoning.';
}

function checkAnswer() {
  if (!selectedDecision.value) {
    feedbackMessage.value = 'Choose Equivalent or Not Equivalent before checking.';
    return;
  }

  const guessedEquivalent = selectedDecision.value === 'equivalent';
  const isCorrect = guessedEquivalent === props.challenge.equivalent;

  if (isCorrect) {
    feedbackMessage.value = props.challenge.equivalent
      ? 'Correct. The proof shows matching rows and regions on every assignment.'
      : `Correct. The pair is not equivalent because ${firstDifferenceText.value}`;
    emit('complete', {
      challenge: props.challenge,
      selectedDecision: selectedDecision.value,
      proof: proof.value,
      isCorrect: true,
      message: feedbackMessage.value,
    });
    return;
  }

  feedbackMessage.value = props.challenge.equivalent
    ? `Not quite. The rows and regions do match on every assignment, so the pair is equivalent.`
    : `Not quite. The proof shows a mismatch: ${firstDifferenceText.value}`;
}
</script>

<template>
  <article
    class="equivalence-practice simplification-practice"
    data-testid="simplification-practice"
  >
    <div class="equivalence-practice__header">
      <div>
        <p class="equivalence-practice__eyebrow">
          Simplification Mode
        </p>
        <h2>Propose a simpler equivalent form</h2>
        <p class="equivalence-practice__expression">
          Type your guess using the same boolean grammar, then check whether it stays equivalent
          and whether it is simpler by the node-count metric.
        </p>
      </div>

      <div class="equivalence-practice__toolbar">
        <button
          class="action-button action-button--secondary"
          type="button"
          data-testid="simplification-check"
          @click="checkGuess"
        >
          Check Guess
        </button>
        <button
          class="action-button action-button--secondary"
          type="button"
          data-testid="simplification-reset"
          @click="resetChallenge"
        >
          Reset
        </button>
      </div>
    </div>

    <section class="equivalence-practice__pair">
      <article class="mini-card">
        <p class="equivalence-practice__card-eyebrow">
          Original Expression
        </p>
        <h3>{{ challenge.originalExpression }}</h3>
      </article>

      <article class="mini-card">
        <p class="equivalence-practice__card-eyebrow">
          Your Guess
        </p>
        <textarea
          v-model="guessText"
          class="simplification-practice__input"
          data-testid="simplification-guess"
          rows="4"
          spellcheck="false"
          aria-label="Proposed simpler expression"
          placeholder="Type a simpler equivalent form here"
        />
      </article>
    </section>

    <div class="equivalence-practice__pair">
      <article class="mini-card">
        <p class="equivalence-practice__card-eyebrow">
          Complexity
        </p>
        <p>Original: {{ challenge.originalNodeCount }} nodes</p>
        <p data-testid="simplification-guess-node-count">Guess: {{ currentGuessNodeCountLabel }}</p>
        <p>{{ simplificationLabel }}</p>
      </article>

      <article class="mini-card">
        <p class="equivalence-practice__card-eyebrow">
          Hints
        </p>
        <ul>
          <li
            v-for="hint in challenge.hints"
            :key="hint"
          >
            {{ hint }}
          </li>
        </ul>
      </article>
    </div>

    <section
      class="equivalence-practice__status"
      aria-live="polite"
      data-testid="simplification-feedback"
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
            The proof compares the original expression to your guess using the shared evaluator.
          </p>
        </div>

        <div class="equivalence-practice__toolbar">
          <button
            class="stepper__button"
            type="button"
            :class="{ 'stepper__button--selected': proofMode === 'truth-table' }"
            :aria-pressed="proofMode === 'truth-table'"
            data-testid="simplification-proof-truth-table"
            @click="proofMode = 'truth-table'"
          >
            Truth Table
          </button>
          <button
            class="stepper__button"
            type="button"
            :class="{ 'stepper__button--selected': proofMode === 'venn' }"
            :aria-pressed="proofMode === 'venn'"
            data-testid="simplification-proof-venn"
            @click="proofMode = 'venn'"
          >
            Venn Diagram
          </button>
        </div>
      </div>

      <div
        class="equivalence-practice__difference"
        data-testid="simplification-first-difference"
      >
        <strong>First difference:</strong>
        <span>{{ firstDifferenceText }}</span>
      </div>

      <div class="equivalence-practice__proof-surface">
        <template v-if="proof?.mode === 'truth-table'">
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
                  Original
                </th>
                <th scope="col">
                  Guess
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
                :data-testid="`simplification-proof-row-${row.id}`"
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

        <template v-else-if="proof?.mode === 'venn'">
          <div class="equivalence-practice__venn-pair">
            <article class="mini-card">
              <p class="equivalence-practice__card-eyebrow">
                Original Expression
              </p>
              <VennDiagram
                :variables="proof.variables"
                :regions="proof.regions"
                :state-by-region-id="originalRegionStates"
                :focus-region-ids="proof.firstDifference ? [proof.firstDifference.id] : []"
                :show-detailed-labels="showDetailedLabels"
                aria-label="Original expression Venn diagram"
                diagram-label="Original expression Venn diagram"
                test-id-prefix="simplification-proof-original-region"
                :interactive="false"
                :show-legend="false"
                :show-fallback-list="false"
              />
            </article>

            <article class="mini-card">
              <p class="equivalence-practice__card-eyebrow">
                Guess Expression
              </p>
              <VennDiagram
                :variables="proof.variables"
                :regions="proof.regions"
                :state-by-region-id="guessRegionStates"
                :focus-region-ids="proof.firstDifference ? [proof.firstDifference.id] : []"
                :show-detailed-labels="showDetailedLabels"
                aria-label="Guess expression Venn diagram"
                diagram-label="Guess expression Venn diagram"
                test-id-prefix="simplification-proof-guess-region"
                :interactive="false"
                :show-legend="false"
                :show-fallback-list="false"
              />
            </article>
          </div>
        </template>
      </div>
    </section>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { buildSimplificationCheck, formatNodeCountLabel } from '@shared/index';
import VennDiagram from './VennDiagram.vue';

const emit = defineEmits(['complete']);

const props = defineProps({
  challenge: {
    type: Object,
    required: true,
  },
  showDetailedLabels: {
    type: Boolean,
    default: false,
  },
});

const guessText = ref('');
const proofMode = ref('truth-table');
const feedbackMessage = ref('Type a guess, then check whether it is equivalent and simpler.');
const lastCheckedGuess = ref('');
const analysis = ref(null);

const proof = computed(() => analysis.value?.proof ?? null);
const originalRegionStates = computed(() =>
  proof.value
    ? Object.fromEntries(
        proof.value.regions.map((region) => [region.id, region.leftResult ? 'selected' : 'available']),
      )
    : {},
);
const guessRegionStates = computed(() =>
  proof.value
    ? Object.fromEntries(
        proof.value.regions.map((region) => [region.id, region.rightResult ? 'selected' : 'available']),
      )
    : {},
);
const proofModeLabel = computed(() =>
  proofMode.value === 'truth-table' ? 'Truth Table' : 'Venn Diagram',
);
const currentGuessNodeCountLabel = computed(() =>
  analysis.value ? formatNodeCountLabel(analysis.value.guessNodeCount) : 'not checked yet',
);
const simplificationLabel = computed(() => {
  if (!analysis.value) {
    return 'No simplification check has been run yet.';
  }

  if (analysis.value.proof.equivalent && analysis.value.isSimpler) {
    return 'Equivalent and simpler by this metric.';
  }

  if (analysis.value.proof.equivalent) {
    return 'Equivalent, but not simpler by this metric.';
  }

  return 'Not equivalent.';
});
const firstDifferenceText = computed(() => {
  if (!proof.value) {
    return 'Run a check to compare the original and your guess.';
  }

  if (proof.value.equivalent) {
    return 'No differing rows or regions were found.';
  }

  if (proof.value.mode === 'truth-table') {
    const row = proof.value.firstDifference;
    return `Row ${row.rowNumber}: ${row.assignmentLabel} -> original ${booleanLabel(row.leftResult)}, guess ${booleanLabel(row.rightResult)}.`;
  }

  const region = proof.value.firstDifference;
  return `Region ${region.bits} (${region.label}) -> original ${booleanLabel(region.leftResult)}, guess ${booleanLabel(region.rightResult)}.`;
});

watch(
  () => props.challenge.id,
  () => {
    resetChallenge();
  },
);

watch(proofMode, () => {
  if (lastCheckedGuess.value) {
    runCheck(lastCheckedGuess.value);
  }
});

function booleanLabel(value) {
  return value ? 'T' : 'F';
}

function resetChallenge() {
  guessText.value = '';
  proofMode.value = 'truth-table';
  feedbackMessage.value = 'Type a guess, then check whether it is equivalent and simpler.';
  lastCheckedGuess.value = '';
  analysis.value = null;
}

function runCheck(source) {
  try {
    analysis.value = buildSimplificationCheck(props.challenge, source, proofMode.value);
    lastCheckedGuess.value = source;
    feedbackMessage.value = analysis.value.statusText;

    if (analysis.value.proof.equivalent && analysis.value.isSimpler) {
      emit('complete', {
        challenge: props.challenge,
        guessSource: source,
        analysis: analysis.value,
        isCorrect: true,
        message: feedbackMessage.value,
      });
    }
  } catch (error) {
    analysis.value = null;
    lastCheckedGuess.value = '';
    feedbackMessage.value = `I could not parse that guess: ${error.message}`;
  }
}

function checkGuess() {
  runCheck(guessText.value);
}
</script>

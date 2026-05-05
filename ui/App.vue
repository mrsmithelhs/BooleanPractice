<template>
  <div class="shell">
    <header class="hero panel panel--hero">
      <div class="hero__copy">
        <p class="eyebrow">
          Boolean Practice
        </p>
        <h1>Practice boolean reasoning with one shared problem source.</h1>
        <p class="lede">
          Choose a difficulty, choose a mode, and work from the same curated catalog that powers
          truth tables and Venn diagrams.
        </p>
        <div
          class="hero__chips"
          aria-label="Learning systems"
        >
          <span class="badge">Shared semantics</span>
          <span class="badge badge--subtle">Truth tables</span>
          <span class="badge badge--subtle">Three-variable Venn</span>
        </div>
      </div>
      <aside
        class="hero-card"
        aria-label="Current selection summary"
      >
        <span class="hero-card__label">Session overview</span>
        <strong class="hero-card__title">
          {{ selectedProblem ? `Problem #${selectedProblem.sequence}` : 'No problem selected' }}
        </strong>
        <p class="hero-card__description">
          {{ selectedProblem?.title ?? 'Adjust the filters to load a compatible problem.' }}
        </p>

        <div class="hero-card__grid">
          <article class="hero-stat">
            <span class="hero-stat__label">Mode</span>
            <strong>{{ selectedModeLabel }}</strong>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__label">Difficulty</span>
            <strong>{{ selectedDifficultyLabel }}</strong>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__label">Compatible</span>
            <strong>{{ filteredProblems.length }}</strong>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__label">Concept</span>
            <strong>{{ selectedConceptTag }}</strong>
          </article>
        </div>
      </aside>
    </header>

    <main class="layout">
      <section
        class="panel"
        aria-labelledby="controls-heading"
      >
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">
              Session controls
            </p>
            <h2 id="controls-heading">
              Problem Controls
            </h2>
            <p class="panel__lede">
              Filter the catalog by difficulty and mode. The same curated problem data powers both
              learning views.
            </p>
          </div>
        </div>

        <div class="field-grid">
          <label class="field">
            <span>Difficulty</span>
            <select
              v-model="selectedDifficulty"
              name="difficulty"
              aria-label="Difficulty"
            >
              <option
                v-for="difficulty in difficultyOptions"
                :key="difficulty.value"
                :value="difficulty.value"
              >
                {{ difficulty.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Mode</span>
            <select
              v-model="selectedMode"
              name="mode"
              aria-label="Mode"
            >
              <option
                v-for="mode in modeOptions"
                :key="mode.value"
                :value="mode.value"
              >
                {{ mode.label }}
              </option>
            </select>
          </label>

          <label class="field field--full">
            <span>Problem</span>
            <select
              v-model="selectedProblemId"
              name="problem"
              aria-label="Problem"
              :disabled="filteredProblems.length === 0"
            >
              <option
                v-for="problem in filteredProblems"
                :key="problem.id"
                :value="problem.id"
              >
                {{ problem.sequence }}. {{ problem.title }}
              </option>
            </select>
          </label>
        </div>

        <p
          class="status"
          aria-live="polite"
          data-testid="shell-status"
        >
          {{ feedbackMessage }}
        </p>
      </section>

      <section
        class="panel panel--primary"
        aria-labelledby="problem-heading"
      >
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">
              Problem card
            </p>
            <h2 id="problem-heading">
              Current Problem
            </h2>
            <p class="panel__lede">
              The expression, mode support, and hints stay attached to the same immutable catalog
              record.
            </p>
          </div>
        </div>

        <template v-if="selectedProblem">
          <div
            class="expression-card"
            data-testid="expression-card"
          >
            <div class="expression-card__meta">
              <span class="badge">#{{ selectedProblem.sequence }}</span>
              <span class="badge badge--subtle">{{ selectedProblem.difficulty }}</span>
            </div>
            <h3>{{ selectedProblem.title }}</h3>
            <p class="expression">
              {{ selectedProblem.expression }}
            </p>
          </div>

          <div class="info-grid">
            <article class="mini-card">
              <h3>Concept Tags</h3>
              <ul>
                <li
                  v-for="tag in selectedProblem.conceptTags"
                  :key="tag"
                >
                  {{ tag }}
                </li>
              </ul>
            </article>

            <article class="mini-card">
              <h3>Supported Modes</h3>
              <ul>
                <li
                  v-for="mode in selectedProblem.supportedModes"
                  :key="mode"
                >
                  {{ mode }}
                </li>
              </ul>
            </article>

            <article class="mini-card">
              <h3>Variables</h3>
              <p>{{ selectedProblem.variables.join(', ') }}</p>
            </article>
          </div>

          <div class="hints">
            <h3>Hints</h3>
            <ol>
              <li
                v-for="hint in selectedProblem.hints"
                :key="hint"
              >
                {{ hint }}
              </li>
            </ol>
          </div>
        </template>

        <template v-else>
          <p class="empty-state">
            No problems match the current filters.
          </p>
        </template>
      </section>

      <section
        class="panel"
        aria-labelledby="practice-heading"
      >
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">
              Practice workspace
            </p>
            <h2 id="practice-heading">
              Practice Panel
            </h2>
            <p class="panel__lede">
              The active learning surface responds to the selected mode while keeping the shared
              semantics consistent.
            </p>
          </div>
        </div>
        <TruthTablePractice
          v-if="selectedMode === 'truth-table' && selectedProblem"
          :problem="selectedProblem"
        />
        <VennPractice
          v-else-if="selectedMode === 'venn' && selectedProblem"
          :problem="selectedProblem"
        />

        <div
          v-else
          class="placeholder-state"
        >
          <p class="placeholder-copy">
            Venn practice will appear here in the next packet. For now, this shell keeps the
            selected problem and mode state ready for the later UI.
          </p>
          <p class="placeholder-note">
            Choose Truth Table mode to try the rebuilt truth table experience.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { listProblems } from '@shared/index';
import TruthTablePractice from './components/TruthTablePractice.vue';
import VennPractice from './components/VennPractice.vue';

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const modeOptions = [
  { value: 'truth-table', label: 'Truth Table' },
  { value: 'venn', label: 'Venn Diagram' },
];

const selectedDifficulty = ref('easy');
const selectedMode = ref('truth-table');
const selectedProblemId = ref('');
const feedbackMessage = ref('Choose a difficulty and mode to load a problem.');

const filteredProblems = computed(() =>
  listProblems({ difficulty: selectedDifficulty.value, mode: selectedMode.value }),
);

const selectedProblem = computed(
  () =>
    filteredProblems.value.find((problem) => problem.id === selectedProblemId.value) ??
    filteredProblems.value[0] ??
    null,
);

const selectedDifficultyLabel = computed(
  () =>
    difficultyOptions.find((option) => option.value === selectedDifficulty.value)?.label ??
    selectedDifficulty.value,
);

const selectedModeLabel = computed(
  () =>
    modeOptions.find((option) => option.value === selectedMode.value)?.label ?? selectedMode.value,
);

const selectedConceptTag = computed(() => selectedProblem.value?.conceptTags[0] ?? '—');

watch(
  filteredProblems,
  (nextProblems) => {
    if (nextProblems.length === 0) {
      selectedProblemId.value = '';
      feedbackMessage.value = 'No compatible problems are available for the current filters.';
      return;
    }

    const currentProblemExists = nextProblems.some(
      (problem) => problem.id === selectedProblemId.value,
    );

    if (!currentProblemExists) {
      selectedProblemId.value = nextProblems[0].id;
      feedbackMessage.value = `Loaded ${nextProblems[0].title}.`;
    }
  },
  { immediate: true },
);

watch(
  selectedProblem,
  (problem, previousProblem) => {
    if (!problem) {
      return;
    }

    if (problem.id !== previousProblem?.id) {
      feedbackMessage.value = `Selected ${problem.title} for ${selectedModeLabel.value} practice.`;
    }
  },
  { immediate: true },
);
</script>

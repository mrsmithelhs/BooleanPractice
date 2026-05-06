<template>
  <div
    v-if="assignmentSession?.status === 'ready'"
    class="shell"
  >
    <header class="hero panel panel--hero">
      <div class="hero__copy">
        <p class="eyebrow">
          Boolean Practice
        </p>
        <h1>{{ assignmentSession.assignment.title }}</h1>
        <p class="lede">
          {{ assignmentHeroText }}
        </p>
        <div
          class="hero__chips"
          aria-label="Assignment details"
        >
          <span class="badge">Sheets Assignment</span>
          <span class="badge badge--subtle">{{ assignmentSession.assignment.itemCount }} items</span>
          <span class="badge badge--subtle">{{ assignmentStudentLabel }}</span>
          <span class="badge badge--subtle">{{ assignmentSession.assignment.assignmentId }}</span>
        </div>
      </div>
      <aside
        class="hero-card"
        aria-label="Current assignment summary"
      >
        <span class="hero-card__label">Assignment overview</span>
        <strong class="hero-card__title">
          {{ assignmentSession.currentItem ? assignmentSession.currentItem.challenge.title : 'All items complete' }}
        </strong>
        <p class="hero-card__description">
          {{ assignmentSession.currentItem?.challenge.expression ?? 'Every queued item has been completed.' }}
        </p>

        <div class="hero-card__grid">
          <article class="hero-stat">
            <span class="hero-stat__label">Current mode</span>
            <strong>{{ assignmentSession.currentItem?.challengeMode ?? 'done' }}</strong>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__label">Queue size</span>
            <strong>{{ assignmentSession.items.length }}</strong>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__label">Student</span>
            <strong>{{ assignmentStudentLabelShort }}</strong>
          </article>
          <article class="hero-stat">
            <span class="hero-stat__label">Roster</span>
            <strong>{{ assignmentRosterLabel }}</strong>
          </article>
        </div>
      </aside>
    </header>

    <main class="layout layout--assignment">
      <section
        class="panel panel--primary"
        aria-labelledby="assignment-heading"
      >
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">
              Assignment queue
            </p>
            <h2 id="assignment-heading">
              Sheets-authored sequence
            </h2>
            <p class="panel__lede">
              The student sees the same shared practice components, but the sequence comes from the
              spreadsheet and stays locked to the assigned queue.
            </p>
          </div>
        </div>

        <AssignmentPractice
          :session="assignmentSession"
        />
      </section>
    </main>
  </div>

  <div
    v-else-if="assignmentSession?.status === 'error'"
    class="shell"
  >
    <header class="hero panel panel--hero">
      <div class="hero__copy">
        <p class="eyebrow">
          Boolean Practice
        </p>
        <h1>Assignment load failed</h1>
        <p class="lede">
          The Sheets workbook could not be loaded safely, so the assignment view is blocked until
          the data is corrected.
        </p>
        <div class="hero__chips">
          <span class="badge">Sheets Assignment</span>
          <span class="badge badge--subtle">Validation error</span>
        </div>
      </div>
      <aside
        class="hero-card"
        aria-label="Assignment errors"
      >
        <span class="hero-card__label">Validation details</span>
        <ul class="assignment-error-list">
          <li
            v-for="error in assignmentSession.errors"
            :key="error"
          >
            {{ error }}
          </li>
        </ul>
      </aside>
    </header>

    <main class="layout">
      <section class="panel panel--primary">
        <div class="mini-card">
          <h3>What to fix</h3>
          <p>
            Check the workbook schema, item ids, and active rows in the Sheets assignment tabs.
          </p>
        </div>
      </section>
    </main>
  </div>

  <div
    v-else
    class="shell"
  >
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
          <span class="badge badge--subtle">Equivalence proofs</span>
        </div>
      </div>
      <aside
        class="hero-card"
        aria-label="Current selection summary"
      >
        <span class="hero-card__label">Session overview</span>
        <strong class="hero-card__title">
          {{ selectedRecord ? `${selectedRecordLabel} #${selectedRecord.sequence}` : `No ${selectedRecordLabel.toLowerCase()} selected` }}
        </strong>
        <p class="hero-card__description">
          {{ selectedRecord?.title ?? 'Adjust the filters to load a compatible record.' }}
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
            <strong>{{ filteredRecords.length }}</strong>
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
              {{ selectedRecordLabel }} Controls
            </h2>
            <p class="panel__lede">
              Filter the shared challenge set by difficulty and mode. The same immutable data powers
              the practice views and the equivalence mode.
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
            <span>{{ selectedRecordLabel }}</span>
            <select
              v-model="selectedRecordId"
              name="problem"
              :aria-label="selectedRecordLabel"
              :disabled="filteredRecords.length === 0"
            >
              <option
                v-for="record in filteredRecords"
                :key="record.id"
                :value="record.id"
              >
                {{ record.sequence }}. {{ record.title }}
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
              {{ selectedRecordLabel }} card
            </p>
            <h2 id="problem-heading">
              Current {{ selectedRecordLabel }}
            </h2>
            <p class="panel__lede">
              The expression pair, mode support, and hints stay attached to the same immutable
              record.
            </p>
          </div>
        </div>

        <template v-if="selectedRecord">
          <div
            class="expression-card"
            data-testid="expression-card"
          >
            <div class="expression-card__meta">
              <span class="badge">#{{ selectedRecord.sequence }}</span>
              <span class="badge badge--subtle">{{ selectedRecord.difficulty }}</span>
            </div>
            <h3>{{ selectedRecord.title }}</h3>
            <p class="expression">
              {{ selectedRecord.expression }}
            </p>
          </div>

          <div class="info-grid">
            <article class="mini-card">
              <h3>Concept Tags</h3>
              <ul>
                <li
                  v-for="tag in selectedRecord.conceptTags"
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
                  v-for="mode in selectedRecord.supportedModes"
                  :key="mode"
                >
                  {{ mode }}
                </li>
              </ul>
            </article>

            <article class="mini-card">
              <h3>Variables</h3>
              <p>{{ selectedRecord.variables.join(', ') }}</p>
            </article>

            <article
              class="mini-card"
              data-testid="numeric-variable-note"
            >
              <h3>Numeric Variables</h3>
              <p>{{ numericVariableTeachingCopy.lede }}</p>
              <ul>
                <li
                  v-for="point in numericVariableTeachingCopy.points"
                  :key="point"
                >
                  {{ point }}
                </li>
              </ul>
            </article>

            <article
              v-if="selectedRecord.predicateAtoms?.length"
              class="mini-card"
            >
              <h3>Predicate Atoms</h3>
              <ul>
                <li
                  v-for="atom in selectedRecord.predicateAtoms"
                  :key="atom.variable"
                >
                  <strong>{{ atom.alias }}:</strong> {{ atom.predicate }}
                </li>
              </ul>
            </article>

            <article class="mini-card">
              <h3>Catalog Metadata</h3>
              <ul>
                <li>Variable count: {{ selectedRecord.variableCount }}</li>
                <li>Law family: {{ selectedRecord.lawFamily }}</li>
                <li>Estimated complexity: {{ selectedRecord.estimatedComplexity }}/5</li>
                <li>Equivalence ready: {{ booleanLabel(selectedRecord.equivalenceReady) }}</li>
                <li>Simplification ready: {{ booleanLabel(selectedRecord.simplificationReady) }}</li>
              </ul>
            </article>
          </div>

          <div class="hints">
            <h3>Hints</h3>
            <ol>
              <li
                v-for="hint in selectedRecord.hints"
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
          v-if="selectedMode === 'truth-table' && selectedRecord"
          :problem="selectedRecord"
        />
        <VennPractice
          v-else-if="selectedMode === 'venn' && selectedRecord"
          :problem="selectedRecord"
        />
        <EquivalencePractice
          v-else-if="selectedMode === 'equivalence' && selectedRecord"
          :challenge="selectedRecord"
        />
        <SimplificationPractice
          v-else-if="selectedMode === 'simplification' && selectedRecord"
          :challenge="selectedRecord"
        />

        <div
          v-else
          class="placeholder-state"
        >
          <p class="placeholder-copy">
            The selected practice surface appears here for the current mode, including
            equivalence and simplification challenges.
          </p>
          <p class="placeholder-note">
            Choose a mode to try the matching practice surface, equivalence challenge, or
            simplification guess mode.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import {
  getEquivalenceChallenges,
  getNumericVariableTeachingCopy,
  getSimplificationChallenges,
  listProblems,
  loadAssignmentSession,
} from '@shared/index';
import AssignmentPractice from './components/AssignmentPractice.vue';
import EquivalencePractice from './components/EquivalencePractice.vue';
import SimplificationPractice from './components/SimplificationPractice.vue';
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
  { value: 'equivalence', label: 'Equivalence' },
  { value: 'simplification', label: 'Simplification' },
];

const selectedDifficulty = ref('easy');
const selectedMode = ref('truth-table');
const selectedRecordId = ref('');
const feedbackMessage = ref('Choose a difficulty and mode to load a problem.');
const assignmentBootstrapContext = readAssignmentBootstrapContext();
const assignmentSession = assignmentBootstrapContext
  ? loadAssignmentSession({
      workbook: assignmentBootstrapContext.workbook ?? assignmentBootstrapContext,
      assignmentId:
        assignmentBootstrapContext.assignmentId ??
        assignmentBootstrapContext.request?.assignmentId ??
        '',
      studentEmail: assignmentBootstrapContext.student?.email ?? '',
    })
  : null;

const filteredRecords = computed(() => {
  if (selectedMode.value === 'equivalence') {
    return getEquivalenceChallenges({ difficulty: selectedDifficulty.value });
  }

  if (selectedMode.value === 'simplification') {
    return getSimplificationChallenges({ difficulty: selectedDifficulty.value });
  }

  return listProblems({ difficulty: selectedDifficulty.value, mode: selectedMode.value });
});

const selectedRecord = computed(
  () =>
    filteredRecords.value.find((record) => record.id === selectedRecordId.value) ??
    filteredRecords.value[0] ??
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

const selectedRecordLabel = computed(() =>
  selectedMode.value === 'truth-table' || selectedMode.value === 'venn' ? 'Problem' : 'Challenge',
);

const selectedConceptTag = computed(() => selectedRecord.value?.conceptTags[0] ?? '—');
const numericVariableTeachingCopy = getNumericVariableTeachingCopy();
const assignmentStudentLabel = computed(() => {
  if (!assignmentSession || assignmentSession.status !== 'ready') {
    return '—';
  }

  if (assignmentSession.student.name && assignmentSession.student.email) {
    return `${assignmentSession.student.name} <${assignmentSession.student.email}>`;
  }

  if (assignmentSession.student.name) {
    return assignmentSession.student.name;
  }

  return assignmentSession.student.email || 'No roster match';
});
const assignmentStudentLabelShort = computed(() => {
  if (!assignmentSession || assignmentSession.status !== 'ready') {
    return '—';
  }

  return assignmentSession.student.email || assignmentSession.student.name || 'No roster match';
});
const assignmentRosterLabel = computed(() => {
  if (!assignmentSession || assignmentSession.status !== 'ready') {
    return '—';
  }

  if (assignmentSession.student.className || assignmentSession.student.section) {
    return [assignmentSession.student.className, assignmentSession.student.section]
      .filter(Boolean)
      .join(' · ');
  }

  return 'No roster fields';
});
const assignmentHeroText = computed(() => {
  if (!assignmentSession || assignmentSession.status !== 'ready') {
    return '';
  }

  const currentLabel = assignmentSession.currentItem?.challenge.title ?? 'all queued items';
  return `Complete the queued challenges in order. The current item is ${currentLabel}, and the workbook-loaded roster data stays visible for the teacher's Sheets workflow.`;
});

watch(
  filteredRecords,
  (nextRecords) => {
    if (nextRecords.length === 0) {
      selectedRecordId.value = '';
      feedbackMessage.value = 'No compatible records are available for the current filters.';
      return;
    }

    const currentRecordExists = nextRecords.some(
      (record) => record.id === selectedRecordId.value,
    );

    if (!currentRecordExists) {
      selectedRecordId.value = nextRecords[0].id;
      feedbackMessage.value = `Loaded ${nextRecords[0].title}.`;
    }
  },
  { immediate: true },
);

watch(
  selectedRecord,
  (record, previousRecord) => {
    if (!record) {
      return;
    }

    if (record.id !== previousRecord?.id) {
      feedbackMessage.value = `Selected ${record.title} for ${selectedModeLabel.value} practice.`;
    }
  },
  { immediate: true },
);

function booleanLabel(value) {
  return value ? 'yes' : 'no';
}

function readAssignmentBootstrapContext() {
  const bootstrapContext = globalThis?.__BOOLEAN_PRACTICE_ASSIGNMENT_CONTEXT__ ?? null;

  if (!bootstrapContext || typeof bootstrapContext !== 'object') {
    return null;
  }

  return bootstrapContext;
}
</script>

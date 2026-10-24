<template>
  <div class="shape-puzzle-page-app" data-testid="shape-puzzle-page">
    <!-- Fallback Error View -->
    <div v-if="urlError" class="puzzle-error-container" role="alert">
      <h2 class="error-title">Puzzle Not Found</h2>
      <p class="error-message">{{ urlError }}</p>
      <button type="button" class="btn-error-reset" @click="resetToDefault">
        Go to Mystery Picture 1
      </button>
    </div>

    <!-- Main Puzzle View -->
    <div v-else-if="currentSheet" class="puzzle-layout-wrapper">
      <!-- Top Navigation & Header Bar -->
      <header class="puzzle-top-bar">
        <div class="top-title-group">
          <h1 class="main-puzzle-title">Shape Logic Puzzles</h1>
          <span class="sheet-title-badge" data-testid="sheet-title">{{ currentSheet.title }}</span>
          <span v-if="isTeacher" class="teacher-view-badge" data-testid="teacher-badge">
            Teacher Key
          </span>
        </div>

        <!-- Sheet Selector Controls -->
        <nav class="sheet-nav-group" aria-label="Sheet selection">
          <button
            type="button"
            class="sheet-nav-btn prev-btn"
            :disabled="currentSheetNumber <= 1"
            aria-label="Previous sheet"
            data-testid="prev-sheet-btn"
            @click="goToSheet(currentSheetNumber - 1)"
          >
            ◀
          </button>

          <div class="sheet-pills-list">
            <button
              v-for="num in totalSheets"
              :key="`sheet-pill-${num}`"
              type="button"
              class="sheet-pill-btn"
              :class="{ 'is-active': num === currentSheetNumber }"
              :aria-current="num === currentSheetNumber ? 'page' : undefined"
              :data-testid="`sheet-pill-${num}`"
              @click="goToSheet(num)"
            >
              {{ num }}
            </button>
          </div>

          <button
            type="button"
            class="sheet-nav-btn next-btn"
            :disabled="currentSheetNumber >= totalSheets"
            aria-label="Next sheet"
            data-testid="next-sheet-btn"
            @click="goToSheet(currentSheetNumber + 1)"
          >
            ▶
          </button>
        </nav>
      </header>

      <!-- Expression & Notation Banner -->
      <section class="expression-banner" aria-labelledby="expression-heading">
        <div class="expression-content">
          <span id="expression-heading" class="expression-label">Expression:</span>
          <span class="expression-code" data-testid="expression-text">
            {{ formattedExpression }}
          </span>
        </div>

        <div class="notation-toggle-wrap">
          <button
            type="button"
            class="btn-notation-toggle"
            data-testid="notation-toggle"
            :aria-label="`Toggle notation. Currently showing ${notationMode === 'words' ? 'Words' : 'Java Symbols'}`"
            @click="toggleNotation"
          >
            <span class="toggle-mode-tag">
              {{ notationMode === 'words' ? 'Java Symbols (&&, ||, !)' : 'Words (AND, OR, NOT)' }}
            </span>
          </button>
        </div>
      </section>

      <!-- Status & Feedback Area -->
      <div
        class="puzzle-feedback-banner"
        :class="{ 'is-solved': isSolved, 'is-error': isFeedbackError }"
        role="status"
        aria-live="polite"
        data-testid="puzzle-feedback"
      >
        <span v-if="isSolved" class="feedback-solved-icon">🎉</span>
        <span class="feedback-text">
          <strong v-if="isSolved" data-testid="solved-picture-name">
            Picture Revealed: {{ currentSheet.pictureName }}!
          </strong>
          <span v-else>{{ feedbackMessage }}</span>
        </span>
      </div>

      <!-- Main Two-Column Interactive Stage -->
      <main class="puzzle-workspace-grid">
        <!-- Step 2: Shape Diagram Canvas (Left) -->
        <div class="workspace-canvas-col">
          <ShapePuzzleCanvas
            :sheet="currentSheet"
            :shaded-region-ids="shadedRegionIds"
            :outputs-correct="outputsCorrect"
            :shading-checked="shadingChecked"
            :shading-correct="shadingCorrect"
            :is-solved="isSolved"
            :is-teacher="isTeacher"
            :active-hover-row="activeHoverRow"
            :active-focus-row="activeFocusRow"
            :is-greyscale="isGreyscale"
            @toggle-region="handleToggleRegion"
            @check-shading="handleCheckShading"
            @clear-shading="handleClearShading"
            @region-hover="setHoverRow"
            @region-focus="setFocusRow"
          />
        </div>

        <!-- Step 1: Truth Table (Right) -->
        <div class="workspace-table-col">
          <ShapePuzzleTable
            :sheet="currentSheet"
            :student-outputs="studentOutputs"
            :outputs-checked="outputsChecked"
            :outputs-correct="outputsCorrect"
            :shaded-region-ids="shadedRegionIds"
            :active-hover-row="activeHoverRow"
            :active-focus-row="activeFocusRow"
            :notation-mode="notationMode"
            :is-teacher="isTeacher"
            @update-output="handleUpdateOutput"
            @fill-all-outputs="handleFillAllOutputs"
            @clear-outputs="handleClearOutputs"
            @check-outputs="handleCheckOutputs"
            @row-hover="setHoverRow"
            @row-focus="setFocusRow"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ShapePuzzleCanvas from './ShapePuzzleCanvas.vue';
import ShapePuzzleTable from './ShapePuzzleTable.vue';
import { AVAILABLE_SETS, buildPuzzleUrl, parsePuzzleUrl } from './url.js';
import { buildShapePuzzleShadingHint, buildTruthTableHint } from './feedback.js';
import { generateTruthTable } from '@shared/truth-table/index.js';
import { formatExpressionSymbols, formatExpressionWords } from '@shared/notation/index.js';

// URL and State
const urlError = ref(null);
const currentSetId = ref('shapes-1');
const currentSheetNumber = ref(1);
const isTeacher = ref(false);
const isGreyscale = ref(false);

const activeSet = computed(() => AVAILABLE_SETS[currentSetId.value] || null);
const totalSheets = computed(() => activeSet.value?.sheets?.length || 4);
const currentSheet = computed(() => {
  if (!activeSet.value) return null;
  return activeSet.value.sheets[currentSheetNumber.value - 1] || null;
});

// Practice Progress State
const notationMode = ref('words'); // 'words' | 'symbols'
const studentOutputs = ref([]);
const outputsChecked = ref(false);
const outputsCorrect = ref(false);
const outputAttemptCount = ref(1);

const shadedRegionIds = ref(new Set());
const shadingChecked = ref(false);
const shadingCorrect = ref(false);
const shadingAttemptCount = ref(1);

const feedbackMessage = ref('');
const isFeedbackError = ref(false);

const activeHoverRow = ref(null);
const activeFocusRow = ref(null);

const tableData = computed(() => {
  if (!currentSheet.value) return null;
  return generateTruthTable(currentSheet.value.expression);
});

const isSolved = computed(() => {
  return outputsCorrect.value && shadingCorrect.value;
});

const formattedExpression = computed(() => {
  if (!currentSheet.value) return '';
  if (notationMode.value === 'symbols') {
    return formatExpressionSymbols(currentSheet.value.expression);
  }
  return formatExpressionWords(currentSheet.value.expression);
});

function loadFromUrl() {
  const parsed = parsePuzzleUrl(window.location.search);
  if (!parsed.isValid) {
    urlError.value = parsed.error;
    return;
  }

  urlError.value = null;
  currentSetId.value = parsed.setId;
  currentSheetNumber.value = parsed.sheetNumber;
  isTeacher.value = parsed.isTeacher;

  initSheetState();
}

function initSheetState() {
  if (!currentSheet.value || !tableData.value) return;

  const rowCount = tableData.value.rows.length;

  if (isTeacher.value) {
    // Teacher view: pre-filled outputs and pre-shaded regions
    studentOutputs.value = tableData.value.rows.map((r) => r.result);
    outputsChecked.value = true;
    outputsCorrect.value = true;
    shadedRegionIds.value = new Set(currentSheet.value.intendedTrueRows || []);
    shadingChecked.value = true;
    shadingCorrect.value = true;
    feedbackMessage.value = 'Teacher key view: Showing solved outputs and regions.';
    isFeedbackError.value = false;
  } else {
    // Student view: blank outputs, clean unshaded diagram
    studentOutputs.value = Array(rowCount).fill(null);
    outputsChecked.value = false;
    outputsCorrect.value = false;
    outputAttemptCount.value = 1;

    shadedRegionIds.value = new Set();
    shadingChecked.value = false;
    shadingCorrect.value = false;
    shadingAttemptCount.value = 1;

    feedbackMessage.value =
      'Step 1: Fill the truth table output column with T or F, then click Check Table Outputs.';
    isFeedbackError.value = false;
  }
}

function goToSheet(sheetNum) {
  if (sheetNum < 1 || sheetNum > totalSheets.value) return;
  currentSheetNumber.value = sheetNum;

  const newUrl = buildPuzzleUrl({
    setId: currentSetId.value,
    sheetNumber: sheetNum,
    isTeacher: isTeacher.value,
  });
  window.history.pushState(null, '', newUrl);
  initSheetState();
}

function resetToDefault() {
  currentSetId.value = 'shapes-1';
  currentSheetNumber.value = 1;
  const newUrl = buildPuzzleUrl({ setId: 'shapes-1', sheetNumber: 1, isTeacher: false });
  window.history.pushState(null, '', newUrl);
  loadFromUrl();
}

function toggleNotation() {
  notationMode.value = notationMode.value === 'words' ? 'symbols' : 'words';
}

function setHoverRow(row) {
  activeHoverRow.value = row;
}

function setFocusRow(row) {
  activeFocusRow.value = row;
}

// Student Output Actions
function handleUpdateOutput(idx, val) {
  const next = [...studentOutputs.value];
  next[idx] = val;
  studentOutputs.value = next;
  if (outputsChecked.value && !outputsCorrect.value) {
    outputsChecked.value = false;
  }
}

function handleFillAllOutputs(val) {
  studentOutputs.value = Array(tableData.value.rows.length).fill(val);
  if (outputsChecked.value && !outputsCorrect.value) {
    outputsChecked.value = false;
  }
}

function handleClearOutputs() {
  studentOutputs.value = Array(tableData.value.rows.length).fill(null);
  outputsChecked.value = false;
}

function handleCheckOutputs() {
  const rows = tableData.value.rows;
  let firstBlankIdx = -1;
  let firstIncorrectIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    if (studentOutputs.value[i] === null) {
      if (firstBlankIdx === -1) firstBlankIdx = i;
    } else if (studentOutputs.value[i] !== rows[i].result) {
      if (firstIncorrectIdx === -1) firstIncorrectIdx = i;
    }
  }

  const ast = tableData.value.ast;
  const exprLabel =
    notationMode.value === 'symbols'
      ? formatExpressionSymbols(currentSheet.value.expression)
      : formatExpressionWords(currentSheet.value.expression);

  if (firstBlankIdx !== -1) {
    const row = rows[firstBlankIdx];
    feedbackMessage.value = buildTruthTableHint({
      attemptCount: outputAttemptCount.value,
      step: { label: exprLabel, node: ast },
      row,
      isBlank: true,
    });
    outputAttemptCount.value++;
    outputsChecked.value = true;
    outputsCorrect.value = false;
    isFeedbackError.value = true;
    return;
  }

  if (firstIncorrectIdx !== -1) {
    const row = rows[firstIncorrectIdx];
    feedbackMessage.value = buildTruthTableHint({
      attemptCount: outputAttemptCount.value,
      step: { label: exprLabel, node: ast },
      row,
      isBlank: false,
    });
    outputAttemptCount.value++;
    outputsChecked.value = true;
    outputsCorrect.value = false;
    isFeedbackError.value = true;
    return;
  }

  // All outputs correct!
  outputsCorrect.value = true;
  outputsChecked.value = true;
  isFeedbackError.value = false;
  feedbackMessage.value =
    'Truth table outputs verified! Now shade every region whose row is TRUE to reveal the picture.';
}

// Region Shading Actions
function handleToggleRegion(id) {
  if (isSolved.value && !isTeacher.value) return;

  const next = new Set(shadedRegionIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  shadedRegionIds.value = next;

  if (shadingChecked.value && !shadingCorrect.value) {
    shadingChecked.value = false;
  }
}

function handleClearShading() {
  if (isSolved.value && !isTeacher.value) return;
  shadedRegionIds.value = new Set();
  shadingChecked.value = false;
}

function handleCheckShading() {
  if (!outputsCorrect.value && !isTeacher.value) {
    feedbackMessage.value =
      'Please complete and verify the truth table output column before checking shading.';
    isFeedbackError.value = true;
    return;
  }

  const intended = new Set(currentSheet.value.intendedTrueRows || []);
  const student = shadedRegionIds.value;

  const missed = [...intended].filter((r) => !student.has(r));
  const extra = [...student].filter((r) => !intended.has(r));

  if (missed.length === 0 && extra.length === 0) {
    shadingCorrect.value = true;
    shadingChecked.value = true;
    isFeedbackError.value = false;
    // Solved! pictureName is revealed
    feedbackMessage.value = `Picture Revealed: ${currentSheet.value.pictureName}! Great job!`;
  } else {
    shadingCorrect.value = false;
    shadingChecked.value = true;
    isFeedbackError.value = true;
    feedbackMessage.value = buildShapePuzzleShadingHint({
      attemptCount: shadingAttemptCount.value,
      sheet: currentSheet.value,
      missedRegionIds: missed,
      extraRegionIds: extra,
    });
    shadingAttemptCount.value++;
  }
}

onMounted(() => {
  loadFromUrl();
  window.addEventListener('popstate', loadFromUrl);
});
</script>

<style scoped>
.shape-puzzle-page-app {
  max-width: 1240px;
  margin: 0 auto;
  padding: 10px 16px 20px 16px;
  display: flex;
  flex-direction: column;
}

/* Error View */
.puzzle-error-container {
  max-width: 600px;
  margin: 60px auto;
  padding: 24px;
  background: #1e293b;
  border: 1px solid #ef4444;
  border-radius: 8px;
  text-align: center;
}

.error-title {
  color: #f87171;
  margin-top: 0;
}

.btn-error-reset {
  margin-top: 16px;
  padding: 8px 18px;
  font-weight: 700;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* Top Navigation Bar */
.puzzle-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e293b;
}

.top-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-puzzle-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #f8fafc;
}

.sheet-title-badge {
  font-size: 0.82rem;
  font-weight: 700;
  background: #1e293b;
  color: #93c5fd;
  border: 1px solid #334155;
  padding: 2px 10px;
  border-radius: 12px;
}

.teacher-view-badge {
  font-size: 0.76rem;
  font-weight: 700;
  background: #7c2d12;
  color: #fdba74;
  border: 1px solid #ea580c;
  padding: 2px 8px;
  border-radius: 4px;
}

/* Sheet Nav Buttons */
.sheet-nav-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sheet-nav-btn {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sheet-nav-btn:hover:not(:disabled) {
  background: #334155;
  color: #ffffff;
}

.sheet-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sheet-pills-list {
  display: flex;
  gap: 4px;
}

.sheet-pill-btn {
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sheet-pill-btn:hover {
  background: #334155;
  color: #f8fafc;
}

.sheet-pill-btn.is-active {
  background: #2563eb;
  color: #ffffff;
  border-color: #3b82f6;
}

/* Expression Banner */
.expression-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  padding: 8px 14px;
  background: #151e32;
  border: 1px solid #24324f;
  border-radius: 6px;
}

.expression-content {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.expression-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.expression-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 1.15rem;
  font-weight: 800;
  color: #38bdf8;
}

.btn-notation-toggle {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-notation-toggle:hover {
  background: #334155;
  color: #ffffff;
  border-color: #475569;
}

/* Status / Feedback Banner */
.puzzle-feedback-banner {
  margin-top: 8px;
  padding: 8px 14px;
  border-radius: 6px;
  background: #1e293b;
  border: 1px solid #334155;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
  color: #e2e8f0;
}

.puzzle-feedback-banner.is-solved {
  background: #064e3b;
  border-color: #10b981;
  color: #d1fae5;
  font-size: 0.95rem;
}

.puzzle-feedback-banner.is-error {
  background: #451a1a;
  border-color: #b91c1c;
  color: #fecaca;
}

.feedback-solved-icon {
  font-size: 1.1rem;
}

/* Two-column Interactive Workspace Grid */
.puzzle-workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 16px;
  margin-top: 10px;
  align-items: start;
}

/* Responsive Narrow Screen (< 860px) */
@media (max-width: 859px) {
  .puzzle-workspace-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .expression-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .notation-toggle-wrap {
    align-self: flex-end;
  }
}
</style>

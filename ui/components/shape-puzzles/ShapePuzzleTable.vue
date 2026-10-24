<template>
  <div
    class="shape-puzzle-table-root"
    data-testid="shape-puzzle-table"
  >
    <!-- Desktop Full Table View (>= 860px) -->
    <div class="desktop-table-container">
      <div class="table-header-bar">
        <h3 class="table-heading">
          Truth Table
        </h3>
        <span class="table-subheading">Step 1: Predict outputs</span>
      </div>

      <div
        v-if="isTeacher"
        class="bulk-actions-bar"
        role="group"
        aria-label="Bulk output edit controls"
      >
        <button
          type="button"
          class="btn-bulk"
          data-testid="table-fill-true"
          :disabled="outputsCorrect && !isTeacher"
          @click="emit('fill-all-outputs', true)"
        >
          Fill All T
        </button>
        <button
          type="button"
          class="btn-bulk"
          data-testid="table-fill-false"
          :disabled="outputsCorrect && !isTeacher"
          @click="emit('fill-all-outputs', false)"
        >
          Fill All F
        </button>
        <button
          type="button"
          class="btn-bulk"
          data-testid="table-clear-column"
          :disabled="outputsCorrect && !isTeacher"
          @click="emit('clear-outputs')"
        >
          Clear
        </button>
      </div>

      <!-- Optional "Break it down" Disclosure -->
      <details
        v-if="intermediateSteps.length > 0"
        class="break-it-down-details"
        data-testid="break-it-down"
        @toggle="onToggleBreakDown"
      >
        <summary class="break-it-down-summary">
          <span>🔍 Break it down (optional subexpression steps)</span>
        </summary>
        <p class="break-it-down-note">
          Reference columns below evaluate smaller subexpressions first.
        </p>
      </details>

      <div class="table-scroll-wrap">
        <table
          class="puzzle-truth-table"
          role="table"
          aria-label="Truth table for shape puzzle"
        >
          <thead>
            <tr>
              <th
                scope="col"
                class="th-row"
              >
                Row
              </th>
              <th
                v-for="v in variables"
                :key="v"
                scope="col"
                class="th-var"
              >
                {{ v }}
              </th>

              <!-- Intermediate columns if break it down open -->
              <template v-if="isBreakDownOpen">
                <th
                  v-for="step in intermediateSteps"
                  :key="step.id"
                  scope="col"
                  class="th-subexpr"
                >
                  {{ formatSubexprLabel(step.node) }}
                </th>
              </template>

              <th
                scope="col"
                class="th-target-output"
              >
                {{ targetExpressionLabel }}
              </th>
              <th
                scope="col"
                class="th-shaded-status"
                title="Current shading on diagram"
              >
                Shaded
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in tableData.rows"
              :key="`row-${row.id}`"
              class="table-row"
              :class="{
                'is-row-hovered': activeHoverRow === idx + 1,
                'is-row-focused': activeFocusRow === idx + 1,
                'is-row-correct': outputsCorrect,
              }"
              @mouseenter="emit('row-hover', idx + 1)"
              @mouseleave="emit('row-hover', null)"
              @focusin="emit('row-focus', idx + 1)"
              @focusout="emit('row-focus', null)"
            >
              <td class="td-row">
                <span class="row-badge-pill">{{ idx + 1 }}</span>
              </td>
              <td
                v-for="v in variables"
                :key="`${idx}-${v}`"
                class="td-var"
              >
                {{ getRowVarValue(row, v) ? 'T' : 'F' }}
              </td>

              <!-- Intermediate values if break it down open -->
              <template v-if="isBreakDownOpen">
                <td
                  v-for="step in intermediateSteps"
                  :key="`subval-${step.id}-${idx}`"
                  class="td-subexpr"
                >
                  {{ row.values[step.id] ? 'T' : 'F' }}
                </td>
              </template>

              <!-- Target Output Cell (Student Input) -->
              <td class="td-target-output">
                <button
                  type="button"
                  class="cell-output-btn"
                  :class="{
                    'val-true': studentOutputs[idx] === true,
                    'val-false': studentOutputs[idx] === false,
                    'val-blank': studentOutputs[idx] === null,
                    'is-locked': outputsCorrect && !isTeacher,
                  }"
                  :data-testid="`output-cell-${idx}`"
                  :aria-label="`Row ${idx + 1} output for ${targetExpressionLabel}, currently ${formatAnswer(studentOutputs[idx])}`"
                  :disabled="outputsCorrect && !isTeacher"
                  @click="toggleRowOutput(idx)"
                  @keydown.enter.prevent="toggleRowOutput(idx)"
                  @keydown.space.prevent="toggleRowOutput(idx)"
                >
                  {{ formatAnswer(studentOutputs[idx]) }}
                </button>
              </td>

              <!-- Shading Status Indicator -->
              <td class="td-shaded-status">
                <span
                  class="shading-indicator"
                  :class="{ 'is-shaded': shadedRegionIds.has(idx) }"
                  :title="shadedRegionIds.has(idx) ? 'Region shaded' : 'Region unshaded'"
                  aria-hidden="true"
                >
                  {{ shadedRegionIds.has(idx) ? '●' : '○' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-actions-footer">
        <button
          type="button"
          class="btn-check-table"
          data-testid="btn-check-table"
          :disabled="outputsCorrect && !isTeacher"
          @click="emit('check-outputs')"
        >
          {{ outputsCorrect ? '✓ Outputs Verified' : 'Check Table Outputs' }}
        </button>
      </div>
    </div>

    <!-- Mobile Compact Row View (< 860px) -->
    <div class="mobile-inspector-container">
      <div class="inspector-header">
        <h3 class="inspector-title">
          Truth Table Inspector
        </h3>
        <span class="inspector-step">Step 1: Set output for each row</span>
      </div>

      <!-- Row Selector Bar -->
      <div
        class="mobile-row-selector"
        role="tablist"
        aria-label="Select row to inspect"
      >
        <button
          v-for="(row, idx) in tableData.rows"
          :key="`m-row-${idx}`"
          type="button"
          role="tab"
          class="mobile-row-tab"
          :class="{
            'is-selected': selectedMobileRow === idx,
            'is-filled': studentOutputs[idx] !== null,
            'is-correct': outputsCorrect,
          }"
          :aria-selected="selectedMobileRow === idx"
          :data-testid="`mobile-tab-row-${idx + 1}`"
          @click="selectMobileRow(idx)"
        >
          <span class="tab-label">R{{ idx + 1 }}</span>
          <span class="tab-val">{{ formatAnswer(studentOutputs[idx]) }}</span>
        </button>
      </div>

      <!-- Active Row Card -->
      <div
        v-if="activeMobileRowData"
        class="mobile-row-card"
      >
        <div class="mobile-card-row-head">
          <span class="card-row-num">Row {{ selectedMobileRow + 1 }}</span>
          <span
            class="card-shaded-tag"
            :class="{ 'is-shaded': shadedRegionIds.has(selectedMobileRow) }"
          >
            {{ shadedRegionIds.has(selectedMobileRow) ? 'Region Shaded' : 'Region Unshaded' }}
          </span>
        </div>

        <div class="mobile-vars-row">
          <div
            v-for="v in variables"
            :key="`m-var-${v}`"
            class="m-var-pill"
          >
            <span class="m-var-name">{{ v }}:</span>
            <span class="m-var-value">{{ getRowVarValue(activeMobileRowData, v) ? 'T' : 'F' }}</span>
          </div>
        </div>

        <div class="mobile-expr-block">
          <span class="m-expr-title">Expression:</span>
          <span class="m-expr-code">{{ targetExpressionLabel }}</span>
        </div>

        <div class="mobile-output-action">
          <span class="m-output-prompt">Your Output:</span>
          <button
            type="button"
            class="cell-output-btn m-output-btn"
            :class="{
              'val-true': studentOutputs[selectedMobileRow] === true,
              'val-false': studentOutputs[selectedMobileRow] === false,
              'val-blank': studentOutputs[selectedMobileRow] === null,
            }"
            :disabled="outputsCorrect && !isTeacher"
            :data-testid="`mobile-output-toggle`"
            @click="toggleRowOutput(selectedMobileRow)"
          >
            {{ formatAnswer(studentOutputs[selectedMobileRow]) }}
            <span class="btn-subtext">(Tap to cycle T / F)</span>
          </button>
        </div>
      </div>

      <div class="mobile-footer-actions">
        <button
          type="button"
          class="btn-check-table"
          data-testid="btn-check-table-mobile"
          :disabled="outputsCorrect && !isTeacher"
          @click="emit('check-outputs')"
        >
          {{ outputsCorrect ? '✓ Outputs Verified' : 'Check Table Outputs' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { generateTruthTable } from '@shared/truth-table/index.js';
import { formatExpressionSymbols, formatExpressionWords } from '@shared/notation/index.js';

const props = defineProps({
  sheet: {
    type: Object,
    required: true,
  },
  studentOutputs: {
    type: Array,
    required: true,
  },
  outputsChecked: {
    type: Boolean,
    default: false,
  },
  outputsCorrect: {
    type: Boolean,
    default: false,
  },
  shadedRegionIds: {
    type: Set,
    required: true,
  },
  activeHoverRow: {
    type: Number,
    default: null,
  },
  activeFocusRow: {
    type: Number,
    default: null,
  },
  notationMode: {
    type: String,
    default: 'words', // 'words' | 'symbols'
  },
  isTeacher: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update-output',
  'fill-all-outputs',
  'clear-outputs',
  'check-outputs',
  'row-hover',
  'row-focus',
]);

const variables = computed(() => props.sheet.variables || []);

const tableData = computed(() => {
  return generateTruthTable(props.sheet.expression);
});

// Break it down disclosure state
const isBreakDownOpen = ref(false);
function onToggleBreakDown(event) {
  isBreakDownOpen.value = event.target.open;
}

function getRowVarValue(row, v) {
  if (!row || !row.assignment) return false;
  return (
    row.assignment[v] ??
    row.assignment[v.toLowerCase()] ??
    row.assignment[v.toUpperCase()] ??
    false
  );
}

// Intermediate subexpressions for "Break it down" disclosure (excludes root expression)
const intermediateSteps = computed(() => {
  const steps = tableData.value.subexpressions || [];
  if (steps.length <= 1) return [];
  // Return all but the root node (the last step)
  return steps.slice(0, -1);
});

const targetExpressionLabel = computed(() => {
  if (props.notationMode === 'symbols') {
    return formatExpressionSymbols(props.sheet.expression);
  }
  return formatExpressionWords(props.sheet.expression);
});

function formatSubexprLabel(node) {
  if (props.notationMode === 'symbols') {
    return formatExpressionSymbols(node);
  }
  return formatExpressionWords(node);
}

function formatAnswer(val) {
  if (val === true) return 'T';
  if (val === false) return 'F';
  return '–';
}

function toggleRowOutput(idx) {
  if (props.outputsCorrect && !props.isTeacher) return;
  const curr = props.studentOutputs[idx];
  let next = null;
  if (curr === null) {
    next = true;
  } else if (curr === true) {
    next = false;
  } else {
    next = null;
  }
  emit('update-output', idx, next);
}

// Mobile row selection
const selectedMobileRow = ref(0);

const activeMobileRowData = computed(() => {
  return tableData.value.rows[selectedMobileRow.value] || null;
});

function selectMobileRow(idx) {
  selectedMobileRow.value = idx;
  emit('row-hover', idx + 1);
}
</script>

<style scoped>
.shape-puzzle-table-root {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

/* Header & Meta */
.table-header-bar,
.inspector-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 14px 6px 14px;
  border-bottom: 1px solid #e2e8f0;
}

.table-heading,
.inspector-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.table-subheading,
.inspector-step {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

/* Bulk toolbar */
.bulk-actions-bar {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.btn-bulk {
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-bulk:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Break it down */
.break-it-down-details {
  padding: 6px 14px;
  font-size: 0.8rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.break-it-down-summary {
  cursor: pointer;
  font-weight: 600;
  color: #1e293b;
  user-select: none;
}

.break-it-down-note {
  margin: 4px 0 2px 0;
  font-size: 0.76rem;
  color: #64748b;
}

/* Desktop Table */
.table-scroll-wrap {
  overflow-x: auto;
  overflow-y: visible;
}

.puzzle-truth-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
  text-align: center;
}

.puzzle-truth-table th {
  background: #f8fafc;
  color: #334155;
  font-weight: 600;
  padding: 4px 6px;
  font-size: 0.8rem;
  border-bottom: 2px solid #cbd5e1;
  position: sticky;
  top: 0;
  z-index: 1;
}

.puzzle-truth-table td {
  padding: 2px 6px;
  border-bottom: 1px solid #f1f5f9;
  color: #0f172a;
  font-size: 0.82rem;
}

.table-row {
  transition: background-color 0.15s ease;
}

.table-row:hover,
.table-row.is-row-hovered {
  background: #f0f9ff;
}

.table-row.is-row-focused {
  background: #fffbeb;
  outline: 2px solid #f59e0b;
}

.table-row.is-row-correct {
  background: #f0fdf4;
}

.row-badge-pill {
  display: inline-block;
  min-width: 18px;
  height: 18px;
  line-height: 16px;
  font-size: 0.72rem;
  font-weight: 700;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  color: #334155;
}

.td-var {
  font-weight: 600;
  color: #475569;
}

.th-subexpr,
.td-subexpr {
  background: #fafafa;
  color: #64748b;
  font-size: 0.8rem;
  border-left: 1px dashed #e2e8f0;
  border-right: 1px dashed #e2e8f0;
}

.th-target-output {
  background: #f0fdf4 !important;
  color: #166534 !important;
  border-bottom-color: #86efac !important;
}

.cell-output-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 24px;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 4px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cell-output-btn:hover:not(:disabled) {
  border-color: #2563eb;
  background: #eff6ff;
}

.cell-output-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}

.cell-output-btn.val-true,
.cell-output-btn.val-false {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.table-row.is-row-correct .cell-output-btn.val-true {
  background: #dcfce7;
  color: #15803d;
  border-color: #86efac;
}

.table-row.is-row-correct .cell-output-btn.val-false {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
}

.cell-output-btn.val-blank {
  color: #94a3b8;
  border-style: dashed;
}

.cell-output-btn.is-locked {
  cursor: default;
}

.shading-indicator {
  font-size: 1.2rem;
  color: #94a3b8;
}

.shading-indicator.is-shaded {
  color: #2563eb;
}

/* Footer & Check */
.table-actions-footer,
.mobile-footer-actions {
  padding: 6px 12px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.btn-check-table {
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
  background: #2563eb;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.btn-check-table:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-check-table:disabled {
  background: #10b981;
  cursor: default;
}

/* Mobile Inspector Mode (< 860px) */
.mobile-inspector-container {
  display: none;
}

.mobile-row-selector {
  display: flex;
  overflow-x: auto;
  gap: 6px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-row-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}

.mobile-row-tab.is-selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}

.mobile-row-tab.is-correct {
  border-color: #86efac;
}

.tab-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
}

.tab-val {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.mobile-row-card {
  padding: 12px 14px;
}

.mobile-card-row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-row-num {
  font-weight: 700;
  font-size: 1rem;
  color: #0f172a;
}

.card-shaded-tag {
  font-size: 0.76rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #64748b;
  font-weight: 600;
}

.card-shaded-tag.is-shaded {
  background: #dbeafe;
  color: #1d4ed8;
}

.mobile-vars-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.m-var-pill {
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.m-var-name {
  color: #64748b;
  margin-right: 4px;
}

.m-var-value {
  color: #0f172a;
}

.mobile-expr-block {
  margin-bottom: 14px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.85rem;
}

.m-expr-title {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 2px;
}

.m-expr-code {
  font-weight: 700;
  color: #0f172a;
}

.mobile-output-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-output-prompt {
  font-weight: 600;
  color: #334155;
  font-size: 0.9rem;
}

.m-output-btn {
  width: 140px;
  height: 44px;
  flex-direction: column;
  gap: 1px;
}

.btn-subtext {
  font-size: 0.65rem;
  font-weight: 400;
  color: #64748b;
}

/* Media Query: Breakpoint at 860px */
@media (max-width: 859px) {
  .desktop-table-container {
    display: none;
  }
  .mobile-inspector-container {
    display: flex;
    flex-direction: column;
  }
}
</style>

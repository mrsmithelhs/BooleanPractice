<template>
  <div class="admin-app-container">
    <header class="admin-header">
      <div class="header-top">
        <div>
          <h1 class="admin-title">
            Student Usage Review
          </h1>
          <p class="admin-subtitle">
            Local teacher review view — inspect exported student progress files
          </p>
        </div>
        <div class="header-links">
          <a
            href="/puzzle.html"
            class="nav-link"
          >← Back to Puzzles</a>
        </div>
      </div>
      <div
        class="honest-limit-banner"
        data-testid="honest-limit-banner"
      >
        <strong>Honest limit:</strong> Flags indicate items for teacher review, not proof of misconduct. Verification catches casual copying and editing; a determined student can edit any file and recompute hashes.
      </div>
    </header>

    <!-- Controls Bar -->
    <section class="admin-controls-card">
      <div class="controls-grid">
        <div class="drop-zone-container">
          <label
            class="drop-zone"
            :class="{ 'is-dragging': isDragging }"
            data-testid="admin-drop-zone"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
          >
            <input
              type="file"
              multiple
              accept=".json,application/json"
              class="hidden-file-input"
              data-testid="admin-file-input"
              @change="onFileSelect"
            >
            <span class="drop-icon">📁</span>
            <span class="drop-text">Drag student .json files here, or <u>browse</u></span>
          </label>
        </div>

        <div class="class-filter-container">
          <label
            for="expected-class-input"
            class="filter-label"
          >
            Expected Class Code
          </label>
          <input
            id="expected-class-input"
            v-model="expectedClassCode"
            type="text"
            class="filter-input"
            data-testid="expected-class-input"
            placeholder="e.g. PERIOD-1"
          >
          <p class="filter-hint">
            Flags files with a different or missing class code
          </p>
        </div>

        <div class="actions-container">
          <button
            type="button"
            class="btn-csv"
            :disabled="loadedStudents.length === 0"
            data-testid="export-csv-btn"
            @click="exportCsv"
          >
            Export class summary (CSV)
          </button>
          <button
            type="button"
            class="btn-clear"
            :disabled="loadedStudents.length === 0"
            data-testid="clear-files-btn"
            @click="clearAll"
          >
            Clear files
          </button>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <div
      v-if="loadedStudents.length === 0"
      class="empty-state-card"
    >
      <p class="empty-text">
        No student files loaded yet. Drop exported student JSON files above to review progress and flags.
      </p>
    </div>

    <!-- Class Progress Table -->
    <section
      v-else
      class="admin-table-section"
    >
      <div class="table-header-meta">
        <span class="file-count-badge">{{ loadedStudents.length }} student file(s) loaded</span>
        <span class="csv-privacy-notice">Note: Keep exported summary CSVs in local/ to protect student privacy.</span>
      </div>

      <div class="table-responsive">
        <table
          class="class-table"
          data-testid="admin-class-table"
        >
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Install ID</th>
              <th>Solved Sheets</th>
              <th>Active Time</th>
              <th>Last Activity</th>
              <th>Review Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in processedStudents"
              :key="`row-${item.index}`"
              :class="{ 'has-flags': item.flags.length > 0 }"
              data-testid="student-row"
            >
              <td>
                <button
                  type="button"
                  class="btn-student-name"
                  data-testid="student-name-btn"
                  @click="selectedStudent = item"
                >
                  {{ item.summary.student?.name || '(anonymous)' }}
                </button>
              </td>
              <td>
                <span :class="{ 'mismatch-text': hasClassMismatch(item) }">
                  {{ item.summary.student?.classCode || '–' }}
                </span>
              </td>
              <td>
                <code>{{ (item.summary.installId || '').slice(0, 8) }}</code>
              </td>
              <td>
                <div class="solved-grid">
                  <span
                    v-for="(sheet, key) in item.summary.sheets"
                    :key="key"
                    class="sheet-chip"
                    :class="{ 'is-solved': sheet.solved }"
                    :title="`${key}: ${sheet.solved ? 'Solved (' + sheet.checks + ' checks)' : 'Unsolved'}`"
                  >
                    {{ key.replace('shapes-', 'S') }} {{ sheet.solved ? '✓' : '✗' }}
                  </span>
                  <span
                    v-if="Object.keys(item.summary.sheets || {}).length === 0"
                    class="no-sheets"
                  >None</span>
                </div>
              </td>
              <td>{{ formatMs(item.summary.activeTimeMs) }}</td>
              <td>{{ formatDate(item.summary.lastActivityAt) }}</td>
              <td>
                <div
                  class="flags-cell"
                  data-testid="student-flags"
                >
                  <span
                    v-if="item.flags.length === 0"
                    class="clean-tag"
                  >
                    ✓ Clean
                  </span>
                  <span
                    v-for="(flag, fIdx) in item.flags"
                    :key="`flag-${fIdx}`"
                    class="flag-pill"
                    :class="`flag-${flag.type}`"
                    :title="flag.detail"
                    data-testid="flag-badge"
                  >
                    {{ flag.label }}
                  </span>
                  <span
                    v-for="(info, iIdx) in item.infos"
                    :key="`info-${iIdx}`"
                    class="info-pill"
                    :title="info.detail"
                  >
                    ℹ Multi-device
                  </span>
                </div>
              </td>
              <td>
                <button
                  type="button"
                  class="btn-inspect"
                  @click="selectedStudent = item"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Student Detail Modal -->
    <AdminStudentDetail
      v-if="selectedStudent"
      :student="selectedStudent"
      @close="selectedStudent = null"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { compareFiles, summarizeFile } from '@shared/usage/analyzer.js';
import AdminStudentDetail from './AdminStudentDetail.vue';

const loadedStudents = ref([]);
const expectedClassCode = ref('');
const isDragging = ref(false);
const selectedStudent = ref(null);

const processedStudents = computed(() => {
  if (loadedStudents.value.length === 0) return [];
  return compareFiles(loadedStudents.value, {
    expectedClassCode: expectedClassCode.value,
  });
});

async function processJsonFiles(files) {
  for (const file of files) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const summary = await summarizeFile(json);
      summary.fileName = file.name;
      loadedStudents.value.push(summary);
    } catch {
      // If parsing fails, push an invalid entry
      loadedStudents.value.push({
        isValid: false,
        error: `Could not parse ${file.name}`,
        fileName: file.name,
        student: { name: file.name },
        flags: [{ type: 'invalid_json', label: 'Could not parse JSON' }],
        sheets: {},
        events: [],
      });
    }
  }
}

function onFileSelect(event) {
  const files = Array.from(event.target.files || []);
  if (files.length > 0) {
    processJsonFiles(files);
  }
  event.target.value = '';
}

function onDrop(event) {
  isDragging.value = false;
  const files = Array.from(event.dataTransfer?.files || []).filter((f) =>
    f.name.endsWith('.json') || f.type === 'application/json',
  );
  if (files.length > 0) {
    processJsonFiles(files);
  }
}

function clearAll() {
  loadedStudents.value = [];
  selectedStudent.value = null;
}

function hasClassMismatch(item) {
  return item.flags.some((f) => f.type === 'class_code_mismatch');
}

function formatMs(ms) {
  if (!ms || ms <= 0) return '0s';
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function formatDate(val) {
  if (!val) return '–';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(val);
  }
}

function exportCsv() {
  const headers = [
    'Student Name',
    'Class Code',
    'Install ID',
    'Total Solved',
    'Active Time (min)',
    'Last Activity',
    'Review Flags',
    'Solves Detail',
  ];

  const rows = processedStudents.value.map((item) => {
    const s = item.summary;
    const name = s.student?.name || '(anonymous)';
    const cls = s.student?.classCode || '';
    const install = (s.installId || '').slice(0, 8);

    let solvedCount = 0;
    const solveParts = [];
    for (const [k, sh] of Object.entries(s.sheets || {})) {
      if (sh.solved) {
        solvedCount++;
        solveParts.push(`${k}(${sh.checks} checks)`);
      }
    }

    const activeMin = (Number(s.activeTimeMs || 0) / 60000).toFixed(1);
    const last = s.lastActivityAt || '';
    const flagLabels = item.flags.map((f) => f.label).join('; ') || 'None';

    return [
      `"${name.replace(/"/g, '""')}"`,
      `"${cls.replace(/"/g, '""')}"`,
      `"${install}"`,
      solvedCount,
      activeMin,
      `"${last}"`,
      `"${flagLabels.replace(/"/g, '""')}"`,
      `"${solveParts.join(', ')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  link.href = url;
  link.download = `bp-class-summary-${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.admin-app-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 20px;
}

.admin-header {
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.admin-title {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #f8fafc;
}

.admin-subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #94a3b8;
}

.nav-link {
  color: #38bdf8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-link:hover {
  text-decoration: underline;
}

.honest-limit-banner {
  padding: 10px 14px;
  background: #1e293b;
  border-left: 4px solid #38bdf8;
  border-radius: 0 6px 6px 0;
  font-size: 0.85rem;
  color: #cbd5e1;
  line-height: 1.4;
}

.admin-controls-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 24px;
}

.controls-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.drop-zone-container {
  flex: 2;
  min-width: 280px;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 16px;
  background: #0f172a;
  border: 2px dashed #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.drop-zone:hover,
.drop-zone.is-dragging {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.05);
}

.hidden-file-input {
  display: none;
}

.drop-icon {
  font-size: 1.5rem;
}

.drop-text {
  font-size: 0.9rem;
  color: #cbd5e1;
}

.class-filter-container {
  flex: 1;
  min-width: 200px;
}

.filter-label {
  display: block;
  font-size: 0.84rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.filter-input {
  width: 100%;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #f8fafc;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.filter-input:focus {
  outline: none;
  border-color: #38bdf8;
}

.filter-hint {
  margin: 4px 0 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.actions-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}

.btn-csv {
  padding: 9px 14px;
  background: #059669;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-csv:hover:not(:disabled) {
  background: #047857;
}

.btn-csv:disabled,
.btn-clear:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-clear {
  padding: 8px 14px;
  background: #334155;
  color: #f1f5f9;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-clear:hover:not(:disabled) {
  background: #475569;
}

.empty-state-card {
  padding: 48px 24px;
  background: #1e293b;
  border: 1px dashed #334155;
  border-radius: 8px;
  text-align: center;
}

.empty-text {
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 0;
}

.admin-table-section {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
}

.table-header-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.file-count-badge {
  font-size: 0.85rem;
  font-weight: 600;
  color: #38bdf8;
}

.csv-privacy-notice {
  font-size: 0.78rem;
  color: #94a3b8;
}

.table-responsive {
  overflow-x: auto;
}

.class-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  text-align: left;
}

.class-table th {
  padding: 12px 14px;
  background: #0f172a;
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid #334155;
}

.class-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #334155;
  color: #f8fafc;
}

.has-flags td {
  background: rgba(185, 28, 28, 0.05);
}

.btn-student-name {
  background: none;
  border: none;
  color: #38bdf8;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.btn-student-name:hover {
  text-decoration: underline;
}

.mismatch-text {
  color: #f87171;
  font-weight: 600;
}

.solved-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sheet-chip {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.76rem;
  background: #334155;
  color: #94a3b8;
}

.sheet-chip.is-solved {
  background: #064e3b;
  color: #6ee7b7;
  font-weight: 600;
}

.no-sheets {
  color: #64748b;
  font-size: 0.8rem;
}

.flags-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.clean-tag {
  color: #4ade80;
  font-weight: 600;
  font-size: 0.82rem;
}

.flag-pill {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.76rem;
  background: #7f1d1d;
  color: #fecaca;
  border: 1px solid #b91c1c;
}

.info-pill {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.76rem;
  background: #1e3a8a;
  color: #bfdbfe;
}

.btn-inspect {
  padding: 4px 10px;
  background: #334155;
  color: #f1f5f9;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-inspect:hover {
  background: #475569;
}
</style>

<template>
  <div
    v-if="student"
    class="detail-modal-backdrop"
    @click.self="$emit('close')"
  >
    <div
      class="detail-modal-card"
      role="dialog"
      aria-modal="true"
      :aria-label="`Usage Details for ${studentName}`"
      data-testid="student-detail-modal"
    >
      <header class="detail-modal-header">
        <div>
          <h2 class="detail-student-name">
            {{ studentName }}
          </h2>
          <div class="detail-metadata">
            <span>Class: <strong>{{ studentClassCode || 'None' }}</strong></span>
            <span>Install ID: <code>{{ studentInstallId }}</code></span>
            <span>Exported: {{ formattedExportedAt }}</span>
          </div>
        </div>
        <button
          type="button"
          class="btn-close-detail"
          aria-label="Close details"
          data-testid="close-detail-btn"
          @click="$emit('close')"
        >
          ✕
        </button>
      </header>

      <div class="detail-modal-body">
        <!-- Integrity & Chain Status -->
        <section class="detail-section integrity-section">
          <h3 class="section-title">
            Verification & Integrity
          </h3>
          <div class="integrity-badges">
            <span
              class="status-pill"
              :class="student.summary.integrity?.ok ? 'is-verified' : 'is-mismatch'"
              data-testid="integrity-status"
            >
              SHA-256: {{ student.summary.integrity?.ok ? 'Verified Hash' : 'Integrity Mismatch / Edited' }}
            </span>
            <span
              class="status-pill"
              :class="student.summary.hashChain?.ok ? 'is-verified' : 'is-mismatch'"
              data-testid="chain-status"
            >
              Hash Chain: {{ student.summary.hashChain?.ok ? 'Intact Chain' : 'Broken Chain at Seq ' + student.summary.hashChain?.brokenAtSeq }}
            </span>
            <span
              v-if="student.summary.hashChain?.truncated"
              class="status-pill is-truncated"
            >
              Retention Truncated (Seq >= {{ student.summary.hashChain?.firstRetainedSeq }})
            </span>
          </div>
          <div
            v-if="student.summary.integrity?.sha256"
            class="hash-display"
          >
            <code>{{ student.summary.integrity.sha256 }}</code>
          </div>
        </section>

        <!-- Active Flags -->
        <section
          v-if="student.flags && student.flags.length > 0"
          class="detail-section flags-section"
        >
          <h3 class="section-title flags-title">
            Review Flags ({{ student.flags.length }})
          </h3>
          <ul class="detail-flags-list">
            <li
              v-for="(flag, idx) in student.flags"
              :key="`flag-${idx}`"
              class="detail-flag-item"
              data-testid="detail-flag-item"
            >
              <strong class="flag-label">{{ flag.label }}</strong>
              <p class="flag-detail">
                {{ flag.detail }}
              </p>
            </li>
          </ul>
        </section>

        <!-- Sheet Progress -->
        <section class="detail-section">
          <h3 class="section-title">
            Sheet Progress & Attempts
          </h3>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Sheet</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Checks</th>
                  <th>Active Time</th>
                  <th>Solved At</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(sheetData, sheetKey) in student.summary.sheets"
                  :key="sheetKey"
                >
                  <td><code>{{ sheetKey }}</code></td>
                  <td>
                    <span
                      v-if="sheetData.solved"
                      class="tag-solved"
                    >✓ Solved</span>
                    <span
                      v-else
                      class="tag-unsolved"
                    >Unsolved</span>
                  </td>
                  <td>{{ sheetData.mode || '–' }}</td>
                  <td>{{ sheetData.checks || 0 }} (out: {{ sheetData.outputChecks || 0 }}, shd: {{ sheetData.shadingChecks || 0 }})</td>
                  <td>{{ formatMs(sheetData.activeMs) }}</td>
                  <td>{{ formatDate(sheetData.solvedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Event Timeline -->
        <section class="detail-section">
          <h3 class="section-title">
            Event Timeline ({{ student.summary.events?.length || 0 }} events)
          </h3>
          <div class="table-wrap timeline-wrap">
            <table class="detail-table timeline-table">
              <thead>
                <tr>
                  <th style="width: 50px;">
                    Seq
                  </th>
                  <th style="width: 140px;">
                    Time
                  </th>
                  <th style="width: 150px;">
                    Type
                  </th>
                  <th>Data</th>
                  <th style="width: 110px;">
                    PrevHash
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ev in student.summary.events"
                  :key="`ev-${ev.seq}`"
                  :class="{ 'is-teacher-view-row': ev.type === 'teacher_view_opened' }"
                >
                  <td>{{ ev.seq }}</td>
                  <td>{{ formatDate(ev.t) }}</td>
                  <td>
                    <span
                      class="event-type-badge"
                      :class="`type-${ev.type}`"
                    >
                      {{ ev.type }}
                    </span>
                  </td>
                  <td><code>{{ JSON.stringify(ev.data) }}</code></td>
                  <td><code :title="ev.prevHash">{{ ev.prevHash ? ev.prevHash.slice(0, 8) + '...' : '–' }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer class="detail-modal-footer">
        <p class="honest-limit-note">
          Honest limit: Flags indicate items for teacher review, not proof of misconduct.
        </p>
        <button
          type="button"
          class="btn-primary"
          @click="$emit('close')"
        >
          Close
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  student: {
    type: Object,
    default: null,
  },
});

defineEmits(['close']);

const studentName = computed(() => props.student?.summary?.student?.name || '(anonymous)');
const studentClassCode = computed(() => props.student?.summary?.student?.classCode || '');
const studentInstallId = computed(() => props.student?.summary?.installId || '–');
const formattedExportedAt = computed(() => formatDate(props.student?.summary?.exportedAt));

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
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return String(val);
  }
}
</script>

<style scoped>
.detail-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.detail-modal-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.detail-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 24px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.detail-student-name {
  margin: 0 0 6px 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #f8fafc;
}

.detail-metadata {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: #94a3b8;
}

.btn-close-detail {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-close-detail:hover {
  color: #f8fafc;
  background: #334155;
}

.detail-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 16px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: #e2e8f0;
}

.flags-title {
  color: #f87171;
}

.integrity-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 600;
}

.is-verified {
  background: #064e3b;
  color: #6ee7b7;
  border: 1px solid #059669;
}

.is-mismatch {
  background: #7f1d1d;
  color: #fca5a5;
  border: 1px solid #dc2626;
}

.is-truncated {
  background: #78350f;
  color: #fde68a;
  border: 1px solid #d97706;
}

.hash-display {
  font-size: 0.78rem;
  color: #94a3b8;
  word-break: break-all;
}

.detail-flags-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-flag-item {
  background: rgba(185, 28, 28, 0.2);
  border-left: 3px solid #ef4444;
  padding: 8px 12px;
  border-radius: 0 4px 4px 0;
}

.flag-label {
  display: block;
  font-size: 0.88rem;
  color: #fca5a5;
}

.flag-detail {
  margin: 4px 0 0 0;
  font-size: 0.82rem;
  color: #e2e8f0;
}

.table-wrap {
  overflow-x: auto;
}

.timeline-wrap {
  max-height: 250px;
  overflow-y: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
  text-align: left;
}

.detail-table th {
  background: #0f172a;
  padding: 8px 10px;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
  font-weight: 600;
}

.detail-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #334155;
  color: #f1f5f9;
}

.tag-solved {
  color: #4ade80;
  font-weight: 600;
}

.tag-unsolved {
  color: #94a3b8;
}

.event-type-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.78rem;
  background: #334155;
  color: #cbd5e1;
}

.event-type-badge.type-teacher_view_opened {
  background: #78350f;
  color: #fef08a;
  font-weight: 700;
}

.is-teacher-view-row td {
  background: rgba(180, 83, 9, 0.15);
}

.detail-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background: #1e293b;
  border-top: 1px solid #334155;
}

.honest-limit-note {
  margin: 0;
  font-size: 0.78rem;
  color: #94a3b8;
}

.btn-primary {
  padding: 8px 16px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>

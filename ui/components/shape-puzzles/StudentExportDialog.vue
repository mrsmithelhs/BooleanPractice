<template>
  <div
    v-if="isOpen"
    class="export-dialog-backdrop"
    @click.self="handleClose"
  >
    <div
      class="export-dialog-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      @keydown.esc="handleClose"
    >
      <header class="export-dialog-header">
        <h2
          id="export-dialog-title"
          class="export-dialog-title"
        >
          Download My Progress
        </h2>
        <button
          type="button"
          class="export-dialog-close-btn"
          aria-label="Close dialog"
          @click="handleClose"
        >
          ✕
        </button>
      </header>

      <div class="export-dialog-body">
        <div
          v-if="!isStorageAvailable"
          class="export-storage-warning"
          role="alert"
          data-testid="export-storage-warning"
        >
          Browser storage is unavailable or blocked in this browser. Your activity cannot be saved between sessions, but you can still download your progress from this session now.
        </div>

        <div
          v-if="isDownloaded"
          class="export-success-banner"
          role="status"
          data-testid="export-success-message"
        >
          <span class="success-icon">✓</span>
          <span>Downloaded! Turn this file in where your teacher asks.</span>
        </div>

        <form
          v-else
          class="export-form"
          @submit.prevent="handleDownload"
        >
          <p class="export-intro">
            Save a record of your solved sheets and puzzle attempts to turn in to your teacher.
          </p>

          <div class="form-group">
            <label
              for="export-student-name"
              class="form-label"
            >
              Your Full Name <span class="required-star">*</span>
            </label>
            <input
              id="export-student-name"
              v-model="studentName"
              type="text"
              class="form-input"
              data-testid="student-name-input"
              placeholder="e.g. Alex Carter"
              required
              autofocus
            >
          </div>

          <div class="form-group">
            <label
              for="export-class-code"
              class="form-label"
            >
              Class Code <span class="optional-tag">(optional)</span>
            </label>
            <input
              id="export-class-code"
              v-model="classCode"
              type="text"
              class="form-input"
              data-testid="class-code-input"
              placeholder="e.g. PERIOD-1"
            >
          </div>

          <div class="export-actions">
            <button
              type="button"
              class="btn-secondary"
              data-testid="cancel-export-btn"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              data-testid="confirm-download-btn"
              :disabled="!studentName.trim()"
            >
              Download Progress (.json)
            </button>
          </div>
        </form>

        <div
          v-if="isDownloaded"
          class="export-actions"
          style="margin-top: 16px;"
        >
          <button
            type="button"
            class="btn-primary"
            data-testid="close-export-btn"
            @click="handleClose"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isStorageAvailable: {
    type: Boolean,
    default: true,
  },
  defaultName: {
    type: String,
    default: '',
  },
  defaultClassCode: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'download']);

const studentName = ref(props.defaultName);
const classCode = ref(props.defaultClassCode);
const isDownloaded = ref(false);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      studentName.value = props.defaultName;
      classCode.value = props.defaultClassCode;
      isDownloaded.value = false;
    }
  },
);

function handleClose() {
  emit('close');
}

function handleDownload() {
  if (!studentName.value.trim()) return;
  emit('download', {
    name: studentName.value.trim(),
    classCode: classCode.value.trim(),
  });
  isDownloaded.value = true;
}
</script>

<style scoped>
.export-dialog-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.export-dialog-modal {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
  overflow: hidden;
}

.export-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.export-dialog-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: #f1f5f9;
}

.export-dialog-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.export-dialog-close-btn:hover {
  color: #f8fafc;
  background: #334155;
}

.export-dialog-body {
  padding: 18px;
}

.export-storage-warning {
  padding: 10px 14px;
  background: #7f1d1d;
  border: 1px solid #b91c1c;
  color: #fecaca;
  border-radius: 6px;
  font-size: 0.88rem;
  margin-bottom: 14px;
  line-height: 1.4;
}

.export-success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: #064e3b;
  border: 1px solid #059669;
  color: #a7f3d0;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
}

.success-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.export-intro {
  margin-top: 0;
  margin-bottom: 14px;
  color: #cbd5e1;
  font-size: 0.9rem;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 0.88rem;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 6px;
}

.required-star {
  color: #f87171;
}

.optional-tag {
  color: #94a3b8;
  font-weight: 400;
  font-size: 0.8rem;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #f8fafc;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
}

.export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-secondary {
  padding: 8px 16px;
  background: #334155;
  color: #f1f5f9;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-primary {
  padding: 8px 16px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

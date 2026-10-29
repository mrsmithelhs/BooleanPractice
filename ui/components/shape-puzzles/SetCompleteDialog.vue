<template>
  <div
    v-if="isOpen"
    class="set-complete-backdrop"
    @click.self="emit('close')"
  >
    <div
      class="set-complete-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-complete-title"
      data-testid="set-complete-dialog"
      @keydown.esc="emit('close')"
    >
      <h2
        id="set-complete-title"
        class="set-complete-title"
      >
        {{ hasChallengesLeft ? 'Core puzzles complete!' : 'Set complete!' }}
      </h2>
      <p class="set-complete-text">
        Download your progress file now and turn it in.
      </p>
      <p
        v-if="hasChallengesLeft"
        class="set-complete-text"
      >
        Want more? Try the Challenge sheets next, then download again when you finish.
      </p>
      <div class="set-complete-actions">
        <button
          ref="downloadBtn"
          type="button"
          class="set-complete-download-btn"
          data-testid="set-complete-download-btn"
          @click="emit('download')"
        >
          Download my progress
        </button>
        <button
          type="button"
          class="set-complete-later-btn"
          data-testid="set-complete-later-btn"
          @click="emit('close')"
        >
          Not now
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  hasChallengesLeft: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'download']);
const downloadBtn = ref(null);

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      await nextTick();
      downloadBtn.value?.focus();
    }
  },
);
</script>

<style scoped>
.set-complete-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.set-complete-modal {
  background: #fff;
  border-radius: 10px;
  padding: 22px 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  text-align: center;
}
.set-complete-title {
  margin: 0 0 10px;
  font-size: 1.4rem;
  color: #14532d;
}
.set-complete-text {
  margin: 0 0 10px;
  color: #1f2937;
}
.set-complete-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}
.set-complete-download-btn {
  font-size: 1.05rem;
  font-weight: bold;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}
.set-complete-later-btn {
  padding: 8px 16px;
  border: 1px solid #9ca3af;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}
.set-complete-download-btn:focus-visible,
.set-complete-later-btn:focus-visible {
  outline: 3px solid #f59e0b;
  outline-offset: 2px;
}
</style>

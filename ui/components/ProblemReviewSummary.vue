<template>
  <article
    class="problem-review-summary"
    :data-testid="testId"
  >
    <article class="mini-card problem-review-summary__intro">
      <p class="problem-review-summary__eyebrow">
        Problem Review
      </p>
      <h3>{{ summary.problemTitle }}</h3>
      <p class="problem-review-summary__completion">
        {{ summary.completionMessage }}
      </p>
      <p class="problem-review-summary__final-correctness">
        {{ summary.finalCorrectText }}
      </p>
    </article>

    <article
      v-if="submissionPayload"
      class="mini-card problem-review-summary__submission"
      data-testid="submission-output"
    >
      <h4>Submission Output</h4>
      <p class="problem-review-summary__submission-note">
        {{ submissionStatusText }}
      </p>

      <div class="problem-review-summary__submission-actions">
        <button
          type="button"
          class="action-button"
          data-testid="submission-submit"
          :disabled="!submissionGateway.available || submissionStatus === 'sending' || submissionStatus === 'sent'"
          @click="submitSubmission"
        >
          {{ submissionButtonLabel }}
        </button>
      </div>

      <details class="details-card problem-review-summary__disclosure">
        <summary class="details-card__summary">
          Submission details
        </summary>
        <div class="problem-review-summary__submission-grid problem-review-summary__disclosure-content">
          <p v-if="submissionPayload.assignmentId">
            Assignment: {{ submissionPayload.assignmentTitle || submissionPayload.assignmentId }}
          </p>
          <p v-if="submissionPayload.assignmentItemId">
            Item: {{ submissionPayload.assignmentItemId }} #{{ submissionPayload.assignmentSequence }}
          </p>
          <p v-if="submissionPayload.studentEmail">
            Student: {{ submissionPayload.studentEmail }}
          </p>
          <p>Attempts: {{ submissionPayload.attempts }}</p>
          <p>Hints used: {{ submissionPayload.hintsUsed }}</p>
          <p>Autofill uses: {{ submissionPayload.autofillUses }}</p>
          <p>Bulk actions: {{ submissionPayload.bulkActionUses }}</p>
          <p>Build target: {{ submissionPayload.buildTarget }}</p>
          <p>Mode: {{ submissionPayload.mode }}</p>
        </div>
      </details>
    </article>

    <div class="problem-review-summary__grid">
      <article class="mini-card">
        <h4>Concept Tags</h4>
        <ul class="problem-review-summary__tag-list">
          <li
            v-for="tag in summary.conceptTags"
            :key="tag"
          >
            {{ tag }}
          </li>
        </ul>
      </article>

      <article class="mini-card">
        <h4>Attempts And Hints</h4>
        <p>{{ summary.attemptsText }}</p>
        <p>{{ summary.hintsText }}</p>
      </article>
    </div>

    <details
      v-if="summary.stepSummaries.length > 0"
      class="details-card problem-review-summary__disclosure"
    >
      <summary class="details-card__summary">
        Step Review
      </summary>
      <div class="problem-review-summary__disclosure-content">
        <ul class="problem-review-summary__step-list">
          <li
            v-for="step in summary.stepSummaries"
            :key="step.key"
          >
            <strong>{{ step.label }}</strong>
            <span>{{ step.attemptSummary }}</span>
            <span>{{ step.detail }}</span>
          </li>
        </ul>
      </div>
    </details>

    <details
      v-if="summary.reviewHighlights.length > 0"
      class="details-card problem-review-summary__disclosure"
    >
      <summary class="details-card__summary">
        What To Review
      </summary>
      <div class="problem-review-summary__disclosure-content">
        <ul class="problem-review-summary__highlight-list">
          <li
            v-for="highlight in summary.reviewHighlights"
            :key="highlight"
          >
            {{ highlight }}
          </li>
        </ul>
      </div>
    </details>

    <details
      v-if="summary.comparison"
      class="details-card problem-review-summary__disclosure"
    >
      <summary class="details-card__summary">
        Cross-representation comparison
      </summary>
      <div class="problem-review-summary__disclosure-content">
        <AssignmentRegionComparison
          :comparison="summary.comparison"
          test-id="comparison-surface"
        />
      </div>
    </details>

    <article class="mini-card">
      <h4>Next Practice</h4>
      <p>{{ summary.nextPracticeText }}</p>
      <details class="details-card problem-review-summary__disclosure">
        <summary class="details-card__summary">
          Why this next?
        </summary>
        <div class="problem-review-summary__disclosure-content">
          <p
            v-if="summary.nextPracticeExpression"
            class="problem-review-summary__expression"
          >
            {{ summary.nextPracticeExpression }}
          </p>
          <p class="problem-review-summary__reason">
            {{ summary.nextPracticeReason }}
          </p>
        </div>
      </details>
    </article>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { createSubmissionGateway } from '@shared/index';
import AssignmentRegionComparison from './AssignmentRegionComparison.vue';

const props = defineProps({
  summary: {
    type: Object,
    required: true,
  },
  submissionPayload: {
    type: Object,
    default: null,
  },
  testId: {
    type: String,
    default: 'problem-review-summary',
  },
});

const submissionStatus = ref('idle');
const submissionMessage = ref('');
const submissionGateway = createSubmissionGateway();

const submissionButtonLabel = computed(() => {
  if (submissionStatus.value === 'sending') {
    return 'Submitting...';
  }

  if (submissionStatus.value === 'sent') {
    return 'Submitted';
  }

  return submissionGateway.available ? 'Submit Completion' : 'Submission Unavailable';
});

const submissionStatusText = computed(() => {
  if (!props.submissionPayload) {
    return '';
  }

  if (submissionStatus.value === 'sending') {
    return 'Submitting this completion to the GAS bridge...';
  }

  if (submissionStatus.value === 'sent') {
    return submissionMessage.value || 'Submission sent to the sheet bridge.';
  }

  if (submissionStatus.value === 'error') {
    return submissionMessage.value || 'Submission failed.';
  }

  if (!submissionGateway.available) {
    return `${submissionGateway.reason} The static GitHub Pages build keeps this control disabled.`;
  }

  return 'Ready to send this completion to a GAS web app bridge.';
});

watch(
  () => props.submissionPayload,
  () => {
    submissionStatus.value = 'idle';
    submissionMessage.value = '';
  },
  { immediate: true },
);

function submitSubmission() {
  if (!props.submissionPayload || !submissionGateway.available) {
    return;
  }

  submissionStatus.value = 'sending';
  submissionMessage.value = '';

  submissionGateway
    .submit(props.submissionPayload)
    .then((response) => {
      submissionStatus.value = 'sent';
      submissionMessage.value =
        response?.rowNumber != null
          ? `Submission sent to row ${response.rowNumber}.`
          : 'Submission sent to the sheet bridge.';
    })
    .catch((error) => {
      submissionStatus.value = 'error';
      submissionMessage.value = error instanceof Error ? error.message : String(error);
    });
}
</script>

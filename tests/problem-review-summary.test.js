import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildProblemReviewSummary,
  buildSubmissionPayload,
  generateTruthTable,
  getProblemById,
} from '@shared/index';
import ProblemReviewSummary from '@/components/ProblemReviewSummary.vue';

function getStepDefinitions(problem) {
  const truthTable = generateTruthTable(problem.ast);

  return truthTable.subexpressions.length > 0
    ? truthTable.subexpressions
    : [
        {
          id: 'result',
          label: truthTable.expression,
          node: truthTable.ast,
        },
      ];
}

describe('problem review summary', () => {
  beforeEach(() => {
    vi.useRealTimers();
    delete globalThis.google;
  });

  it('summarizes a first-try truth-table completion', () => {
    const problem = getProblemById('tt-01-literal-a');
    const stepDefinitions = getStepDefinitions(problem);
    const stepReviews = stepDefinitions.map((step) => ({
      stepId: step.id,
      label: step.label,
      attemptCount: 1,
      failedChecks: 0,
      completed: true,
      lastMistake: null,
    }));

    const summary = buildProblemReviewSummary({
      problem,
      mode: 'truth-table',
      stepDefinitions,
      stepReviews,
    });

    expect(summary.completionMessage).toContain('first try');
    expect(summary.conceptSummaryText).toContain('literals');
    expect(summary.hintsText).toContain('0 hints used');
    expect(summary.reviewHighlights).toEqual([]);
    expect(summary.nextPracticeTarget?.id).not.toBe(problem.id);
  });

  it('summarizes a corrected venn completion and suggests a next target', () => {
    const problem = getProblemById('tt-09-three-variable-venn');
    const stepDefinitions = getStepDefinitions(problem);
    const stepReviews = stepDefinitions.map((step, index) => ({
      stepId: step.id,
      label: step.label,
      attemptCount: index === 0 ? 3 : 1,
      failedChecks: index === 0 ? 2 : 0,
      completed: true,
      lastMistake:
        index === 0
          ? {
              type: 'regions',
              missedRegionLabels: ['a && b'],
              extraRegionLabels: ['c'],
              summary: 'Missed regions: a && b. Extra regions: c.',
            }
          : null,
    }));

    const summary = buildProblemReviewSummary({
      problem,
      mode: 'venn',
      stepDefinitions,
      stepReviews,
    });

    expect(summary.completionMessage).toContain('after correcting 2 mistakes');
    expect(summary.reviewHighlights).toEqual(
      expect.arrayContaining(['Missed regions: a && b. Extra regions: c.']),
    );
    expect(summary.nextPracticeTarget?.id).not.toBe(problem.id);
    expect(summary.nextPracticeReason).toContain('practicing');
  });

  it('builds a cross-representation comparison for compatible problems', () => {
    const problem = getProblemById('tt-09-three-variable-venn');
    const stepDefinitions = getStepDefinitions(problem);

    const summary = buildProblemReviewSummary({
      problem,
      mode: 'truth-table',
      stepDefinitions,
      stepReviews: stepDefinitions.map((step) => ({
        stepId: step.id,
        label: step.label,
        attemptCount: 1,
        failedChecks: 0,
        completed: true,
        lastMistake: null,
      })),
    });

    expect(summary.comparison).not.toBeNull();
    expect(summary.comparison.pairs).toHaveLength(8);
    expect(summary.comparison.pairs[0]).toMatchObject({
      id: 0,
      rowId: 0,
      regionId: 0,
      assignmentBits: '000',
      regionBits: '000',
    });
  });

  it('renders the comparison surface with synchronized selection', async () => {
    const problem = getProblemById('tt-09-three-variable-venn');
    const stepDefinitions = getStepDefinitions(problem);
    const summary = buildProblemReviewSummary({
      problem,
      mode: 'truth-table',
      stepDefinitions,
      stepReviews: stepDefinitions.map((step) => ({
        stepId: step.id,
        label: step.label,
        attemptCount: 1,
        failedChecks: 0,
        completed: true,
        lastMistake: null,
      })),
    });

    const wrapper = mount(ProblemReviewSummary, {
      props: { summary },
    });

    const pairButton = wrapper.get('[data-testid="comparison-pair-3"]');
    expect(pairButton.text()).toContain('Row 4');

    await pairButton.trigger('click');

    expect(wrapper.get('[data-testid="comparison-row-3"]').text()).toContain('Truth Table Row 4');
    expect(wrapper.get('[data-testid="comparison-region-3"]').text()).toContain('Matching Venn Region 011');
  });

  it('hides the submission card in the static build', () => {
    const problem = getProblemById('tt-01-literal-a');
    const stepDefinitions = getStepDefinitions(problem);
    const summary = buildProblemReviewSummary({
      problem,
      mode: 'truth-table',
      stepDefinitions,
      stepReviews: stepDefinitions.map((step) => ({
        stepId: step.id,
        label: step.label,
        attemptCount: 1,
        failedChecks: 0,
        completed: true,
        lastMistake: null,
      })),
    });
    const submissionPayload = buildSubmissionPayload({
      problem,
      mode: 'truth-table',
      summary,
      attempts: summary.totalAttempts,
      hintsUsed: summary.totalHintsUsed,
      autofillUses: 0,
      bulkActionUses: 0,
      appVersion: '0.1.0',
      buildTarget: 'static',
    });

    const wrapper = mount(ProblemReviewSummary, {
      props: {
        summary,
        submissionPayload,
      },
    });

    expect(wrapper.find('[data-testid="submission-output"]').exists()).toBe(false);
  });

  it('shows assignment metadata in the submission card when present', () => {
    const problem = getProblemById('tt-01-literal-a');
    const stepDefinitions = getStepDefinitions(problem);
    const summary = buildProblemReviewSummary({
      problem,
      mode: 'truth-table',
      stepDefinitions,
      stepReviews: stepDefinitions.map((step) => ({
        stepId: step.id,
        label: step.label,
        attemptCount: 1,
        failedChecks: 0,
        completed: true,
        lastMistake: null,
      })),
    });
    const submissionPayload = buildSubmissionPayload({
      problem,
      mode: 'truth-table',
      summary,
      attempts: summary.totalAttempts,
      hintsUsed: summary.totalHintsUsed,
      autofillUses: 0,
      bulkActionUses: 0,
      appVersion: '0.1.0',
      buildTarget: 'gas',
      assignmentContext: {
        assignment: {
          assignmentId: 'assignment-1',
          title: 'Assignment One',
        },
        item: {
          assignmentItemId: 'assignment-1-item-1',
          sequence: 1,
        },
        student: {
          email: 'student@example.com',
          name: 'Student One',
          className: 'Period 1',
          section: 'A',
        },
      },
    });

    const wrapper = mount(ProblemReviewSummary, {
      props: {
        summary,
        submissionPayload,
      },
    });

    expect(wrapper.get('[data-testid="submission-output"]').text()).toContain('Assignment One');
    expect(wrapper.get('[data-testid="submission-output"]').text()).toContain('student@example.com');
  });

  it('shows product-safe copy when GAS submission is unavailable in this preview', () => {
    const problem = getProblemById('tt-01-literal-a');
    const stepDefinitions = getStepDefinitions(problem);
    const summary = buildProblemReviewSummary({
      problem,
      mode: 'truth-table',
      stepDefinitions,
      stepReviews: stepDefinitions.map((step) => ({
        stepId: step.id,
        label: step.label,
        attemptCount: 1,
        failedChecks: 0,
        completed: true,
        lastMistake: null,
      })),
    });
    const submissionPayload = buildSubmissionPayload({
      problem,
      mode: 'truth-table',
      summary,
      attempts: summary.totalAttempts,
      hintsUsed: summary.totalHintsUsed,
      autofillUses: 0,
      bulkActionUses: 0,
      appVersion: '0.1.0',
      buildTarget: 'gas',
    });

    const wrapper = mount(ProblemReviewSummary, {
      props: {
        summary,
        submissionPayload,
      },
    });

    expect(wrapper.get('[data-testid="submission-output"]').text()).toContain(
      "Classroom submission is not connected in this preview.",
    );
    expect(wrapper.get('[data-testid="submission-output"]').text()).not.toContain(
      'google.script.run',
    );
    expect(wrapper.get('[data-testid="submission-submit"]').text()).toBe('Submission Unavailable');
  });

  it('keeps the completion visible and gives retry guidance when a submission fails', async () => {
    vi.useFakeTimers();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const problem = getProblemById('tt-01-literal-a');
    const stepDefinitions = getStepDefinitions(problem);
    const summary = buildProblemReviewSummary({
      problem,
      mode: 'truth-table',
      stepDefinitions,
      stepReviews: stepDefinitions.map((step) => ({
        stepId: step.id,
        label: step.label,
        attemptCount: 1,
        failedChecks: 0,
        completed: true,
        lastMistake: null,
      })),
    });
    const submissionPayload = buildSubmissionPayload({
      problem,
      mode: 'truth-table',
      summary,
      attempts: summary.totalAttempts,
      hintsUsed: summary.totalHintsUsed,
      autofillUses: 0,
      bulkActionUses: 0,
      appVersion: '0.1.0',
      buildTarget: 'gas',
    });

    const simulator = {
      failureHandler: null,
      withSuccessHandler() {
        return this;
      },
      withFailureHandler(handler) {
        this.failureHandler = handler;
        return this;
      },
      recordSubmission() {
        setTimeout(() => {
          this.failureHandler?.(new Error('No submission sheet configured.'));
        }, 25);
        return this;
      },
    };

    globalThis.google = { script: { run: simulator } };

    const wrapper = mount(ProblemReviewSummary, {
      props: {
        summary,
        submissionPayload,
      },
    });

    try {
      await wrapper.get('[data-testid="submission-submit"]').trigger('click');
      await vi.advanceTimersByTimeAsync(25);

      expect(wrapper.get('[data-testid="submission-output"]').text()).toContain(
        'Try again in a moment or ask your teacher for help.',
      );
      expect(wrapper.get('[data-testid="submission-output"]').text()).not.toContain(
        'No submission sheet configured.',
      );
      expect(wrapper.get('[data-testid="submission-submit"]').text()).toBe('Try Again');
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});

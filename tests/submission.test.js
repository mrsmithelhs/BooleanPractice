import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SUBMISSION_HEADER_ROW,
  buildProblemReviewSummary,
  buildSubmissionPayload,
  buildSubmissionSheetRow,
  createGoogleScriptRunSimulator,
  createSubmissionGateway,
  generateTruthTable,
  getProblemById,
} from '@shared/index';

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

describe('submission output', () => {
  beforeEach(() => {
    vi.useRealTimers();
    delete globalThis.google;
    delete globalThis.__BOOLEAN_PRACTICE_BUILD_TARGET__;
  });

  it('builds a payload with counts and metadata for GAS submission', () => {
    const problem = getProblemById('tt-09-three-variable-venn');
    const stepDefinitions = getStepDefinitions(problem);
    const summary = buildProblemReviewSummary({
      problem,
      mode: 'truth-table',
      stepDefinitions,
      stepReviews: stepDefinitions.map((step, index) => ({
        stepId: step.id,
        label: step.label,
        attemptCount: index === 0 ? 3 : 1,
        failedChecks: index === 0 ? 2 : 0,
        completed: true,
        lastMistake: null,
      })),
    });

    const payload = buildSubmissionPayload({
      problem,
      mode: 'truth-table',
      summary,
      attempts: summary.totalAttempts,
      hintsUsed: summary.totalHintsUsed,
      autofillUses: 1,
      bulkActionUses: 2,
      appVersion: '0.1.0',
      buildTarget: 'gas',
      submittedAt: '2026-05-06T12:00:00.000Z',
    });

    expect(payload).toMatchObject({
      schemaVersion: 1,
      submittedAt: '2026-05-06T12:00:00.000Z',
      buildTarget: 'gas',
      appVersion: '0.1.0',
      problemId: problem.id,
      expressionId: problem.id,
      problemTitle: problem.title,
      expressionText: problem.expression,
      mode: 'truth-table',
      attempts: summary.totalAttempts,
      hintsUsed: summary.totalHintsUsed,
      autofillUses: 1,
      bulkActionUses: 2,
      correctness: 'correct',
      stepCount: summary.stepSummaries.length,
      nextPracticeTargetId: summary.nextPracticeTarget?.id ?? '',
    });
    expect(payload.conceptTags).toEqual(problem.conceptTags);
    expect(payload.variables).toEqual(problem.variables);
    expect(payload.reviewHighlights).toEqual(summary.reviewHighlights);

    const row = buildSubmissionSheetRow(payload, 'student@example.com');
    expect(row).toHaveLength(SUBMISSION_HEADER_ROW.length);
    expect(row[0]).toBe(1);
    expect(row[row.length - 1]).toBe('student@example.com');
  });

  it('includes assignment and roster metadata when present', () => {
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

    const payload = buildSubmissionPayload({
      problem,
      mode: 'truth-table',
      summary,
      attempts: 1,
      hintsUsed: 0,
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

    expect(payload.assignmentId).toBe('assignment-1');
    expect(payload.assignmentTitle).toBe('Assignment One');
    expect(payload.assignmentItemId).toBe('assignment-1-item-1');
    expect(payload.assignmentSequence).toBe(1);
    expect(payload.studentName).toBe('Student One');
    expect(payload.className).toBe('Period 1');
    expect(payload.section).toBe('A');
    expect(payload.studentEmail).toBe('student@example.com');
  });

  it('simulates google.script.run success and failure with configurable delay', async () => {
    vi.useFakeTimers();

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
    const payload = buildSubmissionPayload({
      problem,
      mode: 'truth-table',
      summary,
      attempts: 1,
      hintsUsed: 0,
      appVersion: '0.1.0',
      buildTarget: 'gas',
    });

    const simulator = createGoogleScriptRunSimulator({
      delayMs: 25,
      responseFactory: (record) => ({ ok: true, echoedProblemId: record.problemId }),
    });
    const gateway = createSubmissionGateway({ scriptRun: simulator.script.run });
    const successPromise = gateway.submit(payload);

    await vi.advanceTimersByTimeAsync(25);
    await expect(successPromise).resolves.toMatchObject({
      ok: true,
      echoedProblemId: payload.problemId,
    });
    expect(simulator.calls).toHaveLength(1);

    const failingSimulator = createGoogleScriptRunSimulator({
      delayMs: 30,
      shouldFail: true,
      failureMessage: 'No submission sheet configured.',
    });
    const failingGateway = createSubmissionGateway({ scriptRun: failingSimulator.script.run });
    const failurePromise = failingGateway.submit(payload);
    failurePromise.catch(() => {});

    await vi.advanceTimersByTimeAsync(30);
    await expect(failurePromise).rejects.toThrow('No submission sheet configured.');
  });

  it('reports unavailable submission bridges for the static build', async () => {
    const gateway = createSubmissionGateway({ scriptRun: null });

    expect(gateway.available).toBe(false);
    await expect(gateway.submit({})).rejects.toThrow('google.script.run is unavailable in this build.');
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildAssignmentSubmissionContext,
  loadAssignmentSession,
  validateAssignmentWorkbook,
} from '@shared/index';

function buildWorkbook() {
  return {
    assignments: [
      {
        assignmentId: 'assignment-1',
        title: 'Assignment One',
        sequence: 1,
        active: true,
        className: 'Period 1',
      },
    ],
    assignmentItems: [
      {
        assignmentItemId: 'assignment-1-item-1',
        assignmentId: 'assignment-1',
        sequence: 1,
        challengeMode: 'truth-table',
        challengeId: 'tt-01-literal-a',
        active: true,
      },
      {
        assignmentItemId: 'assignment-1-item-2',
        assignmentId: 'assignment-1',
        sequence: 2,
        challengeMode: 'equivalence',
        challengeId: 'eq-04-de-morgan',
        active: true,
      },
    ],
    roster: [
      {
        studentEmail: 'student@example.com',
        studentName: 'Student One',
        className: 'Period 1',
        section: 'A',
        assignmentId: 'assignment-1',
        active: true,
      },
    ],
    submissions: [],
  };
}

describe('assignment workbook', () => {
  it('validates and hydrates a mock assignment workbook', () => {
    const workbook = buildWorkbook();
    const validation = validateAssignmentWorkbook(workbook);
    const session = loadAssignmentSession({
      workbook,
      studentEmail: 'student@example.com',
    });

    expect(validation.valid).toBe(true);
    expect(session.status).toBe('ready');
    expect(session.assignment.assignmentId).toBe('assignment-1');
    expect(session.assignment.itemCount).toBe(2);
    expect(session.student.email).toBe('student@example.com');
    expect(session.student.name).toBe('Student One');
    expect(session.items).toHaveLength(2);
    expect(session.currentItem.challenge.id).toBe('tt-01-literal-a');

    const submissionContext = buildAssignmentSubmissionContext(session);
    expect(submissionContext).toMatchObject({
      assignment: {
        assignmentId: 'assignment-1',
        title: 'Assignment One',
        sequence: 1,
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
    });
  });

  it('selects an assignment by explicit id or roster match', () => {
    const workbook = buildWorkbook();
    const explicitSession = loadAssignmentSession({
      workbook,
      assignmentId: 'assignment-1',
      studentEmail: 'another@example.com',
    });

    const rosterSession = loadAssignmentSession({
      workbook,
      studentEmail: 'student@example.com',
    });

    expect(explicitSession.assignment.assignmentId).toBe('assignment-1');
    expect(rosterSession.assignment.assignmentId).toBe('assignment-1');
  });

  it('fails safely when workbook rows are invalid', () => {
    const workbook = buildWorkbook();
    workbook.assignmentItems[0] = {
      assignmentItemId: '',
      assignmentId: 'assignment-1',
      sequence: 0,
      challengeMode: 'truth-table',
      challengeId: '',
      active: true,
    };

    const session = loadAssignmentSession({
      workbook,
      studentEmail: 'student@example.com',
    });

    expect(session.status).toBe('error');
    expect(session.errors[0]).toContain('assignmentItemId');
    expect(session.currentItem).toBeNull();
  });

  it('fails safely when a challenge id cannot be hydrated', () => {
    const workbook = buildWorkbook();
    workbook.assignmentItems[0] = {
      assignmentItemId: 'assignment-1-item-1',
      assignmentId: 'assignment-1',
      sequence: 1,
      challengeMode: 'truth-table',
      challengeId: 'missing-problem-id',
      active: true,
    };

    const session = loadAssignmentSession({
      workbook,
      studentEmail: 'student@example.com',
    });

    expect(session.status).toBe('error');
    expect(session.errors[0]).toContain('missing-problem-id');
    expect(session.currentItem).toBeNull();
  });
});

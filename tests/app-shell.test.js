import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import App from '@/App.vue';

function buildAssignmentWorkbook() {
  return {
    assignments: [
      {
        assignmentId: 'assignment-1',
        title: 'Assignment One',
        sequence: 1,
        active: true,
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

function buildVennAssignmentWorkbook() {
  return {
    assignments: [
      {
        assignmentId: 'assignment-2',
        title: 'Assignment Two',
        sequence: 1,
        active: true,
      },
    ],
    assignmentItems: [
      {
        assignmentItemId: 'assignment-2-item-1',
        assignmentId: 'assignment-2',
        sequence: 1,
        challengeMode: 'venn',
        challengeId: 'tt-09-three-variable-venn',
        active: true,
      },
    ],
    roster: [
      {
        studentEmail: 'student@example.com',
        studentName: 'Student One',
        className: 'Period 1',
        section: 'A',
        assignmentId: 'assignment-2',
        active: true,
      },
    ],
    submissions: [],
  };
}

describe('app shell', () => {
  beforeEach(() => {
    delete globalThis.__BOOLEAN_PRACTICE_ASSIGNMENT_CONTEXT__;
  });

  it('loads the truth-table practice panel and swaps compatible problems by filter', async () => {
    const wrapper = mount(App);

    await nextTick();

    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toBe('a');
    expect(wrapper.get('[data-testid="truth-table-practice"]').exists()).toBe(true);
    expect(wrapper.find('header.hero').exists()).toBe(false);
    expect(wrapper.get('[data-testid="problem-details"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="venn-label-toggle"]').element.checked).toBe(false);
    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'Work through a.',
    );
    expect(wrapper.get('[data-testid="numeric-variable-note"]').text()).toContain(
      'stands in for an unknown number',
    );

    await wrapper.get('select[name="difficulty"]').setValue('medium');
    await nextTick();
    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toBe('!a && b || c');
    expect(wrapper.get('[data-testid="truth-table-current-step"]').text()).toContain('1/3');

    await wrapper.get('select[name="mode"]').setValue('venn');
    await nextTick();
    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toBe('!(a || b)');
    expect(wrapper.find('[data-testid="truth-table-practice"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="venn-practice"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="venn-practice"] .venn-diagram__stage').exists()).toBe(true);
    expect(wrapper.find('.venn-diagram__region-label').exists()).toBe(false);

    await wrapper.get('[data-testid="venn-label-toggle"]').setValue(true);
    await nextTick();

    expect(wrapper.find('.venn-diagram__region-label').exists()).toBe(true);
  });

  it('loads the equivalence practice panel and swaps challenge sets by filter', async () => {
    const wrapper = mount(App);

    await nextTick();

    await wrapper.get('select[name="mode"]').setValue('equivalence');
    await nextTick();

    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toContain('≡');
    expect(wrapper.get('[data-testid="equivalence-practice"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="equivalence-feedback"]').text()).toContain(
      'Pick whether the pair is equivalent',
    );

    await wrapper.get('select[name="difficulty"]').setValue('hard');
    await nextTick();

    expect(wrapper.get('[data-testid="expression-card"] h3').text()).toBe('Distribution Pair');
    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toContain('≡');
  });

  it('loads the simplification practice panel and filters to simplification-ready prompts', async () => {
    const wrapper = mount(App);

    await nextTick();

    await wrapper.get('select[name="mode"]').setValue('simplification');
    await nextTick();

    expect(wrapper.get('[data-testid="simplification-practice"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toContain('&&');

    await wrapper.get('select[name="difficulty"]').setValue('medium');
    await nextTick();

    expect(wrapper.get('[data-testid="expression-card"] h3').text()).toBe(
      'Double Negation',
    );
  });

  it('loads the assignment practice panel when a Sheets workbook bootstrap is present', async () => {
    globalThis.__BOOLEAN_PRACTICE_ASSIGNMENT_CONTEXT__ = {
      workbook: buildAssignmentWorkbook(),
      assignmentId: 'assignment-1',
      student: {
        email: 'student@example.com',
      },
      request: {
        assignmentId: 'assignment-1',
      },
    };

    const wrapper = mount(App);

    await nextTick();

    expect(wrapper.get('[data-testid="assignment-practice"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="assignment-practice-heading"]').text()).toBe(
      'Assignment One',
    );
    expect(wrapper.get('[data-testid="assignment-practice"] .assignment-practice__item-card h3').text()).toBe(
      'Literal Practice: A',
    );
    expect(wrapper.get('[data-testid="assignment-practice"] .assignment-practice__details').exists()).toBe(
      true,
    );
    expect(wrapper.find('select[name="mode"]').exists()).toBe(false);
  });

  it('keeps detailed venn labels hidden by default but lets assignment mode toggle them on', async () => {
    globalThis.__BOOLEAN_PRACTICE_ASSIGNMENT_CONTEXT__ = {
      workbook: buildVennAssignmentWorkbook(),
      assignmentId: 'assignment-2',
      student: {
        email: 'student@example.com',
      },
      request: {
        assignmentId: 'assignment-2',
      },
    };

    const wrapper = mount(App);

    await nextTick();

    expect(wrapper.get('[data-testid="assignment-practice"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="assignment-venn-label-toggle"]').element.checked).toBe(false);
    expect(wrapper.find('.venn-diagram__region-label').exists()).toBe(false);

    await wrapper.get('[data-testid="assignment-venn-label-toggle"]').setValue(true);
    await nextTick();

    expect(wrapper.find('.venn-diagram__region-label').exists()).toBe(true);
  });
});

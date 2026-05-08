import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { generateTruthTable, getProblemById } from '@shared/index';
import TruthTablePractice from '@/components/TruthTablePractice.vue';

async function setCellButtonValue(button, targetText) {
  for (let attempts = 0; attempts < 3 && button.text() !== targetText; attempts += 1) {
    await button.trigger('click');
    await nextTick();
  }
}

describe('truth table practice', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('keeps fixed assignment cells read-only and supports keyboard toggles', async () => {
    const wrapper = mount(TruthTablePractice, {
      props: { problem: getProblemById('tt-05-precedence') },
    });

    await nextTick();

    expect(wrapper.find('.truth-table__fixed-cell button').exists()).toBe(false);

    const currentCell = wrapper.get('[data-testid="truth-cell-0.0.0-0"]');
    expect(currentCell.text()).toBe('—');

    await currentCell.trigger('keydown.enter');
    expect(currentCell.text()).toBe('T');
  });

  it('reports incorrect rows with guidance and reveals the next column when correct', async () => {
    const wrapper = mount(TruthTablePractice, {
      props: { problem: getProblemById('tt-05-precedence') },
    });

    await nextTick();

    const cells = wrapper.findAll('[data-testid^="truth-cell-0.0.0-"]');
    for (const cell of cells) {
      await cell.trigger('click');
      await cell.trigger('click');
    }

    await wrapper.get('[data-testid="truth-table-check-step"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'The row for !a does not match yet.',
    );
    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).not.toContain(
      'The NOT operator flips the operand.',
    );
    expect(wrapper.get('.truth-table-practice__review > ul').text()).not.toContain(
      'Correct for',
    );

    await wrapper.get('[data-testid="truth-table-check-step"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'The NOT operator flips the operand.',
    );

    await wrapper.get('[data-testid="truth-table-reset"]').trigger('click');
    await nextTick();

    const resetCells = wrapper.findAll('[data-testid^="truth-cell-0.0.0-"]');
    await resetCells[0].trigger('click');
    await resetCells[1].trigger('click');
    await resetCells[2].trigger('click');
    await resetCells[3].trigger('click');

    await resetCells[4].trigger('click');
    await resetCells[4].trigger('click');
    await resetCells[5].trigger('click');
    await resetCells[5].trigger('click');
    await resetCells[6].trigger('click');
    await resetCells[6].trigger('click');
    await resetCells[7].trigger('click');
    await resetCells[7].trigger('click');

    await wrapper.get('[data-testid="truth-table-check-step"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'Great work. !a is complete, so (!a && b) is now revealed.',
    );
    expect(wrapper.get('[data-testid="truth-table-current-step"]').text()).toContain('2/3');
    expect(wrapper.get('[data-testid="truth-cell-0.0-0"]').text()).toBe('—');
  });

  it('supports bulk fill, clear, and copy controls without checking the answer', async () => {
    const problem = getProblemById('tt-05-precedence');
    const truthTable = generateTruthTable(problem.ast);
    const firstStep = truthTable.subexpressions[0];
    const wrapper = mount(TruthTablePractice, {
      props: { problem },
    });

    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-copy-previous"]').attributes('disabled')).toBeDefined();

    await wrapper.get('[data-testid="truth-table-fill-true"]').trigger('click');
    await nextTick();

    const firstStepButtons = wrapper.findAll('[data-testid^="truth-cell-0.0.0-"]');
    expect(firstStepButtons.map((button) => button.text())).toEqual(
      Array.from({ length: truthTable.rows.length }, () => 'T'),
    );
    expect(wrapper.get('[data-testid="truth-table-current-step"]').text()).toContain('1/3');
    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'Filled !a with true answers.',
    );

    await wrapper.get('[data-testid="truth-table-clear-column"]').trigger('click');
    await nextTick();

    expect(firstStepButtons.map((button) => button.text())).toEqual(
      Array.from({ length: truthTable.rows.length }, () => '—'),
    );
    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'Cleared !a.',
    );

    await wrapper.get('[data-testid="truth-table-fill-false"]').trigger('click');
    await nextTick();

    expect(firstStepButtons.map((button) => button.text())).toEqual(
      Array.from({ length: truthTable.rows.length }, () => 'F'),
    );

    for (const [rowIndex, row] of truthTable.rows.entries()) {
      const targetText = row.values[firstStep.id] ? 'T' : 'F';
      await setCellButtonValue(firstStepButtons[rowIndex], targetText);
    }

    const firstStepTexts = firstStepButtons.map((button) => button.text());

    await wrapper.get('[data-testid="truth-table-check-step"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-current-step"]').text()).toContain('2/3');
    expect(wrapper.get('[data-testid="truth-table-copy-previous"]').attributes('disabled')).toBeUndefined();

    await wrapper.get('[data-testid="truth-table-copy-previous"]').trigger('click');
    await nextTick();

    const secondStepButtons = wrapper.findAll('[data-testid^="truth-cell-0.0-"]');
    expect(secondStepButtons.map((button) => button.text())).toEqual(
      firstStepTexts,
    );
    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'Copied !a into (!a && b).',
    );
  });

  it('supports literal-only truth tables without crashing the feedback path', async () => {
    const wrapper = mount(TruthTablePractice, {
      props: { problem: getProblemById('tt-01-literal-a') },
    });

    await nextTick();

    const cells = wrapper.findAll('[data-testid^="truth-cell-result-"]');
    await cells[0].trigger('click');
    await cells[0].trigger('click');
    await cells[1].trigger('click');
    await wrapper.get('[data-testid="truth-table-check-step"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'truth table is finished',
    );
    expect(wrapper.get('[data-testid="truth-table-review-summary"]').text()).toContain(
      'Problem Review',
    );
    expect(wrapper.get('[data-testid="truth-table-review-summary"]').text()).toContain(
      'You completed this truth table problem on the first try.',
    );
  });

  it('shows predicate atom aliases and the numeric predicate legend when present', async () => {
    const wrapper = mount(TruthTablePractice, {
      props: { problem: getProblemById('pa-25-score-and-count') },
    });

    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-predicate-legend"]').text()).toMatch(
      /P:\s+score > 10/,
    );
    expect(wrapper.get('[data-testid="truth-table-predicate-legend"]').text()).toMatch(
      /Q:\s+count == 0/,
    );
    const variableHeaders = wrapper.findAll('th.truth-table__variable-header');
    expect(variableHeaders.map((header) => header.text())).toEqual(['P', 'Q']);
    expect(variableHeaders[0].attributes('title')).toContain('score > 10');
    expect(variableHeaders[0].attributes('aria-label')).toContain('score > 10');
  });

  it('shows a review summary after correcting a mistaken truth-table step', async () => {
    const problem = getProblemById('tt-02-negation-a');
    const truthTable = generateTruthTable(problem.ast);
    const wrapper = mount(TruthTablePractice, {
      props: { problem },
    });

    await nextTick();

    const buttons = wrapper.findAll('.truth-table__cell-button');
    for (const button of buttons) {
      await setCellButtonValue(button, 'T');
    }

    await wrapper.get('[data-testid="truth-table-check-step"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'does not match yet',
    );

    for (const [rowIndex, row] of truthTable.rows.entries()) {
      const targetText = row.result ? 'T' : 'F';
      await setCellButtonValue(buttons[rowIndex], targetText);
    }

    await wrapper.get('[data-testid="truth-table-check-step"]').trigger('click');
    await nextTick();

    const summary = wrapper.get('[data-testid="truth-table-review-summary"]');
    expect(summary.text()).toContain('Problem Review');
    expect(summary.text()).toContain('Hints used: 1 hint used.');
    expect(summary.text()).toContain('Rows');
    expect(summary.text()).toContain('Next Practice');
  });

  it('remembers a solved truth-table step within the current session and can forget it manually', async () => {
    const truthTable = generateTruthTable(getProblemById('tt-01-literal-a').ast);
    const wrapper = mount(TruthTablePractice, {
      props: { problem: getProblemById('tt-01-literal-a') },
    });

    await nextTick();

    const solveTruthTable = async () => {
      const cells = wrapper.findAll('[data-testid^="truth-cell-result-"]');
      for (const [rowIndex, row] of truthTable.rows.entries()) {
        const targetText = row.result ? 'T' : 'F';
        await setCellButtonValue(cells[rowIndex], targetText);
      }
      await wrapper.get('[data-testid="truth-table-check-step"]').trigger('click');
      await nextTick();
    };

    await solveTruthTable();
    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'truth table is finished',
    );

    await wrapper.get('[data-testid="truth-table-reset"]').trigger('click');
    await nextTick();
    await solveTruthTable();

    await wrapper.get('[data-testid="truth-table-reset"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="truth-table-session-memory"]').text()).toContain(
      'solved 2 time(s)',
    );
    expect(wrapper.get('[data-testid="truth-cell-result-0"]').text()).toBe(
      truthTable.rows[0].result ? 'T' : 'F',
    );
    expect(wrapper.get('[data-testid="truth-cell-result-1"]').text()).toBe(
      truthTable.rows[1].result ? 'T' : 'F',
    );
    expect(wrapper.get('[data-testid="truth-table-restore-memory"]').exists()).toBe(true);

    await wrapper.get('[data-testid="truth-table-forget-memory"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-testid="truth-table-session-memory"]').exists()).toBe(false);

    await wrapper.get('[data-testid="truth-table-reset"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="truth-cell-result-0"]').text()).toBe('—');
    expect(wrapper.get('[data-testid="truth-cell-result-1"]').text()).toBe('—');
  });
});

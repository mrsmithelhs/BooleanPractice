import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { getProblemById } from '@shared/index';
import TruthTablePractice from '@/components/TruthTablePractice.vue';

describe('truth table practice', () => {
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
      'Row 1 needs another look for !a.',
    );
    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'Use a=F, b=F, c=F to decide !a.',
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
  });
});

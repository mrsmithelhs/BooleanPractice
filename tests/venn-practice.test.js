import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import {
  evaluateBooleanAst,
  generateTruthTable,
  generateVennRegions,
  getProblemById,
} from '@shared/index';
import VennPractice from '@/components/VennPractice.vue';

async function setRegionPressed(region, pressed) {
  for (let attempts = 0; attempts < 3 && region.attributes('aria-pressed') !== String(pressed); attempts += 1) {
    await region.trigger('click');
    await nextTick();
  }
}

describe('venn practice', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('supports keyboard toggles for accessible region selection', async () => {
    const wrapper = mount(VennPractice, {
      props: { problem: getProblemById('tt-09-three-variable-venn') },
    });

    await nextTick();

    expect(wrapper.get('[data-testid="venn-current-step"]').text()).toContain('1/2');
    expect(wrapper.findAll('[data-testid^="venn-region-"]')).toHaveLength(8);

    const region = wrapper.get('[data-testid="venn-region-0"]');
    expect(region.attributes('aria-pressed')).toBe('false');

    await region.trigger('keydown.enter');
    expect(region.attributes('aria-pressed')).toBe('true');

    await region.trigger('keydown.space');
    expect(region.attributes('aria-pressed')).toBe('false');
  });

  it('reports missed and extra regions and advances through the final step', async () => {
    const wrapper = mount(VennPractice, {
      props: { problem: getProblemById('tt-09-three-variable-venn') },
    });

    await nextTick();

    await wrapper.get('[data-testid="venn-region-0"]').trigger('click');
    await wrapper.get('[data-testid="venn-region-6"]').trigger('click');
    await wrapper.get('[data-testid="venn-check-selection"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain('does not match');
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).not.toContain('Missed regions:');

    await wrapper.get('[data-testid="venn-check-selection"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain(
      'The AND step keeps only the overlap of both operands.',
    );
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).not.toContain('Missed regions:');

    await wrapper.get('[data-testid="venn-check-selection"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain('Missed regions:');
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain('Extra regions:');

    await wrapper.get('[data-testid="venn-reset"]').trigger('click');
    await nextTick();

    await wrapper.get('[data-testid="venn-region-6"]').trigger('click');
    await wrapper.get('[data-testid="venn-region-7"]').trigger('click');
    await wrapper.get('[data-testid="venn-check-selection"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="venn-current-step"]').text()).toContain('2/2');
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain(
      'Great work. (a && b) is complete, so ((a && b) || c) is now revealed.',
    );
    expect(wrapper.text()).toContain('Left operand: (a && b)');
    expect(wrapper.text()).toContain('Right operand: c');
  });

  it('supports shade all, clear, and copy controls without checking the answer', async () => {
    const problem = getProblemById('tt-09-three-variable-venn');
    const truthTable = generateTruthTable(problem.ast);
    const firstStep = truthTable.subexpressions[0];
    const vennBlueprint = generateVennRegions(problem.ast);
    const expectedFirstStepRegionIds = vennBlueprint.regions
      .filter((region) => evaluateBooleanAst(firstStep.node, region.assignment))
      .map((region) => region.id);
    const wrapper = mount(VennPractice, {
      props: { problem },
    });

    await nextTick();

    expect(wrapper.get('[data-testid="venn-copy-previous"]').attributes('disabled')).toBeDefined();

    const regions = wrapper.findAll('[data-testid^="venn-region-"]');

    await wrapper.get('[data-testid="venn-shade-all"]').trigger('click');
    await nextTick();

    expect(regions.every((region) => region.attributes('aria-pressed') === 'true')).toBe(true);
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain(
      'Shaded all regions for',
    );

    await wrapper.get('[data-testid="venn-clear-selection"]').trigger('click');
    await nextTick();

    expect(regions.every((region) => region.attributes('aria-pressed') === 'false')).toBe(true);
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain(
      'Cleared (a && b).',
    );

    for (const region of regions) {
      const regionId = Number(region.attributes('data-testid').replace('venn-region-', ''));
      await setRegionPressed(region, expectedFirstStepRegionIds.includes(regionId));
    }

    await wrapper.get('[data-testid="venn-check-selection"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="venn-current-step"]').text()).toContain('2/2');
    expect(wrapper.get('[data-testid="venn-copy-previous"]').attributes('disabled')).toBeUndefined();

    await wrapper.get('[data-testid="venn-copy-previous"]').trigger('click');
    await nextTick();

    expect(
      wrapper
        .findAll('[data-testid^="venn-region-"]')
        .filter((region) => region.attributes('aria-pressed') === 'true')
        .map((region) => Number(region.attributes('data-testid').replace('venn-region-', ''))),
    ).toEqual(expectedFirstStepRegionIds);
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain(
      'Copied (a && b) into ((a && b) || c).',
    );
  });

  it('shows predicate atom aliases and the numeric predicate legend when present', async () => {
    const wrapper = mount(VennPractice, {
      props: { problem: getProblemById('pa-26-string-and-loop') },
    });

    await nextTick();

    expect(wrapper.get('[data-testid="venn-predicate-legend"]').text()).toMatch(
      /P:\s+score > 10/,
    );
    expect(wrapper.get('[data-testid="venn-predicate-legend"]').text()).toMatch(
      /Q:\s+index < limit/,
    );
    expect(wrapper.get('[data-testid="venn-region-0"]').attributes('aria-label')).toContain('p false');
  });

  it('shows a review summary after correcting a mistaken venn selection', async () => {
    const problem = getProblemById('tt-02-negation-a');
    const vennBlueprint = generateVennRegions(problem.ast);
    const expectedRegionIds = vennBlueprint.regions
      .filter((region) => evaluateBooleanAst(problem.ast, region.assignment))
      .map((region) => region.id);
    const wrapper = mount(VennPractice, {
      props: { problem },
    });

    await nextTick();

    const regions = wrapper.findAll('[data-testid^="venn-region-"]');
    for (const region of regions) {
      await setRegionPressed(region, true);
    }

    await wrapper.get('[data-testid="venn-check-selection"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain('does not match');

    for (const region of regions) {
      const regionId = Number(region.attributes('data-testid').replace('venn-region-', ''));
      await setRegionPressed(region, expectedRegionIds.includes(regionId));
    }

    await wrapper.get('[data-testid="venn-check-selection"]').trigger('click');
    await nextTick();

    const summary = wrapper.get('[data-testid="venn-review-summary"]');
    expect(summary.text()).toContain('Problem Review');
    expect(summary.text()).toContain('Hints used: 1 hint used.');
    expect(summary.text()).toContain('What To Review');
    expect(summary.text()).toContain('Next Practice');
  });

  it('remembers a solved venn selection within the current session and can forget it manually', async () => {
    const problem = getProblemById('tt-01-literal-a');
    const vennBlueprint = generateVennRegions(problem.ast);
    const expectedRegionIds = vennBlueprint.regions
      .filter((region) => evaluateBooleanAst(problem.ast, region.assignment))
      .map((region) => region.id);
    const wrapper = mount(VennPractice, {
      props: { problem },
    });

    await nextTick();

    const solveVennSelection = async () => {
      const regions = wrapper.findAll('[data-testid^="venn-region-"]');
      for (const region of regions) {
        const regionId = Number(region.attributes('data-testid').replace('venn-region-', ''));
        await setRegionPressed(region, expectedRegionIds.includes(regionId));
      }

      await wrapper.get('[data-testid="venn-check-selection"]').trigger('click');
      await nextTick();
    };

    await solveVennSelection();
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain(
      'Venn answer is finished',
    );

    await wrapper.get('[data-testid="venn-reset"]').trigger('click');
    await nextTick();
    await solveVennSelection();

    await wrapper.get('[data-testid="venn-reset"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="venn-session-memory"]').text()).toContain(
      'solved 2 time(s)',
    );
    expect(
      wrapper
        .findAll('[data-testid^="venn-region-"]')
        .filter((region) => region.attributes('aria-pressed') === 'true')
        .map((region) => Number(region.attributes('data-testid').replace('venn-region-', ''))),
    ).toEqual(expectedRegionIds);
    expect(wrapper.get('[data-testid="venn-restore-memory"]').exists()).toBe(true);

    await wrapper.get('[data-testid="venn-forget-memory"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-testid="venn-session-memory"]').exists()).toBe(false);

    await wrapper.get('[data-testid="venn-reset"]').trigger('click');
    await nextTick();

    expect(
      wrapper
        .findAll('[data-testid^="venn-region-"]')
        .filter((region) => region.attributes('aria-pressed') === 'true'),
    ).toHaveLength(0);
  });
});

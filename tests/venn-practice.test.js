import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { getProblemById } from '@shared/index';
import VennPractice from '@/components/VennPractice.vue';

describe('venn practice', () => {
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

    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain(
      'Missed regions: a=T, b=T, c=T.',
    );
    expect(wrapper.get('[data-testid="venn-feedback"]').text()).toContain(
      'Extra regions: a=F, b=F, c=F.',
    );

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
});

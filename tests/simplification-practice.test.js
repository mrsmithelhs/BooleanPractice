import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { getSimplificationChallengeById } from '@shared/index';
import SimplificationPractice from '@/components/SimplificationPractice.vue';

describe('simplification practice', () => {
  it('checks a valid simpler guess and supports proof mode switching', async () => {
    const wrapper = mount(SimplificationPractice, {
      props: { challenge: getSimplificationChallengeById('tt-12-identity-and-true') },
    });

    await nextTick();

    await wrapper.get('[data-testid="simplification-guess"]').setValue('a');
    await wrapper.get('[data-testid="simplification-check"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="simplification-feedback"]').text()).toContain(
      'Equivalent and simpler by this metric',
    );
    expect(wrapper.get('[data-testid="simplification-first-difference"]').text()).toContain(
      'No differing rows',
    );

    await wrapper.get('[data-testid="simplification-proof-venn"]').trigger('click');
    await nextTick();

    expect(wrapper.findAll('[data-testid^="simplification-proof-original-region-"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-testid^="simplification-proof-guess-region-"]')).toHaveLength(2);
  });

  it('reports parser feedback for invalid syntax and a counterexample for a wrong guess', async () => {
    const wrapper = mount(SimplificationPractice, {
      props: { challenge: getSimplificationChallengeById('tt-18-absorption-and') },
    });

    await nextTick();

    await wrapper.get('[data-testid="simplification-guess"]').setValue('a &&');
    await wrapper.get('[data-testid="simplification-check"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="simplification-feedback"]').text()).toContain(
      'I could not parse that guess',
    );

    await wrapper.get('[data-testid="simplification-guess"]').setValue('a || b');
    await wrapper.get('[data-testid="simplification-check"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="simplification-feedback"]').text()).toContain(
      'Not equivalent',
    );
    expect(wrapper.get('[data-testid="simplification-first-difference"]').text()).toContain(
      'Row',
    );
  });
});

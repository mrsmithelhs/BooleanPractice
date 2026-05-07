import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { getEquivalenceChallengeById } from '@shared/index';
import EquivalencePractice from '@/components/EquivalencePractice.vue';

describe('equivalence practice', () => {
  it('renders a truth-table proof and checks a correct equivalence answer', async () => {
    const wrapper = mount(EquivalencePractice, {
      props: { challenge: getEquivalenceChallengeById('eq-04-de-morgan') },
    });

    await nextTick();

    expect(wrapper.get('[data-testid="equivalence-practice"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid^="equivalence-proof-row-"]')).toHaveLength(4);
    expect(wrapper.get('[data-testid="equivalence-first-difference"]').text()).toContain('No differing');

    await wrapper.get('[data-testid="equivalence-choice-equivalent"]').trigger('click');
    await wrapper.get('[data-testid="equivalence-check"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="equivalence-feedback"]').text()).toContain(
      'Correct. The proof shows matching rows and regions on every assignment.',
    );
  });

  it('switches to venn proof mode and reports the first differing region for a near miss', async () => {
    const wrapper = mount(EquivalencePractice, {
      props: {
        challenge: getEquivalenceChallengeById('eq-07-near-miss-and-or'),
        showDetailedLabels: true,
      },
    });

    await nextTick();

    await wrapper.get('[data-testid="equivalence-proof-venn"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="equivalence-first-difference"]').text()).toContain('Region');
    expect(wrapper.findAll('[data-testid^="equivalence-proof-left-region-"]')).toHaveLength(4);
    expect(wrapper.findAll('[data-testid^="equivalence-proof-right-region-"]')).toHaveLength(4);
    expect(
      wrapper.get('[data-testid="equivalence-proof-left-region-0"]').element.tagName.toLowerCase(),
    ).toBe('rect');
    expect(wrapper.find('.venn-diagram__region-label').exists()).toBe(true);

    await wrapper.get('[data-testid="equivalence-choice-not-equivalent"]').trigger('click');
    await wrapper.get('[data-testid="equivalence-check"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="equivalence-feedback"]').text()).toContain(
      'Correct. The pair is not equivalent',
    );
  });
});

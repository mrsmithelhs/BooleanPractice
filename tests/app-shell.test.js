import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import App from '@/App.vue';

describe('app shell', () => {
  it('loads the truth-table practice panel and swaps compatible problems by filter', async () => {
    const wrapper = mount(App);

    await nextTick();

    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toBe('a');
    expect(wrapper.get('[data-testid="truth-table-practice"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="truth-table-feedback"]').text()).toContain(
      'Work through a.',
    );

    await wrapper.get('select[name="difficulty"]').setValue('medium');
    await nextTick();
    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toBe('!a && b || c');
    expect(wrapper.get('[data-testid="truth-table-current-step"]').text()).toContain('1/3');

    await wrapper.get('select[name="mode"]').setValue('venn');
    await nextTick();
    expect(wrapper.get('[data-testid="expression-card"] .expression').text()).toBe('!(a && b)');
    expect(wrapper.find('[data-testid="truth-table-practice"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="venn-practice"]').exists()).toBe(true);
  });
});

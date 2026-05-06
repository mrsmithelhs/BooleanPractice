<template>
  <article
    v-if="atoms.length > 0"
    class="mini-card predicate-atom-legend"
    :data-testid="testId"
  >
    <h3>{{ title }}</h3>
    <p class="predicate-atom-legend__lede">
      {{ lede }}
    </p>
    <ul class="predicate-atom-legend__list">
      <li
        v-for="atom in atoms"
        :key="atom.variable"
        class="predicate-atom-legend__item"
      >
        <strong class="predicate-atom-legend__alias">{{ atom.alias }}:</strong>
        {{ ' ' }}
        <span class="predicate-atom-legend__predicate">{{ atom.predicate }}</span>
        <span
          v-if="atom.description"
          class="predicate-atom-legend__description"
        >
          {{ atom.description }}
        </span>
      </li>
    </ul>
  </article>
</template>

<script setup>
defineProps({
  atoms: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: 'Predicate atoms',
  },
  lede: {
    type: String,
    default: 'Each alias stays visible so the numeric condition remains part of the working surface.',
  },
  testId: {
    type: String,
    default: 'predicate-atom-legend',
  },
});
</script>

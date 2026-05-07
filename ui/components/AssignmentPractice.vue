<template>
  <section
    class="assignment-practice"
    aria-labelledby="assignment-practice-heading"
    data-testid="assignment-practice"
  >
    <div class="assignment-practice__header">
      <div>
        <p class="assignment-practice__eyebrow">
          Sheets Assignment Mode
        </p>
        <h2
          id="assignment-practice-heading"
          data-testid="assignment-practice-heading"
        >
          {{ session.assignment.title }}
        </h2>
        <p class="assignment-practice__lede">
          {{ assignmentLede }}
        </p>
      </div>

      <div class="assignment-practice__meta">
        <span class="badge">Item {{ displayItemNumber }}</span>
        <span class="badge badge--subtle">{{ completedCount }}/{{ session.items.length }} complete</span>
      </div>
    </div>

    <div class="assignment-practice__summary-grid">
      <article class="mini-card">
        <h3>Current Item</h3>
        <p>{{ currentItem ? currentItem.challenge.title : 'Assignment complete' }}</p>
        <p class="assignment-practice__subtle">
          {{ currentItem ? currentItem.challenge.expression : 'All assigned challenges are finished.' }}
        </p>
      </article>

      <article class="mini-card">
        <h3>Progress</h3>
        <p>{{ completedCount }}/{{ session.items.length }} complete</p>
        <p class="assignment-practice__subtle">
          {{ assignmentLede }}
        </p>
      </article>
    </div>

    <details class="details-card assignment-practice__details">
      <summary class="details-card__summary">
        Queue and student info
      </summary>

      <article class="mini-card">
        <h3>Student</h3>
        <p>{{ studentLabel }}</p>
        <p
          v-if="session.student.className || session.student.section"
          class="assignment-practice__subtle"
        >
          {{ studentContextLabel }}
        </p>
      </article>

      <article class="mini-card">
        <h3>Assignment Queue</h3>
        <ul class="assignment-practice__queue">
          <li
            v-for="item in session.items"
            :key="item.assignmentItemId"
            :class="assignmentQueueItemClasses(item.assignmentItemId)"
          >
            <strong>{{ item.sequence }}.</strong>
            {{ item.challenge.title }}
            <span>{{ item.challengeMode }}</span>
          </li>
        </ul>
      </article>
    </details>

    <div
      v-if="currentItem"
      class="assignment-practice__workbench"
    >
      <article class="mini-card assignment-practice__item-card">
        <p class="assignment-practice__card-eyebrow">
          Assignment Item {{ currentItem.sequence }}
        </p>
        <h3>{{ currentItem.challenge.title }}</h3>
        <p class="assignment-practice__subtle">
          Mode: {{ currentItem.challengeMode }} · ID: {{ currentItem.challengeId }}
        </p>
        <p>
          {{ currentItem.challenge.expression }}
        </p>
      </article>

      <TruthTablePractice
        v-if="currentItem.challengeMode === 'truth-table'"
        :key="currentItem.assignmentItemId"
        :problem="currentItem.challenge"
        :assignment-context="currentAssignmentContext"
        @complete="handleItemComplete"
      />
      <VennPractice
        v-else-if="currentItem.challengeMode === 'venn'"
        :key="currentItem.assignmentItemId"
        :problem="currentItem.challenge"
        :assignment-context="currentAssignmentContext"
        @complete="handleItemComplete"
      />
      <EquivalencePractice
        v-else-if="currentItem.challengeMode === 'equivalence'"
        :key="currentItem.assignmentItemId"
        :challenge="currentItem.challenge"
        @complete="handleItemComplete"
      />
      <SimplificationPractice
        v-else-if="currentItem.challengeMode === 'simplification'"
        :key="currentItem.assignmentItemId"
        :challenge="currentItem.challenge"
        @complete="handleItemComplete"
      />

      <article
        v-else
        class="mini-card"
      >
        <h3>Unsupported Assignment Item</h3>
        <p>
          This assignment item uses a mode that the current app build does not recognize.
        </p>
      </article>

      <div
        v-if="currentItemComplete"
        class="assignment-practice__continue"
      >
        <p class="assignment-practice__complete-note">
          {{ completionMessage }}
        </p>
        <button
          type="button"
          class="action-button"
          data-testid="assignment-next"
          @click="advanceItem"
        >
          {{ nextButtonLabel }}
        </button>
      </div>
    </div>

    <div
      v-else
      class="mini-card assignment-practice__complete"
    >
      <h3>Assignment Complete</h3>
      <p>
        All assigned challenges have been completed. Students can review the summaries above and
        submit any recorded completions through the existing GAS bridge.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { buildAssignmentSubmissionContext } from '@shared/index';
import EquivalencePractice from './EquivalencePractice.vue';
import SimplificationPractice from './SimplificationPractice.vue';
import TruthTablePractice from './TruthTablePractice.vue';
import VennPractice from './VennPractice.vue';

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
});

const currentItemIndex = ref(0);
const currentItemComplete = ref(false);
const currentCompletion = ref(null);
const completedItemIds = ref([]);

const currentItem = computed(() => props.session.items[currentItemIndex.value] ?? null);
const completedCount = computed(() => completedItemIds.value.length);
const allItemsComplete = computed(() => completedCount.value >= props.session.items.length);
const displayItemNumber = computed(() => Math.min(currentItemIndex.value + 1, props.session.items.length));
const currentAssignmentContext = computed(() =>
  buildAssignmentSubmissionContext(
    {
      ...props.session,
      currentItem: currentItem.value,
    },
    currentItem.value,
  ),
);

const studentLabel = computed(() => {
  if (!props.session.student.email && !props.session.student.name) {
    return 'No roster match';
  }

  if (props.session.student.name && props.session.student.email) {
    return `${props.session.student.name} <${props.session.student.email}>`;
  }

  return props.session.student.name || props.session.student.email;
});

const studentContextLabel = computed(() => {
  const parts = [];

  if (props.session.student.className) {
    parts.push(props.session.student.className);
  }

  if (props.session.student.section) {
    parts.push(props.session.student.section);
  }

  return parts.join(' · ');
});

const assignmentLede = computed(() => {
  if (allItemsComplete.value) {
    return 'All assigned items are finished. The completion summaries stay available below.';
  }

  const modeLabel = currentItem.value?.challengeMode ?? 'assignment';
  return `Work through the queued items one by one. The current item uses ${modeLabel}, and the same shared checks remain in place.`;
});

const nextButtonLabel = computed(() =>
  currentItemIndex.value >= props.session.items.length - 1 ? 'Finish Assignment' : 'Next Challenge',
);

const completionMessage = computed(() => {
  if (!currentCompletion.value) {
    return 'This item is complete. Continue when you are ready.';
  }

  if (currentCompletion.value.message) {
    return currentCompletion.value.message;
  }

  if (currentCompletion.value.summary?.completionMessage) {
    return currentCompletion.value.summary.completionMessage;
  }

  if (currentCompletion.value.challenge?.title) {
    return `Completed ${currentCompletion.value.challenge.title}.`;
  }

  return 'This item is complete. Continue when you are ready.';
});

watch(
  () => props.session?.assignment?.assignmentId,
  () => {
    resetAssignment();
  },
  { immediate: true },
);

watch(
  () => props.session?.items?.length,
  () => {
    resetAssignment();
  },
);

function resetAssignment() {
  currentItemIndex.value = 0;
  currentItemComplete.value = false;
  currentCompletion.value = null;
  completedItemIds.value = [];
}

function handleItemComplete(completion) {
  currentItemComplete.value = true;
  currentCompletion.value = completion ?? null;

  if (currentItem.value && !completedItemIds.value.includes(currentItem.value.assignmentItemId)) {
    completedItemIds.value = [...completedItemIds.value, currentItem.value.assignmentItemId];
  }
}

function advanceItem() {
  if (currentItemIndex.value < props.session.items.length - 1) {
    currentItemIndex.value += 1;
    currentItemComplete.value = false;
    currentCompletion.value = null;
    return;
  }

  currentItemIndex.value = props.session.items.length;
  currentItemComplete.value = false;
  currentCompletion.value = null;
}

function assignmentQueueItemClasses(itemId) {
  return {
    'assignment-practice__queue-item--current': currentItem?.value?.assignmentItemId === itemId,
    'assignment-practice__queue-item--complete': completedItemIds.value.includes(itemId),
  };
}
</script>

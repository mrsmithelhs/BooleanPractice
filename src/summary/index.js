import { getProblemCatalog } from '../catalog/index.js';
import { buildCrossRepresentationComparison } from '../comparison/index.js';

const MODE_LABELS = {
  'truth-table': 'truth table',
  venn: 'Venn diagram',
};

const TOPIC_LABELS = {
  absorption: 'absorption',
  and: 'AND',
  constant: 'constant behavior',
  constants: 'constant behavior',
  'de-morgan': 'compound negation',
  distribution: 'distribution',
  'double-negation': 'double negation',
  domination: 'domination',
  equivalence: 'equivalence pattern',
  identity: 'identity',
  literals: 'literal warm-up',
  negation: 'negation',
  redundancy: 'redundancy',
  or: 'OR',
  parentheses: 'parentheses',
  precedence: 'operator precedence',
  'xor-like': 'exclusive-or pattern',
  'three-variable': 'three-variable reasoning',
  venn: 'Venn region reasoning',
};

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatCountLabel(count, singular) {
  return `${count} ${pluralize(count, singular)}`;
}

function deriveStepTopic(stepDefinition) {
  const node = stepDefinition?.node;

  if (!node) {
    return null;
  }

  if (node.type === 'UnaryExpression') {
    return 'negation';
  }

  if (node.type === 'BinaryExpression') {
    if (node.operator === '&&') {
      return 'and';
    }

    if (node.operator === '||') {
      return 'or';
    }
  }

  return null;
}

function getModeLabel(mode) {
  return MODE_LABELS[mode] ?? mode;
}

function getTopicLabel(topic) {
  return TOPIC_LABELS[topic] ?? topic;
}

function findStepDefinition(stepDefinitions, stepId) {
  return stepDefinitions.find((step) => step.id === stepId) ?? null;
}

function getMostChallengingReview(stepReviews) {
  return [...stepReviews].sort((left, right) => {
    if (right.failedChecks !== left.failedChecks) {
      return right.failedChecks - left.failedChecks;
    }

    if (right.attemptCount !== left.attemptCount) {
      return right.attemptCount - left.attemptCount;
    }

    return left.label.localeCompare(right.label);
  })[0] ?? null;
}

function buildReviewHighlights(stepReviews) {
  return stepReviews
    .map((review) => review.lastMistake?.summary)
    .filter(Boolean);
}

function buildStepSummary(review) {
  const attemptsLabel = formatCountLabel(review.attemptCount, 'attempt');
  const hintsLabel = `${review.failedChecks} ${pluralize(review.failedChecks, 'hint used', 'hints used')}`;
  const detail = review.completed
    ? review.lastMistake?.summary ?? 'Solved on the first try.'
    : review.lastMistake?.summary ?? 'Still in progress.';

  return {
    key: review.stepId,
    label: review.label,
    attemptSummary: `${attemptsLabel}, ${hintsLabel}.`,
    detail,
  };
}

function pickNextPracticeTarget({ problem, mode, stepDefinitions, stepReviews }) {
  const catalog = getProblemCatalog().filter(
    (entry) => entry.id !== problem.id && entry.supportedModes.includes(mode),
  );

  const mostChallengingReview = getMostChallengingReview(stepReviews);
  const stepDefinition = mostChallengingReview
    ? findStepDefinition(stepDefinitions, mostChallengingReview.stepId)
    : null;
  const stepTopic = mostChallengingReview?.failedChecks > 0 ? deriveStepTopic(stepDefinition) : null;
  const priorityTags = uniqueValues([
    stepTopic,
    ...problem.conceptTags,
    problem.variables.length === 3 ? 'three-variable' : null,
  ]);

  for (const tag of priorityTags) {
    const laterMatch = catalog.find(
      (entry) => entry.sequence > problem.sequence && entry.conceptTags.includes(tag),
    );

    if (laterMatch) {
      return {
        id: laterMatch.id,
        title: laterMatch.title,
        expression: laterMatch.expression,
        tag,
      };
    }

    const anyMatch = catalog.find((entry) => entry.conceptTags.includes(tag));
    if (anyMatch) {
      return {
        id: anyMatch.id,
        title: anyMatch.title,
        expression: anyMatch.expression,
        tag,
      };
    }
  }

  const fallback = catalog[0] ?? null;

  if (!fallback) {
    return null;
  }

  return {
    id: fallback.id,
    title: fallback.title,
    expression: fallback.expression,
    tag: null,
  };
}

export function buildProblemReviewSummary({
  problem,
  mode,
  stepDefinitions = [],
  stepReviews = [],
}) {
  const orderedStepReviews = stepDefinitions
    .map((stepDefinition) => stepReviews.find((review) => review.stepId === stepDefinition.id))
    .filter(Boolean);

  const totalAttempts = orderedStepReviews.reduce((sum, review) => sum + review.attemptCount, 0);
  const totalHintsUsed = orderedStepReviews.reduce((sum, review) => sum + review.failedChecks, 0);
  const reviewHighlights = buildReviewHighlights(orderedStepReviews);
  const nextPracticeTarget = pickNextPracticeTarget({
    problem,
    mode,
    stepDefinitions,
    stepReviews: orderedStepReviews,
  });
  const comparison = buildCrossRepresentationComparison(problem);
  const modeLabel = getModeLabel(mode);
  const primaryConcept = problem.conceptTags[0] ?? 'practice';
  const conceptLabel = getTopicLabel(primaryConcept);
  const completionMessage =
    totalHintsUsed === 0
      ? `You completed this ${modeLabel} problem on the first try.`
      : `You completed this ${modeLabel} problem after correcting ${formatCountLabel(
          totalHintsUsed,
          'mistake',
        )}.`;

  return {
    problemTitle: problem.title,
    modeLabel,
    completionMessage,
    finalCorrectText: 'Final correctness: correct',
    conceptTags: [...problem.conceptTags],
    conceptSummaryText: `Concepts practiced: ${problem.conceptTags.join(', ') || 'none'}.`,
    attemptsText: `Attempts: ${formatCountLabel(totalAttempts, 'check')}.`,
    hintsText: `Hints used: ${totalHintsUsed} ${pluralize(totalHintsUsed, 'hint used', 'hints used')}.`,
    totalAttempts,
    totalHintsUsed,
    stepSummaries: orderedStepReviews.map(buildStepSummary),
    reviewHighlights,
    comparison,
    nextPracticeText: nextPracticeTarget
      ? `Next practice: Try ${nextPracticeTarget.title}.`
      : 'Next practice: Try another problem from the catalog.',
    nextPracticeExpression: nextPracticeTarget?.expression ?? '',
    nextPracticeReason: nextPracticeTarget
      ? nextPracticeTarget.tag
        ? `This keeps practicing ${getTopicLabel(nextPracticeTarget.tag)}.`
        : `This keeps practicing ${conceptLabel}.`
      : 'This keeps the review moving without introducing a new grading system.',
    nextPracticeTarget,
  };
}

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import {
  evaluateBooleanAst,
  generateTruthTable,
  generateVennRegions,
  getEquivalenceChallenges,
  getProblemById,
  getSimplificationChallenges,
} from '../../src/index.js';

export const PROJECT_NAME = 'Boolean Practice';
export const CAPTURE_ROOT = 'local/ui-reviews';
export const REVIEW_SUBFOLDER = 'reviews';
export const DEFAULT_APP_TARGET = 'preview';

export const VIEWPORTS = {
  desktop: {
    id: 'desktop',
    label: 'Desktop/Laptop',
    width: 1440,
    height: 900,
  },
  mobile: {
    id: 'mobile',
    label: 'Mobile',
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
  },
  projector: {
    id: 'projector',
    label: 'Projector/Classroom',
    width: 1280,
    height: 720,
  },
};

export function buildCaptureRunId(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function createRunFolderName(date = new Date()) {
  return buildCaptureRunId(date);
}

export function normalizeTourSelection(requestedIds, tours) {
  const availableIds = new Set(tours.map((tour) => tour.id));

  if (!requestedIds || requestedIds.length === 0) {
    return tours;
  }

  const selected = requestedIds
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0 && availableIds.has(id));

  return selected.length > 0 ? tours.filter((tour) => selected.includes(tour.id)) : tours;
}

export function normalizeViewportSelection(requestedIds) {
  if (!requestedIds || requestedIds.length === 0) {
    return ['desktop', 'mobile'];
  }

  const allowed = Object.keys(VIEWPORTS);
  const selected = requestedIds
    .map((id) => String(id).trim())
    .filter((id) => allowed.includes(id));

  return selected.length > 0 ? selected : ['desktop', 'mobile'];
}

export function getProblem(problemId) {
  return getProblemById(problemId);
}

export function getEquivalenceChallenge(challengeId) {
  return getEquivalenceChallenges().find((challenge) => challenge.id === challengeId) ?? null;
}

export function getSimplificationChallenge(challengeId) {
  return getSimplificationChallenges().find((challenge) => challenge.id === challengeId) ?? null;
}

function truthTableStory(problem) {
  const truthTable = generateTruthTable(problem.ast ?? problem.expression);
  const steps =
    truthTable.subexpressions.length > 0
      ? truthTable.subexpressions
      : [
          {
            id: 'result',
            label: truthTable.expression,
            node: truthTable.ast,
          },
        ];

  return { truthTable, steps };
}

function vennStory(problem) {
  const truth = truthTableStory(problem);
  const vennBlueprint = generateVennRegions(problem.ast ?? problem.expression);

  return {
    ...truth,
    vennBlueprint,
  };
}

function expectedTruthTableValues(problem, stepIndex) {
  const { truthTable, steps } = truthTableStory(problem);
  const step = steps[stepIndex];

  if (!step) {
    throw new Error(`Truth-table step ${stepIndex + 1} is unavailable for "${problem.title}".`);
  }

  return {
    truthTable,
    step,
    answers: truthTable.rows.map((row) => evaluateBooleanAst(step.node, row.assignment)),
  };
}

function expectedVennRegionIds(problem, stepIndex) {
  const { truthTable, steps, vennBlueprint } = vennStory(problem);
  const step = steps[stepIndex];

  if (!step) {
    throw new Error(`Venn step ${stepIndex + 1} is unavailable for "${problem.title}".`);
  }

  return {
    truthTable,
    vennBlueprint,
    step,
    regionIds: vennBlueprint.regions
      .filter((region) => evaluateBooleanAst(step.node, region.assignment))
      .map((region) => region.id),
  };
}

function getExpressionText(problem) {
  return problem.expression ?? problem.leftExpression ?? problem.originalExpression ?? '';
}

async function waitForTextContent(locator, expectedSubstring, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastText = '';

  while (Date.now() < deadline) {
    lastText = await locator.textContent().catch(() => '');
    if (typeof lastText === 'string' && lastText.includes(expectedSubstring)) {
      return lastText;
    }

    await delay(100);
  }

  throw new Error(`Timed out waiting for "${expectedSubstring}" in text: ${lastText}`);
}

async function waitForDifferentText(locator, previousText, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastText = previousText;

  while (Date.now() < deadline) {
    lastText = await locator.textContent().catch(() => '');
    if (typeof lastText === 'string' && lastText.trim().length > 0 && lastText !== previousText) {
      return lastText;
    }

    await delay(100);
  }

  throw new Error(`Timed out waiting for text to change from "${previousText}".`);
}

async function selectMode(page, mode) {
  await page.locator('select[name="mode"]').selectOption(mode);
}

async function selectDifficulty(page, difficulty) {
  await page.locator('select[name="difficulty"]').selectOption(difficulty);
}

async function selectProblem(page, problemId) {
  await page.locator('select[name="problem"]').selectOption(problemId);
}

async function preparePracticeRecord(page, { mode, difficulty, recordId, recordExpression }) {
  await selectMode(page, mode);
  await selectDifficulty(page, difficulty);
  await selectProblem(page, recordId);

  await waitForTextContent(page.locator('[data-testid="expression-card"] .expression'), recordExpression);
}

async function setCellValue(page, testId, desiredValue) {
  const locator = page.getByTestId(testId);
  let currentText = (await locator.textContent().catch(() => ''))?.trim() ?? '';
  const desiredText = desiredValue === true ? 'T' : desiredValue === false ? 'F' : '—';
  const safetyLimit = 4;
  let attempts = 0;

  while (currentText !== desiredText && attempts < safetyLimit) {
    await locator.click();
    attempts += 1;
    currentText = (await locator.textContent().catch(() => ''))?.trim() ?? '';

    if (currentText === desiredText) {
      return;
    }
  }
}

async function setTruthTableAnswers(page, problem, stepIndex, { makeIncorrect = false } = {}) {
  const { step, answers } = expectedTruthTableValues(problem, stepIndex);
  const desiredAnswers = [...answers];

  if (makeIncorrect && desiredAnswers.length > 0) {
    desiredAnswers[0] = !desiredAnswers[0];
  }

  for (let rowIndex = 0; rowIndex < desiredAnswers.length; rowIndex += 1) {
    await setCellValue(page, `truth-cell-${step.id}-${rowIndex}`, desiredAnswers[rowIndex]);
  }

  return { step, answers: desiredAnswers };
}

async function checkTruthTable(page) {
  await page.getByTestId('truth-table-check-step').click();
}

async function solveTruthTableStep(page, problem, stepIndex, { makeIncorrect = false } = {}) {
  await setTruthTableAnswers(page, problem, stepIndex, { makeIncorrect });
  await checkTruthTable(page);

  const feedback = page.getByTestId('truth-table-feedback');
  await waitForDifferentText(feedback, 'Fill the current column, then check your work.');
}

async function completeTruthTableProblem(page, problem) {
  const { steps } = truthTableStory(problem);

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    await setTruthTableAnswers(page, problem, stepIndex, { makeIncorrect: false });
    await checkTruthTable(page);

    if (stepIndex < steps.length - 1) {
      await waitForTextContent(page.getByTestId('truth-table-current-step'), `${stepIndex + 2}/${steps.length}`);
    }
  }

  await waitForTextContent(page.getByTestId('truth-table-feedback'), 'truth table is finished');
}

async function setVennSelection(page, regionIds) {
  await page.getByTestId('venn-clear-selection').click();

  for (const regionId of regionIds) {
    await page.getByTestId(`venn-region-${regionId}`).click();
  }
}

function deriveIncorrectVennSelection(expectedRegionIds, regionCount) {
  const wrongSelection = expectedRegionIds.slice();

  if (wrongSelection.length > 0) {
    wrongSelection.pop();
  }

  const expectedSet = new Set(expectedRegionIds);
  const extraRegionId = Array.from({ length: regionCount }, (_, index) => index).find(
    (regionId) => !expectedSet.has(regionId),
  );

  if (typeof extraRegionId === 'number') {
    wrongSelection.push(extraRegionId);
  }

  if (wrongSelection.length === 0 && regionCount > 0) {
    wrongSelection.push(0);
  }

  return wrongSelection;
}

async function solveVennStep(page, problem, stepIndex, { makeIncorrect = false } = {}) {
  const { vennBlueprint, regionIds } = expectedVennRegionIds(problem, stepIndex);
  const selection = makeIncorrect
    ? deriveIncorrectVennSelection(regionIds, vennBlueprint.regions.length)
    : regionIds;

  await setVennSelection(page, selection);
  await page.getByTestId('venn-check-selection').click();
  await waitForDifferentText(page.getByTestId('venn-feedback'), 'Select the regions that make');
}

async function completeVennProblem(page, problem) {
  const { steps } = vennStory(problem);

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    const { regionIds } = expectedVennRegionIds(problem, stepIndex);
    await setVennSelection(page, regionIds);
    await page.getByTestId('venn-check-selection').click();

    if (stepIndex < steps.length - 1) {
      await waitForTextContent(page.getByTestId('venn-current-step'), `${stepIndex + 2}/${steps.length}`);
    }
  }

  await waitForTextContent(page.getByTestId('venn-feedback'), 'Venn answer is finished');
}

async function setEquivalenceDecision(page, value) {
  const locator =
    value === 'equivalent'
      ? page.getByTestId('equivalence-choice-equivalent')
      : page.getByTestId('equivalence-choice-not-equivalent');
  await locator.click();
}

async function loadEquivalenceChallenge(page, challenge, difficulty = challenge.difficulty) {
  await selectMode(page, 'equivalence');
  await selectDifficulty(page, difficulty);
  await selectProblem(page, challenge.id);
  await waitForTextContent(page.locator('[data-testid="equivalence-practice"]'), 'Equivalence Mode');
  await waitForTextContent(page.locator('[data-testid="equivalence-first-difference"]'), 'First difference:');
}

async function loadSimplificationChallenge(page, challenge, difficulty = challenge.difficulty) {
  await selectMode(page, 'simplification');
  await selectDifficulty(page, difficulty);
  await selectProblem(page, challenge.id);
  await waitForTextContent(page.locator('[data-testid="simplification-practice"]'), 'Simplification Mode');
}

export async function prepareSubmissionSimulator(page, { delayMs = 0, shouldFail = false, failureMessage = 'Simulated google.script.run failure.', rowNumber = 7 } = {}) {
  await page.addInitScript(
    ({ delayMs: delayValue, shouldFail: failValue, failureMessage: failureText, rowNumber: rowValue }) => {
      const run = {
        withSuccessHandler(handler) {
          run._success = handler;
          return run;
        },
        withFailureHandler(handler) {
          run._failure = handler;
          return run;
        },
        recordSubmission(payload) {
          setTimeout(() => {
            if (failValue) {
              if (typeof run._failure === 'function') {
                run._failure(new Error(failureText));
              }
              return;
            }

            if (typeof run._success === 'function') {
              run._success({ ok: true, rowNumber: rowValue, payload });
            }
          }, delayValue);
          return run;
        },
      };

      globalThis.__BOOLEAN_PRACTICE_GOOGLE_SCRIPT_RUN__ = run;
      globalThis.google = { script: { run } };
      globalThis.__BOOLEAN_PRACTICE_BUILD_TARGET__ = 'gas';
    },
    {
      delayMs,
      shouldFail,
      failureMessage,
      rowNumber,
    },
  );
}

export function getUiTourDefinitions() {
  const truthTableProblem = getProblem('tt-09-three-variable-venn');
  const predicateAtomProblem = getProblem('pa-27-three-atom-guard');
  const truthTableSubmissionProblem = getProblem('tt-12-identity-and-true');
  const vennProblem = truthTableProblem;
  const equivalenceChallenge = getEquivalenceChallenge('eq-07-near-miss-and-or');
  const simplificationChallenge = getSimplificationChallenge('tt-12-identity-and-true');

  if (!equivalenceChallenge) {
    throw new Error('Equivalence challenge eq-07-near-miss-and-or is missing.');
  }

  if (!simplificationChallenge) {
    throw new Error('Simplification challenge tt-12-identity-and-true is missing.');
  }

  return [
    {
      id: 'truth-table',
      title: 'Truth Table Practice',
      description: 'A three-variable truth-table story that shows incorrect feedback and completion.',
      target: DEFAULT_APP_TARGET,
      defaultViewports: ['desktop', 'mobile', 'projector'],
      record: truthTableProblem,
      shots: [
        {
          id: 'default-load',
          description: 'Initial truth-table landing state before any changes.',
          run: async ({ page }) => {
            await waitForTextContent(page.getByTestId('truth-table-practice'), 'Truth Table Practice');
          },
        },
        {
          id: 'problem-loaded',
          description: 'The harder three-variable truth-table problem has been selected.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
          },
        },
        {
          id: 'incorrect-step',
          description: 'The first column check is wrong and the feedback explains what needs another look.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await solveTruthTableStep(page, problem, 0, { makeIncorrect: true });
          },
        },
        {
          id: 'progressed-step',
          description: 'The first step is corrected and the next column is now revealed.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await setTruthTableAnswers(page, problem, 0, { makeIncorrect: false });
            await checkTruthTable(page);
            await waitForTextContent(page.getByTestId('truth-table-current-step'), '2/');
          },
        },
        {
          id: 'completed',
          description: 'The full truth table is finished and the review summary is visible.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await completeTruthTableProblem(page, problem);
            await waitForTextContent(page.getByTestId('truth-table-review-summary'), 'Problem Review');
          },
        },
      ],
    },
    {
      id: 'venn',
      title: 'Venn Practice',
      description: 'The matching three-variable Venn story, including a wrong check and a completed summary.',
      target: DEFAULT_APP_TARGET,
      defaultViewports: ['desktop', 'mobile', 'projector'],
      record: vennProblem,
      shots: [
        {
          id: 'default-load',
          description: 'Initial Venn landing state before any changes.',
          run: async ({ page }) => {
            await waitForTextContent(page.getByTestId('truth-table-practice'), 'Truth Table Practice');
          },
        },
        {
          id: 'problem-loaded',
          description: 'The same problem is now shown in Venn mode.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'venn',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
          },
        },
        {
          id: 'incorrect-step',
          description: 'The first region selection is wrong and the feedback names the mismatch.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'venn',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await solveVennStep(page, problem, 0, { makeIncorrect: true });
          },
        },
        {
          id: 'progressed-step',
          description: 'The first step is corrected and the next region set is now active.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'venn',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await setVennSelection(page, expectedVennRegionIds(problem, 0).regionIds);
            await page.getByTestId('venn-check-selection').click();
            await waitForTextContent(page.getByTestId('venn-current-step'), '2/');
          },
        },
        {
          id: 'completed',
          description: 'The full Venn answer is finished and the review summary is visible.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'venn',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await completeVennProblem(page, problem);
            await waitForTextContent(page.getByTestId('venn-review-summary'), 'Problem Review');
          },
        },
      ],
    },
    {
      id: 'equivalence',
      title: 'Expression Equivalence',
      description: 'A near-miss pair that shows proof output in truth-table and Venn form.',
      target: DEFAULT_APP_TARGET,
      defaultViewports: ['desktop'],
      record: equivalenceChallenge,
      shots: [
        {
          id: 'proof-table',
          description: 'The proof table is visible with the first mismatch called out.',
          run: async ({ page, challenge }) => {
            await loadEquivalenceChallenge(page, challenge, 'hard');
          },
        },
        {
          id: 'incorrect-answer',
          description: 'The student guesses equivalent and receives a mismatch message.',
          run: async ({ page, challenge }) => {
            await loadEquivalenceChallenge(page, challenge, 'hard');
            await setEquivalenceDecision(page, 'equivalent');
            await page.getByTestId('equivalence-check').click();
            await waitForTextContent(page.getByTestId('equivalence-feedback'), 'Not quite');
          },
        },
        {
          id: 'correct-answer',
          description: 'The student corrects the answer to not equivalent and gets the confirming feedback.',
          run: async ({ page, challenge }) => {
            await loadEquivalenceChallenge(page, challenge, 'hard');
            await setEquivalenceDecision(page, 'not-equivalent');
            await page.getByTestId('equivalence-check').click();
            await waitForTextContent(page.getByTestId('equivalence-feedback'), 'Correct');
          },
        },
        {
          id: 'venn-proof',
          description: 'The same proof is now shown as a Venn-region comparison.',
          run: async ({ page, challenge }) => {
            await loadEquivalenceChallenge(page, challenge, 'hard');
            await page.getByTestId('equivalence-proof-venn').click();
            await waitForTextContent(page.getByTestId('equivalence-first-difference'), 'First difference:');
          },
        },
      ],
    },
    {
      id: 'simplification',
      title: 'Simplification Guess Mode',
      description: 'A student guess is checked for equivalence and node-count simplicity.',
      target: DEFAULT_APP_TARGET,
      defaultViewports: ['desktop'],
      record: simplificationChallenge,
      shots: [
        {
          id: 'guess-ready',
          description: 'The simplification challenge is ready with a blank guess box.',
          run: async ({ page, challenge }) => {
            await loadSimplificationChallenge(page, challenge, 'easy');
          },
        },
        {
          id: 'wrong-guess',
          description: 'A longer non-equivalent guess triggers counterexample feedback.',
          run: async ({ page, challenge }) => {
            await loadSimplificationChallenge(page, challenge, 'easy');
            await page.getByTestId('simplification-guess').fill('a && b');
            await page.getByTestId('simplification-check').click();
            await waitForTextContent(page.getByTestId('simplification-feedback'), 'Not equivalent');
          },
        },
        {
          id: 'correct-guess',
          description: 'A shorter equivalent guess is confirmed as simpler by the chosen metric.',
          run: async ({ page, challenge }) => {
            await loadSimplificationChallenge(page, challenge, 'easy');
            await page.getByTestId('simplification-guess').fill('a');
            await page.getByTestId('simplification-check').click();
            await waitForTextContent(
              page.getByTestId('simplification-feedback'),
              'Equivalent and simpler',
            );
          },
        },
        {
          id: 'venn-proof',
          description: 'The proof view switches to Venn regions for the simplification comparison.',
          run: async ({ page, challenge }) => {
            await loadSimplificationChallenge(page, challenge, 'easy');
            await page.getByTestId('simplification-guess').fill('a');
            await page.getByTestId('simplification-check').click();
            await page.getByTestId('simplification-proof-venn').click();
            await waitForTextContent(page.getByTestId('simplification-first-difference'), 'First difference:');
          },
        },
      ],
    },
    {
      id: 'predicate-atoms',
      title: 'Predicate Atom Practice',
      description: 'The table shows the numeric predicate legend alongside a three-atom problem.',
      target: DEFAULT_APP_TARGET,
      defaultViewports: ['desktop'],
      record: predicateAtomProblem,
      shots: [
        {
          id: 'legend-ready',
          description: 'Predicate aliases, full predicate text, and the numeric-variable note are visible.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await waitForTextContent(page.getByTestId('truth-table-predicate-legend'), 'Predicate atoms');
            await waitForTextContent(page.getByTestId('numeric-variable-note'), 'Numeric Variables');
          },
        },
        {
          id: 'incorrect-step',
          description: 'The first check is wrong and the hint ladder explains what to revisit.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await solveTruthTableStep(page, problem, 0, { makeIncorrect: true });
          },
        },
        {
          id: 'completed',
          description: 'The predicate-atom problem is completed and the review summary is visible.',
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'hard',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await completeTruthTableProblem(page, problem);
            await waitForTextContent(page.getByTestId('truth-table-review-summary'), 'Problem Review');
          },
        },
      ],
    },
    {
      id: 'gas-submission',
      title: 'GAS Submission Flow',
      description: 'A completed problem shows a submission card, then a simulated success and failure path.',
      target: DEFAULT_APP_TARGET,
      defaultViewports: ['desktop'],
      record: truthTableSubmissionProblem,
      shots: [
        {
          id: 'ready-to-submit',
          description: 'The completion summary is ready to submit through the simulated GAS bridge.',
          prepare: async (page) => {
            await prepareSubmissionSimulator(page, { delayMs: 25, shouldFail: false, rowNumber: 12 });
          },
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'easy',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await completeTruthTableProblem(page, problem);
            await waitForTextContent(page.getByTestId('submission-output'), 'Ready to send this completion');
          },
        },
        {
          id: 'submitted-successfully',
          description: 'The simulated GAS bridge responds with a successful submission.',
          prepare: async (page) => {
            await prepareSubmissionSimulator(page, { delayMs: 25, shouldFail: false, rowNumber: 12 });
          },
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'easy',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await completeTruthTableProblem(page, problem);
            await page.getByTestId('submission-submit').click();
            await waitForTextContent(page.getByTestId('submission-output'), 'Submission sent');
          },
        },
        {
          id: 'submission-failure',
          description: 'The same submission card shows the simulated error state.',
          prepare: async (page) => {
            await prepareSubmissionSimulator(page, {
              delayMs: 25,
              shouldFail: true,
              failureMessage: 'Submission failed: No submission sheet configured.',
              rowNumber: 12,
            });
          },
          run: async ({ page, problem }) => {
            await preparePracticeRecord(page, {
              mode: 'truth-table',
              difficulty: 'easy',
              recordId: problem.id,
              recordExpression: getExpressionText(problem),
            });
            await completeTruthTableProblem(page, problem);
            await page.getByTestId('submission-submit').click();
            await waitForTextContent(page.getByTestId('submission-output'), 'No submission sheet configured');
          },
        },
      ],
    },
  ];
}

export async function writeTextFile(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf-8');
}

export async function writeJsonFile(path, contents) {
  await writeTextFile(path, `${JSON.stringify(contents, null, 2)}\n`);
}

export function buildManifest({
  projectName = PROJECT_NAME,
  captureDateTime,
  appVersion = '',
  commitSha = '',
  captureCommand = '',
  appTarget = DEFAULT_APP_TARGET,
  appUrl = '',
  outputFolder = '',
  viewports = [],
  tours = [],
  screenshots = [],
} = {}) {
  return {
    projectName,
    captureDateTime,
    appVersion,
    commitSha,
    captureCommand,
    appTarget,
    appUrl,
    outputFolder,
    viewports,
    tours,
    screenshots,
  };
}

export function buildTourMarkdown(manifest) {
  const lines = [];
  lines.push(`# ${manifest.projectName} UI Tour Capture`);
  lines.push('');
  lines.push(
    'Boolean Practice helps students practice boolean expressions through truth tables, Venn diagrams, equivalence proofs, simplification guesses, and related AP CSA reasoning patterns.',
  );
  lines.push('');
  lines.push(`Capture time: ${manifest.captureDateTime}`);
  lines.push(`App target: ${manifest.appTarget}`);
  if (manifest.appUrl) {
    lines.push(`App URL: ${manifest.appUrl}`);
  }
  if (manifest.outputFolder) {
    lines.push(`Output folder: ${manifest.outputFolder}`);
  }
  if (manifest.commitSha) {
    lines.push(`Commit: ${manifest.commitSha}`);
  }
  lines.push('');
  lines.push('Inspect the screenshots in order. The screenshots are grouped by tour and viewport.');
  lines.push('');

  for (const tour of manifest.tours) {
    lines.push(`## ${tour.title}`);
    lines.push('');
    if (tour.description) {
      lines.push(tour.description);
      lines.push('');
    }

    for (const viewport of tour.viewports) {
      lines.push(`### ${viewport.label}`);
      lines.push('');
      const tourShots = manifest.screenshots.filter(
        (shot) => shot.tourId === tour.id && shot.viewportId === viewport.id,
      );

      for (const shot of tourShots) {
        lines.push(
          `- ${shot.id}. \`${shot.filename}\` - ${shot.description} (${shot.interactionState})`,
        );
      }

      lines.push('');
    }
  }

  lines.push('## Blind Review');
  lines.push('');
  lines.push('Create a unique subfolder under `reviews/` and keep it code-blind.');
  lines.push('');

  return lines.join('\n');
}

export function buildReviewStartingPrompt(manifest) {
  return [
    '# Blind Review Starting Prompt',
    '',
    'You are a fresh UI consultant reviewing only the screenshots and tour metadata in this folder.',
    'Do not inspect the codebase, project docs outside this folder, tests, package files, or git history.',
    'Read `tour.md` first, inspect the screenshots in order, ignore review subfolders created by other agents, and create a unique subfolder under `reviews/`.',
    'Write per-screenshot notes before writing any summary, and re-read those notes before drawing final patterns or recommendations.',
    '',
    `Project: ${manifest.projectName}`,
    `Capture time: ${manifest.captureDateTime}`,
    `App target: ${manifest.appTarget}`,
    '',
    'Focus on confusing UI, missing affordances, visual hierarchy, responsiveness, accessibility, transitions, and whether the interface tells the story clearly.',
    'Distinguish "I cannot tell" from "this is wrong."',
  ].join('\n');
}

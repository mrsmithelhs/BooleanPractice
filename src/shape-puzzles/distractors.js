import { parseBooleanExpression } from '../parser/index.js';
import { evaluateBooleanAst } from '../evaluator/index.js';
import { formatExpressionSymbols, formatExpressionWords } from '../notation/index.js';

function cloneAst(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(cloneAst);
  const copy = {};
  for (const [key, value] of Object.entries(node)) {
    copy[key] = cloneAst(value);
  }
  return copy;
}

function mutateAst(node, targetPath, replacer) {
  function walk(current, path) {
    if (path === targetPath) {
      return replacer(current);
    }
    if (current.type === 'UnaryExpression') {
      return {
        ...current,
        argument: walk(current.argument, `${path}.arg`),
      };
    }
    if (current.type === 'BinaryExpression') {
      return {
        ...current,
        left: walk(current.left, `${path}.left`),
        right: walk(current.right, `${path}.right`),
      };
    }
    return current;
  }
  return walk(node, 'root');
}

function swapVarsInAst(node, var1, var2) {
  if (!node) return node;
  if (node.type === 'Identifier') {
    const nameUpper = node.name.toUpperCase();
    if (nameUpper === var1) {
      return { ...node, name: var2.toLowerCase() };
    }
    if (nameUpper === var2) {
      return { ...node, name: var1.toLowerCase() };
    }
    return node;
  }
  if (node.type === 'UnaryExpression') {
    return { ...node, argument: swapVarsInAst(node.argument, var1, var2) };
  }
  if (node.type === 'BinaryExpression') {
    return {
      ...node,
      left: swapVarsInAst(node.left, var1, var2),
      right: swapVarsInAst(node.right, var1, var2),
    };
  }
  return node;
}

export function generateAstMutations(rootAst, variables) {
  const mutations = [];

  function collectNodes(node, path) {
    if (!node) return;

    if (node.type === 'UnaryExpression' && node.operator === '!') {
      // 1. Drop each NOT
      mutations.push({
        type: 'drop-not',
        ast: mutateAst(rootAst, path, (n) => cloneAst(n.argument)),
      });
    }

    if (node.type === 'Identifier') {
      // 2. Add NOT to each variable
      mutations.push({
        type: 'add-not-to-variable',
        ast: mutateAst(rootAst, path, (n) => ({
          type: 'UnaryExpression',
          operator: '!',
          argument: cloneAst(n),
        })),
      });
    }

    if (node.type === 'BinaryExpression') {
      // 3. Swap AND <-> OR
      const swappedOp = node.operator === '&&' ? '||' : '&&';
      mutations.push({
        type: 'swap-and-or',
        ast: mutateAst(rootAst, path, (n) => ({
          ...cloneAst(n),
          operator: swappedOp,
        })),
      });

      // 4. Replace with left operand, and separately right operand
      mutations.push({
        type: 'replace-with-left',
        ast: mutateAst(rootAst, path, (n) => cloneAst(n.left)),
      });
      mutations.push({
        type: 'replace-with-right',
        ast: mutateAst(rootAst, path, (n) => cloneAst(n.right)),
      });
    }

    if (node.type === 'UnaryExpression') {
      collectNodes(node.argument, `${path}.arg`);
    } else if (node.type === 'BinaryExpression') {
      collectNodes(node.left, `${path}.left`);
      collectNodes(node.right, `${path}.right`);
    }
  }

  collectNodes(rootAst, 'root');

  // 5. Swap variable names pairwise
  const upperVars = variables.map((v) => v.toUpperCase());
  for (let i = 0; i < upperVars.length; i += 1) {
    for (let j = i + 1; j < upperVars.length; j += 1) {
      const var1 = upperVars[i];
      const var2 = upperVars[j];

      mutations.push({
        type: `swap-vars-${var1}-${var2}`,
        ast: swapVarsInAst(cloneAst(rootAst), var1, var2),
      });
    }
  }

  return mutations;
}

export function generateDistractors({ expression, variables, regions }) {
  const rootAst = typeof expression === 'string' ? parseBooleanExpression(expression) : expression;

  // Correct expression truth values across regions
  const correctRowMask = regions.map((region) =>
    evaluateBooleanAst(rootAst, region.assignment)
  );
  const correctMaskKey = correctRowMask.map((b) => (b ? '1' : '0')).join('');

  const mutations = generateAstMutations(rootAst, variables);
  const seenMasks = new Set([correctMaskKey]);
  const distractors = [];

  for (const mutation of mutations) {
    const mutantMask = regions.map((region) =>
      evaluateBooleanAst(mutation.ast, region.assignment)
    );
    const maskKey = mutantMask.map((b) => (b ? '1' : '0')).join('');

    if (seenMasks.has(maskKey)) {
      continue;
    }
    seenMasks.add(maskKey);

    // Compute IoU with correct picture
    let sharedArea = 0;
    let combinedArea = 0;
    let mutantArea = 0;

    for (let i = 0; i < regions.length; i += 1) {
      const isCorrect = correctRowMask[i];
      const isMutant = mutantMask[i];
      const regionArea = regions[i].totalAreaMm2;

      if (isMutant) {
        mutantArea += regionArea;
      }
      if (isCorrect && isMutant) {
        sharedArea += regionArea;
      }
      if (isCorrect || isMutant) {
        combinedArea += regionArea;
      }
    }

    const iou = combinedArea > 0 ? sharedArea / combinedArea : 0;

    // Check if distractor picture is a single complete shape
    let singleCompleteShape = null;
    for (const v of variables) {
      const isSingleShape = regions.every((region, idx) => {
        const vVal = region.assignment[v];
        return mutantMask[idx] === vVal;
      });
      if (isSingleShape) {
        singleCompleteShape = v;
        break;
      }
    }

    const flags = [];
    if (iou >= 0.75) {
      flags.push('high-overlap (IoU >= 0.75)');
    }
    if (singleCompleteShape) {
      flags.push(`single complete shape: ${singleCompleteShape}`);
    }

    distractors.push({
      type: mutation.type,
      ast: mutation.ast,
      expressionWords: formatExpressionWords(mutation.ast),
      expressionSymbols: formatExpressionSymbols(mutation.ast),
      trueRows: mutantMask.map((b, idx) => (b ? idx : null)).filter((x) => x !== null),
      rowMask: mutantMask,
      areaMm2: mutantArea,
      sharedAreaMm2: sharedArea,
      combinedAreaMm2: combinedArea,
      iou,
      singleCompleteShape,
      flags,
    });
  }

  return {
    correctExpressionWords: formatExpressionWords(rootAst),
    correctExpressionSymbols: formatExpressionSymbols(rootAst),
    correctTrueRows: correctRowMask.map((b, idx) => (b ? idx : null)).filter((x) => x !== null),
    distractors,
  };
}

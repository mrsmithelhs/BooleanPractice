import { parseBooleanExpression } from '../../parser/index.js';
import { formatExpressionSymbols, formatExpressionWords } from '../../notation/index.js';
import {
  findLabelBoxPosition,
  findObstacleFreeBadgePoint,
  findOutlineAnchorPoint,
  geometryToPathData,
} from '../geometry.js';

export const SHAPE_STYLES = {
  A: {
    strokeWidth: '0.7',
    dashArray: 'none',
    stroke: '#111',
    targetAngle: Math.PI * 0.85, // top-left
  },
  B: {
    strokeWidth: '0.7',
    dashArray: '5 2.5',
    stroke: '#111',
    targetAngle: Math.PI * 0.15, // top-right
  },
  C: {
    strokeWidth: '0.7',
    dashArray: '5 2 2 2',
    stroke: '#111',
    targetAngle: -Math.PI * 0.5, // bottom
  },
};

export function evaluateAstWithTrace(node, assignment, convention = 'TF') {
  const trueSym = convention === '10' ? '1' : 'T';
  const falseSym = convention === '10' ? '0' : 'F';

  switch (node.type) {
    case 'Literal':
      return { val: node.value, str: node.value ? trueSym : falseSym };
    case 'Identifier': {
      const v = assignment[node.name.toLowerCase()] ?? assignment[node.name.toUpperCase()];
      return { val: v, str: v ? trueSym : falseSym };
    }
    case 'UnaryExpression': {
      const arg = evaluateAstWithTrace(node.argument, assignment, convention);
      const res = !arg.val;
      return {
        val: res,
        sub: `NOT(${arg.str})`,
        str: res ? trueSym : falseSym,
      };
    }
    case 'BinaryExpression': {
      const left = evaluateAstWithTrace(node.left, assignment, convention);
      const right = evaluateAstWithTrace(node.right, assignment, convention);
      const opWord = node.operator === '&&' ? 'AND' : 'OR';
      const res = node.operator === '&&' ? left.val && right.val : left.val || right.val;
      return {
        val: res,
        leftStr: left.str,
        rightStr: right.str,
        opWord,
        sub: `${left.str} ${opWord} ${right.str}`,
        str: res ? trueSym : falseSym,
      };
    }
    default:
      return { val: false, str: falseSym };
  }
}

export function generateRowWorkedStep(ast, assignment, variables, convention = 'TF') {
  const trueSym = convention === '10' ? '1' : 'T';
  const falseSym = convention === '10' ? '0' : 'F';

  const assignStr = variables
    .map((v) => `${v}=${assignment[v] ? trueSym : falseSym}`)
    .join(', ');

  // Substitution string: variables -> T/F (or 1/0), parenthesized per R5
  function substitute(node) {
    switch (node.type) {
      case 'Literal':
        return node.value ? trueSym : falseSym;
      case 'Identifier':
        return assignment[node.name.toLowerCase()] ?? assignment[node.name.toUpperCase()] ? trueSym : falseSym;
      case 'UnaryExpression': {
        const inner = substitute(node.argument);
        return `NOT(${inner})`;
      }
      case 'BinaryExpression': {
        const op = node.operator === '&&' ? 'AND' : 'OR';
        let leftStr = substitute(node.left);
        if (node.left.type === 'BinaryExpression' && node.left.operator !== node.operator) {
          leftStr = `(${leftStr})`;
        }
        let rightStr = substitute(node.right);
        if (node.right.type === 'BinaryExpression') {
          rightStr = `(${rightStr})`;
        }
        return `${leftStr} ${op} ${rightStr}`;
      }
      default:
        return '';
    }
  }

  // Simplified string: evaluate NOTs
  function simplifyNots(node) {
    switch (node.type) {
      case 'Literal':
        return node.value ? trueSym : falseSym;
      case 'Identifier':
        return assignment[node.name.toLowerCase()] ?? assignment[node.name.toUpperCase()] ? trueSym : falseSym;
      case 'UnaryExpression': {
        const evaluated = evaluateAstWithTrace(node.argument, assignment, convention);
        return evaluated.val ? falseSym : trueSym;
      }
      case 'BinaryExpression': {
        const op = node.operator === '&&' ? 'AND' : 'OR';
        let leftStr = simplifyNots(node.left);
        if (node.left.type === 'BinaryExpression' && node.left.operator !== node.operator) {
          leftStr = `(${leftStr})`;
        }
        let rightStr = simplifyNots(node.right);
        if (node.right.type === 'BinaryExpression') {
          rightStr = `(${rightStr})`;
        }
        return `${leftStr} ${op} ${rightStr}`;
      }
      default:
        return '';
    }
  }

  const initial = substitute(ast);
  const intermediate = simplifyNots(ast);
  const finalVal = evaluateAstWithTrace(ast, assignment, convention).val ? trueSym : falseSym;

  if (initial !== intermediate && intermediate !== finalVal) {
    return `${assignStr}: ${initial} = ${intermediate} = ${finalVal}`;
  }
  if (initial !== finalVal) {
    return `${assignStr}: ${initial} = ${finalVal}`;
  }
  return `${assignStr}: = ${finalVal}`;
}

export function renderFigureSvg(sheet, regions, { isKey = false, outlinesOnly = false } = {}) {
  const vbWidth = sheet.viewBox?.width ?? 180;
  const vbHeight = sheet.viewBox?.height ?? 95;

  const trueRowsSet = new Set(sheet.intendedTrueRows || []);

  // Background / Shaded regions
  let shadedPaths = '';
  if (isKey && !outlinesOnly) {
    shadedPaths = regions
      .filter((r) => trueRowsSet.has(r.id))
      .map(
        (r) => `<path d="${r.pathD}" fill="#a8a8a8" fill-opacity="0.9" stroke="none" class="key-shaded-region" />`
      )
      .join('\n');
  }

  // Shape outlines
  const shapePaths = (sheet.variables || [])
    .map((v) => {
      const shapeGeom = sheet.shapes[v];
      const style = SHAPE_STYLES[v] || { strokeWidth: '0.7', dashArray: 'none', stroke: '#111' };
      const pathD = geometryToPathData(shapeGeom);
      return `<path d="${pathD}" fill="none" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" stroke-dasharray="${style.dashArray}" class="shape-outline shape-outline-${v}" />`;
    })
    .join('\n');

  // Outer visible frame
  const frameD = sheet.framePolygon
    ? geometryToPathData(sheet.framePolygon)
    : `M 1 1 L ${vbWidth - 1} 1 L ${vbWidth - 1} ${vbHeight - 1} L 1 ${vbHeight - 1} Z`;
  const framePath = `<path d="${frameD}" fill="none" stroke="#222" stroke-width="0.45" class="frame-outline" />`;

  // Shape labels with outside leader lines, outline anchor dots, and line style swatches (R2, D2, D3, D4)
  const allShapes = (sheet.variables || []).map((v) => sheet.shapes[v]);
  const placedBoxes = [];
  const leaderLines = [];
  const labelGroups = [];

  for (const v of sheet.variables || []) {
    const shapeGeom = sheet.shapes[v];
    const otherVars = (sheet.variables || []).filter((x) => x !== v);
    const otherShapes = otherVars.map((x) => sheet.shapes[x]);
    const baseStyle = SHAPE_STYLES[v] || { strokeWidth: '0.7', dashArray: 'none', stroke: '#111', targetAngle: Math.PI * 0.5 };
    const override = sheet.shapeStyles?.[v] || {};
    const style = { ...baseStyle, ...override };

    // Anchor on shape's own outline >= 6 mm away from any other outline
    const anchor = findOutlineAnchorPoint(shapeGeom, otherShapes, {
      targetAngle: style.targetAngle,
      centerX: vbWidth / 2,
      centerY: vbHeight / 2,
      minClearanceMm: 6.0,
    });

    const boxWidth = 27.0;
    const boxHeight = 15.0;
    const hw = boxWidth / 2; // 13.5 mm
    const hh = boxHeight / 2; // 7.5 mm

    // D3: Position label box with >= 3 mm clearance from all shapes and from frame
    const pos = findLabelBoxPosition(v, anchor, allShapes, sheet.viewBox, placedBoxes, boxWidth, boxHeight);
    placedBoxes.push(pos.box);

    const badgeX = pos.x;
    const badgeY = pos.y;

    // Leader line pointing from badge box perimeter to anchor dot on outline
    const vx = anchor.x - badgeX;
    const vy = anchor.y - badgeY;
    const t = Math.min(hw / Math.abs(vx || 1e-6), hh / Math.abs(vy || 1e-6));
    const startX = badgeX + vx * t;
    const startY = badgeY + vy * t;

    leaderLines.push({ x1: startX, y1: startY, x2: anchor.x, y2: anchor.y });

    const leaderLine = `<line x1="${startX.toFixed(2)}" y1="${startY.toFixed(2)}" x2="${anchor.x.toFixed(2)}" y2="${anchor.y.toFixed(2)}" stroke="#333" stroke-width="0.35" stroke-dasharray="1.5 1.5" class="leader-line" />`;
    const anchorDot = `<circle cx="${anchor.x.toFixed(2)}" cy="${anchor.y.toFixed(2)}" r="0.9" fill="#111" class="leader-dot" />`;

    // D4: Swatch length = 23 mm (from badgeX - 11.5 to badgeX + 11.5), at least 2 full dash periods long
    const swatchX1 = (badgeX - 11.5).toFixed(2);
    const swatchX2 = (badgeX + 11.5).toFixed(2);
    const swatchY = (badgeY + 4.2).toFixed(2);

    labelGroups.push(`
      <g class="shape-label-group" id="label-group-${v}">
        ${leaderLine}
        ${anchorDot}
        <rect x="${(badgeX - hw).toFixed(2)}" y="${(badgeY - hh).toFixed(2)}" width="${boxWidth}" height="${boxHeight}" rx="3" fill="#fff" fill-opacity="0.95" stroke="#333" stroke-width="0.35" class="shape-label-badge-box" />
        <text x="${badgeX.toFixed(2)}" y="${(badgeY - 2.0).toFixed(2)}" dominant-baseline="central" text-anchor="middle" font-family="Arial, sans-serif" font-size="5.6" font-weight="bold" fill="#000" class="shape-label-text">${v}</text>
        <line x1="${swatchX1}" y1="${swatchY}" x2="${swatchX2}" y2="${swatchY}" stroke="#111" stroke-width="${style.strokeWidth}" stroke-dasharray="${style.dashArray}" class="shape-label-swatch" />
      </g>
    `);
  }

  const labelsHtml = labelGroups.join('\n');

  // Region row numbers (R3, D2 & Owner Decision: 1-based row numbering, clearance >= 1 mm from all obstacles)
  let rowNumbersHtml = '';
  if (sheet.showRegionRowNumbers && !outlinesOnly) {
    const reg0 = regions.find((r) => r.includedVariables.length === 0);
    const badge0Point = reg0
      ? findObstacleFreeBadgePoint(reg0, placedBoxes, leaderLines, sheet.viewBox, 2.6)
      : { x: 154, y: 78 };

    const radius = 2.6; // Inscribed clearance >= 1.0 mm for all numbered regions (dia >= 8 mm)
    // A row split into disconnected pieces gets a badge in every piece; otherwise
    // students leave the unbadged piece unshaded.
    const minBadgePieceDiaMm = 2 * (radius + 1.0);

    rowNumbersHtml = regions
      .flatMap((r) => {
        const displayRow = r.id + 1; // 1-based indexing for students (1..4 / 1..8)
        let points;
        if (r.includedVariables.length === 0) {
          points = [badge0Point];
        } else {
          const tooSmall = r.pieces.filter((p) => p.inscribedCircleDiaMm < minBadgePieceDiaMm);
          if (tooSmall.length > 0) {
            throw new Error(
              `Sheet "${sheet.id}" row ${displayRow}: ${tooSmall.length} piece(s) too small for a row badge (need inscribed dia >= ${minBadgePieceDiaMm.toFixed(1)} mm).`
            );
          }
          points = r.pieces.map((p) => p.center);
        }

        return points.map(
          (pt, pieceIndex) => `
          <g class="region-row-number-group" id="row-number-${displayRow}-${pieceIndex + 1}" data-row="${displayRow}">
            <circle cx="${pt.x.toFixed(2)}" cy="${pt.y.toFixed(2)}" r="${radius}" fill="#fff" fill-opacity="0.9" stroke="#333" stroke-width="0.35" class="region-row-number-circle" />
            <text x="${pt.x.toFixed(2)}" y="${pt.y.toFixed(2)}" dominant-baseline="central" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.2" font-weight="bold" fill="#111" class="region-row-number-text">${displayRow}</text>
          </g>
        `
        );
      })
      .join('\n');
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWidth} ${vbHeight}" width="${vbWidth}mm" height="${vbHeight}mm" class="puzzle-figure-svg">
      <defs>
        <style>
          .shape-label-text { font-family: Arial, sans-serif; font-size: 5.6px; font-weight: bold; }
          .region-row-number-text { font-family: Arial, sans-serif; font-size: 3.2px; font-weight: bold; }
        </style>
      </defs>
      ${framePath}
      ${shadedPaths}
      ${shapePaths}
      ${labelsHtml}
      ${rowNumbersHtml}
    </svg>
  `;
}

export function renderTruthTableHtml(sheet, regions, { isKey = false, convention = 'TF' } = {}) {
  const vars = sheet.variables || [];
  const trueRowsSet = new Set(sheet.intendedTrueRows || []);
  const trueSym = convention === '10' ? '1' : 'T';
  const falseSym = convention === '10' ? '0' : 'F';

  const headerCells = [
    '<th class="col-row-num">Row</th>',
    ...vars.map((v) => `<th class="col-var">${v}</th>`),
    '<th class="col-output">Output</th>',
  ].join('');

  const bodyRows = regions
    .map((r) => {
      const isTrue = trueRowsSet.has(r.id);
      const rowClass = isKey && isTrue ? 'row-true' : 'row-standard';
      const outVal = isTrue ? trueSym : falseSym;
      const outCell = isKey
        ? `<td class="cell-output ${isTrue ? 'val-true' : 'val-false'}"><b>${outVal}</b>${isTrue ? ' ✓' : ''}</td>`
        : '<td class="cell-output cell-empty"></td>';

      const varCells = vars
        .map((v) => `<td class="cell-var">${r.assignment[v] ? trueSym : falseSym}</td>`)
        .join('');

      const displayRow = r.id + 1; // 1-based row numbering (1..4 / 1..8)
      return `
        <tr class="${rowClass}">
          <td class="cell-row-num">${displayRow}</td>
          ${varCells}
          ${outCell}
        </tr>
      `;
    })
    .join('\n');

  return `
    <table class="truth-table">
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  `;
}

export function renderWorkedStepsHtml(sheet, regions, convention = 'TF') {
  const parsed = typeof sheet.expression === 'string' ? parseBooleanExpression(sheet.expression) : sheet.expression;
  const trueRowsSet = new Set(sheet.intendedTrueRows || []);

  const stepsList = regions
    .map((r) => {
      const stepText = generateRowWorkedStep(parsed, r.assignment, sheet.variables, convention);
      const isTrue = trueRowsSet.has(r.id);
      const displayRow = r.id + 1;
      return `
        <li class="worked-step-item ${isTrue ? 'step-true' : 'step-false'}">
          <span class="step-badge">Row ${displayRow}:</span>
          <code class="step-text">${stepText}</code>
        </li>
      `;
    })
    .join('\n');

  return `
    <div class="worked-steps-container">
      <h4 class="worked-steps-title">Row-by-Row Evaluation</h4>
      <ol class="worked-steps-list">
        ${stepsList}
      </ol>
    </div>
  `;
}

function getBaseCss() {
  return `
    @page {
      size: letter portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
      font-size: 10pt;
      line-height: 1.35;
    }
    .page-sheet {
      width: 185.9mm;
      min-height: 255.4mm;
      max-height: 255.4mm;
      margin: 0 auto;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }
    .header-block {
      border-bottom: 0.4mm solid #111;
      padding-bottom: 2mm;
      margin-bottom: 2mm;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5mm;
    }
    .sheet-title {
      font-size: 13pt;
      font-weight: bold;
      margin: 0;
    }
    .key-badge {
      font-size: 13pt;
      font-weight: 900;
      color: #000;
      background: #e2e2e2;
      border: 0.5mm solid #000;
      padding: 1mm 3.5mm;
      border-radius: 1mm;
      letter-spacing: 0.5mm;
    }
    .student-fields-large {
      display: flex;
      align-items: flex-end;
      gap: 8mm;
      font-size: 15pt;
      font-weight: bold;
      color: #111;
      margin-bottom: 3mm;
    }
    .field-line {
      border-bottom: 0.45mm solid #111;
      display: inline-block;
      height: 9mm;
      vertical-align: bottom;
    }
    .field-name { width: 105mm; }
    .field-class { width: 32mm; }

    .instructions-block {
      margin-bottom: 2mm;
    }
    .instructions-list {
      margin: 0;
      padding-left: 5mm;
      font-size: 9.5pt;
    }
    .instructions-list li {
      margin-bottom: 0.6mm;
    }

    .expression-banner {
      background: #f4f4f4;
      border: 0.35mm solid #666;
      border-radius: 1.2mm;
      padding: 1.5mm 3mm;
      margin-bottom: 2mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .expr-words-label {
      font-size: 9.5pt;
      font-weight: bold;
      color: #333;
    }
    .expr-words-text {
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 0.2mm;
    }
    .expr-symbol-text {
      font-size: 9pt;
      color: #555;
      font-family: "Courier New", monospace;
    }

    .figure-container {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-bottom: 2.5mm;
    }
    .puzzle-figure-svg {
      display: block;
      width: 180mm;
      height: 95mm;
    }

    .student-table-container {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-bottom: 2mm;
    }
    .student-table-container .truth-table {
      width: 130mm;
    }

    .key-table-container {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-bottom: 2mm;
    }
    .key-table-container .truth-table {
      width: 135mm;
    }

    .truth-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.8pt;
    }
    .truth-table th, .truth-table td {
      border: 0.35mm solid #444;
      text-align: center;
      padding: 1.2mm 0.5mm;
      height: 7.2mm;
      min-width: 10.2mm;
    }
    .truth-table th {
      background: #eaeaea;
      font-weight: bold;
      font-size: 8.8pt;
    }
    .col-row-num { width: 11mm; }
    .col-var { width: 11mm; }
    .col-output { min-width: 15mm; }
    .row-true td {
      background: #ededed;
    }
    .cell-output.val-true {
      font-weight: bold;
      color: #000;
    }

    .worked-steps-container {
      width: 100%;
      border: 0.3mm solid #999;
      border-radius: 1mm;
      padding: 1.5mm 3mm;
      background: #fafafa;
      margin-bottom: 1.5mm;
      box-sizing: border-box;
    }
    .worked-steps-title {
      margin: 0 0 1mm 0;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3mm;
      color: #333;
    }
    .worked-steps-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .worked-step-item {
      margin-bottom: 0.5mm;
      display: flex;
      gap: 2mm;
      align-items: baseline;
      white-space: nowrap;
    }
    .step-badge {
      font-weight: bold;
      color: #444;
      font-size: 8.2pt;
      min-width: 13mm;
      white-space: nowrap;
    }
    .step-text {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      white-space: nowrap;
    }
    .step-true .step-text {
      font-weight: bold;
      color: #000;
    }

    .revealed-picture-callout {
      margin-top: 1mm;
      padding: 1.5mm 3mm;
      background: #eef2f7;
      border-left: 1mm solid #2563eb;
      font-size: 9.2pt;
    }

    .footer-block {
      border-top: 0.35mm solid #888;
      padding-top: 1.5mm;
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #555;
    }

    /* Student pages are sized to stay legible when printed 2-up (about 65% scale) */
    .student-page .sheet-title { font-size: 17pt; }
    .student-page .instructions-list { font-size: 13pt; padding-left: 7mm; }
    .student-page .instructions-list li { margin-bottom: 1mm; }
    .student-page .expression-banner { padding: 2mm 3.5mm; margin-bottom: 3mm; }
    .student-page .expr-words-label { font-size: 13pt; }
    .student-page .expr-words-text { font-size: 19pt; }
    .student-page .student-table-container .truth-table { width: 150mm; }
    .student-page .truth-table,
    .student-page .truth-table th { font-size: 13pt; }
    .student-page .truth-table th,
    .student-page .truth-table td { height: 9.6mm; padding: 0.8mm 0.5mm; }
    .student-page .col-row-num,
    .student-page .col-var { width: 16mm; }
    .student-page .footer-block { font-size: 10pt; }
  `;
}

export function renderStudentPageHtml(sheet, regions, options = {}) {
  const convention = options.truthTableValues || sheet.truthTableValues || 'TF';
  // Name/Period blanks appear once per packet: on standalone sheets and on the booklet's first page
  const showStudentFields = options.showStudentFields !== false;
  const pageNumber = options.pageNumber ?? 1;
  const setId = options.setId || sheet.setId || 'shapes-1';
  const wordsExpr = formatExpressionWords(sheet.expression);
  const figureSvg = renderFigureSvg(sheet, regions, { isKey: false, convention });
  const tableHtml = renderTruthTableHtml(sheet, regions, { isKey: false, convention });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${sheet.title} — Student Worksheet</title>
  <style>${getBaseCss()}</style>
</head>
<body>
  <div class="page-sheet student-page" id="sheet-${sheet.id}">
    <div class="header-block">
      ${showStudentFields ? `<div class="student-fields-large">
        <span>Name <span class="field-line field-name">&nbsp;</span></span>
        <span>Period <span class="field-line field-class">&nbsp;</span></span>
      </div>` : ''}
      <div class="header-top">
        <h1 class="sheet-title">${sheet.title}</h1>
      </div>
    </div>

    <div class="instructions-block">
      <ol class="instructions-list">
        ${sheet.instructions.map((inst) => `<li>${inst}</li>`).join('\n')}
      </ol>
    </div>

    <div class="expression-banner">
      <span class="expr-words-label">Expression:</span>
      <span class="expr-words-text">${wordsExpr}</span>
      <span></span>
    </div>

    <div class="figure-container">
      ${figureSvg}
    </div>

    <div class="student-table-container">
      ${tableHtml}
    </div>

    <div class="footer-block">
      <span>Mr. Smith's Engineering Tech — Digital Logic</span>
      <span>Set: ${setId} &bull; ${sheet.title}</span>
      <span class="page-number-text">Page ${pageNumber}</span>
    </div>
  </div>
</body>
</html>`;
}

export function renderKeyPageHtml(sheet, regions, options = {}) {
  const convention = options.truthTableValues || sheet.truthTableValues || 'TF';
  const setId = options.setId || sheet.setId || 'shapes-1';
  const wordsExpr = formatExpressionWords(sheet.expression);
  const symbolExpr = formatExpressionSymbols(sheet.expression);
  const figureSvg = renderFigureSvg(sheet, regions, { isKey: true, convention });
  const tableHtml = renderTruthTableHtml(sheet, regions, { isKey: true, convention });
  const workedStepsHtml = renderWorkedStepsHtml(sheet, regions, convention);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ANSWER KEY: ${sheet.title} (${sheet.pictureName})</title>
  <style>${getBaseCss()}</style>
</head>
<body>
  <div class="page-sheet key-page" id="key-${sheet.id}">
    <div class="header-block">
      <div class="header-top">
        <h1 class="sheet-title">${sheet.title}: ${sheet.pictureName}</h1>
        <span class="key-badge">ANSWER KEY</span>
      </div>
    </div>

    <div class="expression-banner">
      <span class="expr-words-label">Expression:</span>
      <span class="expr-words-text">${wordsExpr}</span>
      <span class="expr-symbol-text">Symbol Form: <code>${symbolExpr}</code></span>
    </div>

    <div class="figure-container">
      ${figureSvg}
    </div>

    <div class="key-table-container">
      ${tableHtml}
    </div>

    ${workedStepsHtml}

    <div class="revealed-picture-callout">
      Revealed Picture: <b>${sheet.pictureName}</b> (Shaded regions correspond to rows evaluating to TRUE)
    </div>

    <div class="footer-block">
      <span>Mr. Smith's Engineering Tech &bull; Teacher Answer Key</span>
      <span>Set: ${setId} &bull; ${sheet.id}</span>
      <span class="page-number-text">Key Page 1</span>
    </div>
  </div>
</body>
</html>`;
}

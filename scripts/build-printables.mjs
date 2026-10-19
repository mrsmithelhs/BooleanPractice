import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import {
  formatExpressionSymbols,
  formatExpressionWords,
} from '../src/notation/index.js';
import { generateDistractors } from '../src/shape-puzzles/distractors.js';
import {
  SHAPE_STYLES,
  evaluateAstWithTrace,
  generateRowWorkedStep,
  renderFigureSvg,
  renderKeyPageHtml,
  renderStudentPageHtml,
} from '../src/shape-puzzles/render/layout.js';
import { geometryToPathData } from '../src/shape-puzzles/geometry.js';
import { SET_SHAPES_1 } from '../src/shape-puzzles/sets/shapes-1.js';
import { validateSheet } from '../src/shape-puzzles/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const SETS = {
  'shapes-1': SET_SHAPES_1,
};

function computeSha256(bufferOrString) {
  return createHash('sha256').update(bufferOrString).digest('hex');
}

export function countPdfPages(pdfBuffer) {
  const content = pdfBuffer.toString('binary');
  const matches = content.match(/\/Type\s*\/Page(?!\w)/g);
  return matches ? matches.length : 0;
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  let setId = 'shapes-1';
  let sheetFilter = null;
  let isDraft = false;

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--set' && args[i + 1]) {
      setId = args[i + 1];
      i += 1;
    } else if (args[i] === '--sheets' && args[i + 1]) {
      sheetFilter = args[i + 1].split(',').map((s) => s.trim());
      i += 1;
    } else if (args[i] === '--draft') {
      isDraft = true;
    }
  }

  return { setId, sheetFilter, isDraft };
}

function checkGitStatus(isDraft) {
  let sourceCommit = 'unknown';
  let sourceDirty = false;

  try {
    sourceCommit = execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf-8' }).trim();
    const statusOutput = execSync('git status --porcelain src/shape-puzzles', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    }).trim();
    sourceDirty = statusOutput.length > 0;
  } catch (err) {
    console.warn('Warning: Could not query git status:', err.message);
  }

  if (!isDraft && sourceDirty) {
    console.error(
      'ERROR: Uncommitted changes found in shape-puzzles definitions. Commit your changes or pass --draft to build.'
    );
    process.exit(1);
  }

  return { sourceCommit, sourceDirty };
}

function renderDistractorSvg(sheet, regions, distractor) {
  const vbWidth = sheet.viewBox?.width ?? 180;
  const vbHeight = sheet.viewBox?.height ?? 95;
  const trueRowsSet = new Set(distractor.trueRows);

  const shaded = regions
    .filter((r) => trueRowsSet.has(r.id))
    .map((r) => `<path d="${r.pathD}" fill="#a8a8a8" fill-opacity="0.9" stroke="none" />`)
    .join('\n');

  const shapePaths = (sheet.variables || [])
    .map((v) => {
      const shapeGeom = sheet.shapes[v];
      const style = SHAPE_STYLES[v] || { strokeWidth: '0.7', dashArray: 'none', stroke: '#111' };
      const pathD = geometryToPathData(shapeGeom);
      return `<path d="${pathD}" fill="none" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" stroke-dasharray="${style.dashArray}" />`;
    })
    .join('\n');

  const frameD = sheet.framePolygon
    ? geometryToPathData(sheet.framePolygon)
    : `M 1 1 L ${vbWidth - 1} 1 L ${vbWidth - 1} ${vbHeight - 1} L 1 ${vbHeight - 1} Z`;
  const framePath = `<path d="${frameD}" fill="none" stroke="#222" stroke-width="0.45" />`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWidth} ${vbHeight}" width="${vbWidth}mm" height="${vbHeight}mm" class="distractor-svg" style="display:block;background:#fff;">
      ${shaded}
      ${shapePaths}
      ${framePath}
    </svg>
  `;
}

function generateReviewHtml({ setDef, validatedSheets, distractorsBySheet, manifest }) {
  const sheetCards = validatedSheets
    .map(({ sheet, regions, validationResult }) => {
      const distInfo = distractorsBySheet[sheet.id];
      const wordsExpr = formatExpressionWords(sheet.expression);
      const symbolExpr = formatExpressionSymbols(sheet.expression);

      // R1: Render flags only, without canned or invented judgment text
      const flagNotes = distInfo.distractors
        .filter((d) => d.flags.length > 0)
        .map((d) => {
          return `<li><b>${d.expressionWords}</b> (${d.flags.join(', ')}): IoU=<b>${d.iou.toFixed(2)}</b></li>`;
        })
        .join('');

      const distractorGrid = distInfo.distractors
        .map((d, idx) => {
          const imgName = `${sheet.id}-distractor-${idx + 1}.png`;
          return `
            <div class="distractor-card ${d.flags.length ? 'flagged' : ''}">
              <div class="dist-figure">
                <a href="previews/gallery/${imgName}" target="_blank">
                  <img src="previews/gallery/${imgName}" alt="${d.expressionWords} (IoU ${d.iou.toFixed(2)})" style="width:100%;height:auto;border:1px solid #94a3b8;border-radius:4px;display:block;">
                </a>
              </div>
              <div class="dist-meta">
                <b>#${idx + 1}: ${d.expressionWords}</b><br>
                <code>${d.expressionSymbols}</code><br>
                <small>Type: ${d.type}</small><br>
                <span>IoU: <b>${d.iou.toFixed(2)}</b></span>
                ${d.flags.map((f) => `<span class="flag-pill">${f}</span>`).join(' ')}
              </div>
            </div>
          `;
        })
        .join('\n');

      return `
        <article class="sheet-review-block" id="sheet-${sheet.id}">
          <header class="sheet-review-header">
            <h2>${sheet.title} <small>(${sheet.id})</small></h2>
            <div class="sheet-expr-tag">
              <b>Expression:</b> ${wordsExpr} &nbsp;|&nbsp; <code>${symbolExpr}</code> &nbsp;|&nbsp;
              <b>Revealed Picture:</b> ${sheet.pictureName}
            </div>
          </header>

          <div class="preview-quad">
            <div class="preview-item">
              <h3>Student Page</h3>
              <a href="student/${sheet.id}.pdf" target="_blank">
                <img src="previews/${sheet.id}-student.png" alt="${sheet.id} Student Page">
              </a>
              <div class="preview-caption"><a href="student/${sheet.id}.pdf" target="_blank">Download Student PDF</a></div>
            </div>

            <div class="preview-item">
              <h3>Answer Key</h3>
              <a href="keys/${sheet.id}.pdf" target="_blank">
                <img src="previews/${sheet.id}-key.png" alt="${sheet.id} Answer Key">
              </a>
              <div class="preview-caption"><a href="keys/${sheet.id}.pdf" target="_blank">Download Key PDF</a></div>
            </div>

            <div class="preview-item">
              <h3>Outlines-Only Leakage View</h3>
              <img src="previews/${sheet.id}-leakage.png" alt="${sheet.id} Outlines Leakage">
              <div class="preview-caption">
                Outlines-only leakage view (student print size)
              </div>
            </div>

            <div class="preview-item metrics-panel">
              <h3>Validator Metrics</h3>
              <p><b>Status:</b> <span class="badge-valid">VALID (0 errors)</span></p>
              <p><b>Variables:</b> ${sheet.variables.join(', ')}</p>
              <p><b>True Rows (0-based):</b> [${sheet.intendedTrueRows.join(', ')}]</p>
              <table class="metrics-table">
                <thead>
                  <tr><th>Row</th><th>Bits</th><th>Area (mm²)</th><th>Inscribed Dia (mm)</th><th>Pieces</th></tr>
                </thead>
                <tbody>
                  ${validationResult.metrics.rows
                    .map(
                      (r) =>
                        `<tr><td>${r.id + 1}</td><td>${r.bits}</td><td>${r.areaMm2}</td><td>${r.inscribedCircleDiaMm}</td><td>${r.pieceCount}</td></tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>

          <section class="gallery-section">
            <h3>Wrong-Answer Gallery (${distInfo.distractors.length} deduplicated distractors)</h3>
            ${flagNotes ? `<ul class="flag-notes-list">${flagNotes}</ul>` : '<p>No high-overlap distractors flagged.</p>'}
            <div class="distractors-grid">
              ${distractorGrid}
            </div>
          </section>
        </article>
      `;
    })
    .join('\n');

  const resolvedChromium = manifest.chromiumVersion || 'Chromium';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Printable Puzzles Review — ${setDef.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #0f172a; line-height: 1.5; }
    h1 { margin-top: 0; font-size: 24px; color: #0f172a; }
    .meta-bar { background: #fff; padding: 12px 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px; display: flex; gap: 20px; font-size: 14px; }
    .sheet-review-block { background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .sheet-review-header { border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
    .sheet-review-header h2 { margin: 0 0 6px 0; font-size: 20px; }
    .sheet-expr-tag { font-size: 14px; color: #334155; }
    .preview-quad { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .preview-item { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #fafafa; display: flex; flex-direction: column; align-items: center; }
    .preview-item h3 { margin: 0 0 10px 0; font-size: 15px; }
    .preview-item img { max-width: 100%; height: auto; border: 1px solid #94a3b8; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .preview-caption { font-size: 13px; margin-top: 8px; text-align: center; }
    .metrics-panel { align-items: flex-start; background: #fff; }
    .badge-valid { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .metrics-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
    .metrics-table th, .metrics-table td { border: 1px solid #cbd5e1; padding: 4px 8px; text-align: center; }
    .metrics-table th { background: #f1f5f9; }
    .gallery-section { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px; }
    .gallery-section h3 { margin-top: 0; font-size: 16px; }
    .flag-notes-list { font-size: 13px; color: #475569; margin-bottom: 14px; }
    .distractors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .distractor-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #fff; font-size: 12px; }
    .distractor-card.flagged { border-color: #f59e0b; background: #fffbeb; }
    .flag-pill { background: #fef3c7; color: #92400e; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: bold; border: 1px solid #fde68a; display: inline-block; margin-top: 2px; }
  </style>
</head>
<body>
  <header>
    <h1>Printable Boolean Puzzles — Review & Verification</h1>
    <div class="meta-bar">
      <span><b>Set:</b> ${manifest.setId}</span>
      <span><b>Commit:</b> <code>${manifest.sourceCommit.slice(0, 8)}</code></span>
      <span><b>Dirty:</b> ${manifest.sourceDirty ? 'yes' : 'no'}</span>
      <span><b>Chromium:</b> ${resolvedChromium}</span>
      <span><b>Sheets:</b> ${validatedSheets.length}</span>
      <span><b>Booklets:</b> <a href="student-booklet.pdf" target="_blank">Student Booklet</a> | <a href="key-booklet.pdf" target="_blank">Key Booklet</a></span>
    </div>
  </header>

  <main>
    ${sheetCards}
  </main>
</body>
</html>`;
}

async function main() {
  const { setId, sheetFilter, isDraft } = parseCliArgs();
  const setDef = SETS[setId];
  if (!setDef) {
    console.error(`Unknown set id "${setId}". Available sets: ${Object.keys(SETS).join(', ')}`);
    process.exit(1);
  }

  const { sourceCommit, sourceDirty } = checkGitStatus(isDraft);

  // Filter sheets if specified
  const targetSheets = sheetFilter
    ? setDef.sheets.filter((s) => sheetFilter.includes(s.id))
    : setDef.sheets;

  if (targetSheets.length === 0) {
    console.error('No sheets matched the specified filter.');
    process.exit(1);
  }

  console.log(`[build-printables] Processing set "${setId}" (${targetSheets.length} sheets)...`);

  // Validate all sheets
  const validatedSheets = [];
  for (const sheet of targetSheets) {
    const v = validateSheet(sheet);
    if (!v.valid) {
      console.error(`Validation failed for sheet "${sheet.id}":`, v.errors);
      process.exit(1);
    }
    validatedSheets.push({ sheet, regions: v.regions, validationResult: v });
  }

  // Setup directories
  const exportDir = path.resolve(REPO_ROOT, 'local/exports/printables', setId);
  const studentDir = path.join(exportDir, 'student');
  const keysDir = path.join(exportDir, 'keys');
  const previewsDir = path.join(exportDir, 'previews');
  const galleryPreviewsDir = path.join(previewsDir, 'gallery');

  fs.mkdirSync(studentDir, { recursive: true });
  fs.mkdirSync(keysDir, { recursive: true });
  fs.mkdirSync(previewsDir, { recursive: true });
  fs.mkdirSync(galleryPreviewsDir, { recursive: true });

  const browser = await chromium.launch();
  const chromiumVersion = browser.version() || '147.0.7727.15 (Playwright)';
  console.log(`[build-printables] Launched Chromium ${chromiumVersion}`);

  // Create 4x context for crisp previews
  const previewContext = await browser.newContext({
    deviceScaleFactor: 4,
    viewport: { width: 794, height: 1123 }, // letter aspect ratio in standard css px
  });

  const manifestFiles = [];
  const distractorsBySheet = {};
  const studentPagesHtml = [];
  const keyPagesHtml = [];
  const truthTableValues = setDef.truthTableValues || 'TF';

  for (let i = 0; i < validatedSheets.length; i += 1) {
    const { sheet, regions } = validatedSheets[i];
    console.log(`[build-printables] [${i + 1}/${validatedSheets.length}] Generating "${sheet.id}"...`);

    const distractors = generateDistractors({
      expression: sheet.expression,
      variables: sheet.variables,
      regions,
    });
    distractorsBySheet[sheet.id] = distractors;

    const studentHtml = renderStudentPageHtml(sheet, regions, { truthTableValues });
    const keyHtml = renderKeyPageHtml(sheet, regions, { truthTableValues });
    studentPagesHtml.push(studentHtml);
    keyPagesHtml.push(keyHtml);

    // 1. Generate Student PDF
    const printPage = await browser.newPage();
    await printPage.setContent(studentHtml, { waitUntil: 'load' });
    await printPage.emulateMedia({ media: 'print' });
    const studentPdfBuffer = await printPage.pdf({
      preferCSSPageSize: true,
      printBackground: true,
    });
    const studentPageCount = countPdfPages(studentPdfBuffer);
    if (studentPageCount !== 1) {
      throw new Error(`Student PDF for "${sheet.id}" generated ${studentPageCount} pages; expected exactly 1.`);
    }
    const studentPdfPath = path.join(studentDir, `${sheet.id}.pdf`);
    fs.writeFileSync(studentPdfPath, studentPdfBuffer);
    manifestFiles.push({
      path: `student/${sheet.id}.pdf`,
      kind: 'student',
      sheetId: sheet.id,
      sha256: computeSha256(studentPdfBuffer),
    });

    // 2. Generate Key PDF
    await printPage.setContent(keyHtml, { waitUntil: 'load' });
    await printPage.emulateMedia({ media: 'print' });
    const keyPdfBuffer = await printPage.pdf({
      preferCSSPageSize: true,
      printBackground: true,
    });
    const keyPageCount = countPdfPages(keyPdfBuffer);
    if (keyPageCount !== 1) {
      throw new Error(`Key PDF for "${sheet.id}" generated ${keyPageCount} pages; expected exactly 1.`);
    }
    const keyPdfPath = path.join(keysDir, `${sheet.id}.pdf`);
    fs.writeFileSync(keyPdfPath, keyPdfBuffer);
    manifestFiles.push({
      path: `keys/${sheet.id}.pdf`,
      kind: 'key',
      sheetId: sheet.id,
      sha256: computeSha256(keyPdfBuffer),
    });
    await printPage.close();

    // 3. Render 4x Previews
    const previewPage = await previewContext.newPage();
    await previewPage.setContent(studentHtml, { waitUntil: 'load' });
    const studentSheetEl = await previewPage.locator('.page-sheet');
    const studentPngBuffer = await studentSheetEl.screenshot();
    const studentPngPath = path.join(previewsDir, `${sheet.id}-student.png`);
    fs.writeFileSync(studentPngPath, studentPngBuffer);
    manifestFiles.push({
      path: `previews/${sheet.id}-student.png`,
      kind: 'preview',
      sheetId: sheet.id,
      sha256: computeSha256(studentPngBuffer),
    });

    await previewPage.setContent(keyHtml, { waitUntil: 'load' });
    const keySheetEl = await previewPage.locator('.page-sheet');
    const keyPngBuffer = await keySheetEl.screenshot();
    const keyPngPath = path.join(previewsDir, `${sheet.id}-key.png`);
    fs.writeFileSync(keyPngPath, keyPngBuffer);
    manifestFiles.push({
      path: `previews/${sheet.id}-key.png`,
      kind: 'preview',
      sheetId: sheet.id,
      sha256: computeSha256(keyPngBuffer),
    });

    // 4. Render Outlines-Only Leakage View
    const leakageSvg = renderFigureSvg(sheet, regions, { outlinesOnly: true });
    const leakageHtml = `<!doctype html><html><body style="margin:0;padding:12px;background:#fff;display:inline-block;">${leakageSvg}</body></html>`;
    await previewPage.setContent(leakageHtml, { waitUntil: 'load' });
    const leakageEl = await previewPage.locator('.puzzle-figure-svg');
    const leakagePngBuffer = await leakageEl.screenshot();
    const leakagePngPath = path.join(previewsDir, `${sheet.id}-leakage.png`);
    fs.writeFileSync(leakagePngPath, leakagePngBuffer);
    manifestFiles.push({
      path: `previews/${sheet.id}-leakage.png`,
      kind: 'leakage',
      sheetId: sheet.id,
      sha256: computeSha256(leakagePngBuffer),
    });

    // 4b. Render Gallery Distractor Previews as standalone print-scale PNGs (D1)
    for (let dIdx = 0; dIdx < distractors.distractors.length; dIdx += 1) {
      const d = distractors.distractors[dIdx];
      const distSvg = renderDistractorSvg(sheet, regions, d);
      const distHtml = `<!doctype html><html><body style="margin:0;padding:8px;background:#fff;display:inline-block;">${distSvg}</body></html>`;
      await previewPage.setContent(distHtml, { waitUntil: 'load' });
      const distEl = await previewPage.locator('.distractor-svg');
      const distPngBuffer = await distEl.screenshot();
      const distFileName = `${sheet.id}-distractor-${dIdx + 1}.png`;
      const distPngPath = path.join(galleryPreviewsDir, distFileName);
      fs.writeFileSync(distPngPath, distPngBuffer);
      manifestFiles.push({
        path: `previews/gallery/${distFileName}`,
        kind: 'distractor-preview',
        sheetId: sheet.id,
        distractorIndex: dIdx + 1,
        expressionWords: d.expressionWords,
        expressionSymbols: d.expressionSymbols,
        iou: d.iou,
        flags: d.flags,
        sha256: computeSha256(distPngBuffer),
      });
    }

    await previewPage.close();
  }

  // 5. Generate Combined Booklets
  console.log('[build-printables] Generating student and key booklets...');
  const combinedStudentHtml = studentPagesHtml.join('\n');
  const combinedKeyHtml = keyPagesHtml.join('\n');

  const bookletPage = await browser.newPage();
  await bookletPage.setContent(combinedStudentHtml, { waitUntil: 'load' });
  await bookletPage.emulateMedia({ media: 'print' });
  const studentBookletBuffer = await bookletPage.pdf({ preferCSSPageSize: true, printBackground: true });
  const studentBookletPath = path.join(exportDir, 'student-booklet.pdf');
  fs.writeFileSync(studentBookletPath, studentBookletBuffer);
  manifestFiles.push({
    path: 'student-booklet.pdf',
    kind: 'booklet',
    sha256: computeSha256(studentBookletBuffer),
  });

  await bookletPage.setContent(combinedKeyHtml, { waitUntil: 'load' });
  await bookletPage.emulateMedia({ media: 'print' });
  const keyBookletBuffer = await bookletPage.pdf({ preferCSSPageSize: true, printBackground: true });
  const keyBookletPath = path.join(exportDir, 'key-booklet.pdf');
  fs.writeFileSync(keyBookletPath, keyBookletBuffer);
  manifestFiles.push({
    path: 'key-booklet.pdf',
    kind: 'booklet',
    sha256: computeSha256(keyBookletBuffer),
  });
  await bookletPage.close();

  await previewContext.close();
  await browser.close();

  // Booklet page maps
  const studentPageMap = {};
  const keyPageMap = {};
  validatedSheets.forEach(({ sheet }, index) => {
    studentPageMap[sheet.id] = index + 1;
    keyPageMap[sheet.id] = index + 1;
  });

  // 6. Build Manifest
  const manifest = {
    setId: setDef.id,
    title: setDef.title,
    sourceCommit,
    sourceDirty,
    generatorVersion: '1.0.0',
    chromiumVersion,
    truthTableValues,
    rowIndexBase: 0,
    rowNumberingNote: 'Manifest trueRows uses 0-based indexing matching evaluator truth table rows; printed student and key sheets display 1-based row numbers (1..4 / 1..8).',
    badgeProgression: 'Region row-number badges are shown on the first sheet of each size (1A and 2A) and omitted on later sheets (1B, 1C, 2B, 2C, Fallback). Sheets without badges include an extra intermediate instruction step.',
    generatedAt: new Date().toISOString(),
    sheets: validatedSheets.map(({ sheet }) => {
      const defHash = computeSha256(
        JSON.stringify({
          id: sheet.id,
          variables: sheet.variables,
          expression: sheet.expression,
          intendedTrueRows: sheet.intendedTrueRows,
          shapes: sheet.shapes,
        })
      );
      return {
        id: sheet.id,
        slot: sheet.slot ?? null,
        slotCandidate: sheet.slotCandidate ?? null,
        title: sheet.title,
        pictureName: sheet.pictureName,
        variables: sheet.variables,
        expressionWords: formatExpressionWords(sheet.expression),
        expressionSymbols: formatExpressionSymbols(sheet.expression),
        trueRows: sheet.intendedTrueRows,
        instructions: sheet.instructions,
        showRegionRowNumbers: sheet.showRegionRowNumbers,
        frozen: sheet.frozen,
        definitionHash: defHash,
        generatorCommit: sourceCommit,
      };
    }),
    bookletPageMaps: {
      student: studentPageMap,
      key: keyPageMap,
    },
    files: manifestFiles,
  };

  const manifestPath = path.join(exportDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[build-printables] Manifest written to ${manifestPath}`);

  // 7. Build Review Page
  const reviewHtml = generateReviewHtml({
    setDef,
    validatedSheets,
    distractorsBySheet,
    manifest,
  });
  const reviewPath = path.join(exportDir, 'review.html');
  fs.writeFileSync(reviewPath, reviewHtml, 'utf-8');
  console.log(`[build-printables] Review page written to ${reviewPath}`);

  console.log('[build-printables] Complete! All artifacts generated in local/exports/printables/' + setId);
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error('[build-printables] Fatal error:', err);
    process.exit(1);
  });
}

import { expect, test } from '@playwright/test';
import { countPdfPages } from '../../scripts/build-printables.mjs';
import {
  renderKeyPageHtml,
  renderStudentPageHtml,
} from '../../src/shape-puzzles/render/layout.js';
import { SET_SHAPES_1 } from '../../src/shape-puzzles/sets/shapes-1.js';
import { validateSheet } from '../../src/shape-puzzles/validator.js';

const PX_TO_MM = 25.4 / 96;

function computeBoxDistanceMm(b1, b2) {
  const x1Min = b1.x;
  const x1Max = b1.x + b1.width;
  const y1Min = b1.y;
  const y1Max = b1.y + b1.height;

  const x2Min = b2.x;
  const x2Max = b2.x + b2.width;
  const y2Min = b2.y;
  const y2Max = b2.y + b2.height;

  const dx = Math.max(0, Math.max(x1Min - x2Max, x2Min - x1Max)) * PX_TO_MM;
  const dy = Math.max(0, Math.max(y1Min - y2Max, y2Min - y1Max)) * PX_TO_MM;

  if (dx === 0 && dy === 0) return 0;
  return Math.hypot(dx, dy);
}

test.describe('Printables Legibility & Print Geometry (Plan 37)', () => {
  for (const sheet of SET_SHAPES_1.sheets) {
    const vResult = validateSheet(sheet);
    const regions = vResult.regions;

    test(`${sheet.id}: student and key PDFs are exactly 1 page`, async ({ page }) => {
      const studentHtml = renderStudentPageHtml(sheet, regions);
      await page.setContent(studentHtml, { waitUntil: 'load' });
      await page.emulateMedia({ media: 'print' });
      const studentPdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      expect(countPdfPages(studentPdf), `Student PDF for ${sheet.id} must be 1 page`).toBe(1);

      const keyHtml = renderKeyPageHtml(sheet, regions);
      await page.setContent(keyHtml, { waitUntil: 'load' });
      await page.emulateMedia({ media: 'print' });
      const keyPdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      expect(countPdfPages(keyPdf), `Key PDF for ${sheet.id} must be 1 page`).toBe(1);
    });

    for (const pageKind of ['student', 'key']) {
      for (const scale of [1.0, 0.9]) {
        const minTextHeight = scale === 1.0 ? 2.9 : 2.6;

        test(`${sheet.id} (${pageKind}, scale ${scale}): legibility, clearance, containment, and cell metrics`, async ({
          page,
        }) => {
          const html =
            pageKind === 'key'
              ? renderKeyPageHtml(sheet, regions)
              : renderStudentPageHtml(sheet, regions);

          await page.setContent(html, { waitUntil: 'load' });
          await page.emulateMedia({ media: 'print' });

          if (scale !== 1.0) {
            await page.evaluate((s) => {
              document.body.style.transform = `scale(${s})`;
              document.body.style.transformOrigin = 'top left';
            }, scale);
          }

          const metrics = await page.evaluate(() => {
            const PX_TO_MM = 25.4 / 96;

            function getRectMm(el) {
              const r = el.getBoundingClientRect();
              return {
                x: r.x * PX_TO_MM,
                y: r.y * PX_TO_MM,
                width: r.width * PX_TO_MM,
                height: r.height * PX_TO_MM,
              };
            }

            // Text glyph heights using Range (can fail if text is too small)
            function getTextGlyphHeightMm(el) {
              const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
              let n;
              while ((n = walk.nextNode())) {
                if (n.textContent.trim().length > 0) {
                  const range = document.createRange();
                  range.selectNodeContents(n);
                  const rect = range.getBoundingClientRect();
                  return rect.height * PX_TO_MM;
                }
              }
              return null;
            }

            function getSvgElementHeightMm(el) {
              const r = el.getBoundingClientRect();
              return r.height * PX_TO_MM;
            }

            const labelTexts = Array.from(document.querySelectorAll('.shape-label-text'));
            const rowNumberTexts = Array.from(document.querySelectorAll('.region-row-number-text'));
            const tableHeaders = Array.from(document.querySelectorAll('.truth-table th'));
            const tableCells = Array.from(document.querySelectorAll('.truth-table td'));
            const exprText = document.querySelector('.expr-words-text');
            const instructions = Array.from(document.querySelectorAll('.instructions-list li'));

            // Measure glyph heights of non-empty table cells
            const cellGlyphHeights = tableCells
              .map(getTextGlyphHeightMm)
              .filter((h) => h !== null);

            // Table cell dimensions
            const tableCellDimensions = tableCells.map((td) => {
              const r = td.getBoundingClientRect();
              return { widthMm: r.width * PX_TO_MM, heightMm: r.height * PX_TO_MM };
            });

            // SVG text bounds vs SVG container bounds
            const svgEl = document.querySelector('.puzzle-figure-svg');
            const svgRect = svgEl ? svgEl.getBoundingClientRect() : null;
            const svgTextContainment = [];
            if (svgRect) {
              const svgTexts = Array.from(svgEl.querySelectorAll('text'));
              for (const t of svgTexts) {
                const tr = t.getBoundingClientRect();
                const inside =
                  tr.left >= svgRect.left - 1 &&
                  tr.right <= svgRect.right + 1 &&
                  tr.top >= svgRect.top - 1 &&
                  tr.bottom <= svgRect.bottom + 1;
                svgTextContainment.push({
                  text: t.textContent.trim(),
                  inside,
                });
              }
            }

            // Outline stroke widths and dash segment lengths
            const outlineStyles = Array.from(document.querySelectorAll('.shape-outline')).map((path) => {
              const strokeWidthStr = path.getAttribute('stroke-width') || '0.7';
              const strokeWidthMm = Number.parseFloat(strokeWidthStr);
              const dashArrayStr = path.getAttribute('stroke-dasharray');
              let dashSegmentsMm = [];
              if (dashArrayStr && dashArrayStr !== 'none') {
                dashSegmentsMm = dashArrayStr
                  .trim()
                  .split(/\s+/)
                  .map(Number.parseFloat);
              }
              return { strokeWidthMm, dashSegmentsMm };
            });

            // Central 60% intersection checks (no outline, leader, or frame through central 60% of any badge or text)
            const protectedBoxes = [];
            for (const el of [...labelTexts, ...rowNumberTexts]) {
              const r = el.getBoundingClientRect();
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              const w = r.width * 0.6;
              const h = r.height * 0.6;
              protectedBoxes.push({
                desc: el.textContent.trim(),
                box: { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 },
              });
            }

            const badgeCircles = Array.from(document.querySelectorAll('.region-row-number-circle'));
            for (const c of badgeCircles) {
              const r = c.getBoundingClientRect();
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              const w = r.width * 0.6;
              const h = r.height * 0.6;
              protectedBoxes.push({
                desc: `badge-circle-${c.parentElement?.querySelector('text')?.textContent.trim() || ''}`,
                box: { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 },
              });
            }

            const central60Intersections = [];
            const pathsToCheck = Array.from(document.querySelectorAll('.shape-outline, .frame-outline'));
            const linesToCheck = Array.from(document.querySelectorAll('.leader-line'));

            for (const pb of protectedBoxes) {
              for (const path of pathsToCheck) {
                const len = path.getTotalLength();
                const step = Math.max(1, Math.min(len / 120, 2));
                const ctm = path.getScreenCTM();
                if (!ctm) continue;
                for (let l = 0; l <= len; l += step) {
                  const pt = path.getPointAtLength(l);
                  const screenX = pt.x * ctm.a + pt.y * ctm.c + ctm.e;
                  const screenY = pt.x * ctm.b + pt.y * ctm.d + ctm.f;
                  if (
                    screenX >= pb.box.left &&
                    screenX <= pb.box.right &&
                    screenY >= pb.box.top &&
                    screenY <= pb.box.bottom
                  ) {
                    central60Intersections.push(
                      `Path ${path.getAttribute('class')} intersects central 60% of ${pb.desc}`
                    );
                    break;
                  }
                }
              }

              for (const line of linesToCheck) {
                const x1 = Number(line.getAttribute('x1'));
                const y1 = Number(line.getAttribute('y1'));
                const x2 = Number(line.getAttribute('x2'));
                const y2 = Number(line.getAttribute('y2'));
                const ctm = line.getScreenCTM();
                if (!ctm) continue;
                const steps = 30;
                for (let s = 0; s <= steps; s += 1) {
                  const lx = x1 + (s / steps) * (x2 - x1);
                  const ly = y1 + (s / steps) * (y2 - y1);
                  const screenX = lx * ctm.a + ly * ctm.c + ctm.e;
                  const screenY = lx * ctm.b + ly * ctm.d + ctm.f;
                  if (
                    screenX >= pb.box.left &&
                    screenX <= pb.box.right &&
                    screenY >= pb.box.top &&
                    screenY <= pb.box.bottom
                  ) {
                    central60Intersections.push(
                      `Leader line intersects central 60% of ${pb.desc}`
                    );
                    break;
                  }
                }
              }
            }

            return {
              labelRects: labelTexts.map(getRectMm),
              labelTextHeights: labelTexts.map(getSvgElementHeightMm),
              rowNumberTextHeights: rowNumberTexts.map(getSvgElementHeightMm),
              tableHeaderHeights: tableHeaders.map(getSvgElementHeightMm),
              cellGlyphHeights,
              exprTextHeight: exprText ? getSvgElementHeightMm(exprText) : 0,
              instructionHeights: instructions.map(getSvgElementHeightMm),
              tableCellDimensions,
              svgTextContainment,
              outlineStyles,
              central60Intersections,
              pageBounds: getRectMm(document.querySelector('.page-sheet')),
            };
          });

          // 1. Text height assertions (effective height >= minTextHeight)
          for (const h of metrics.labelTextHeights) {
            expect(h, 'Shape label text height').toBeGreaterThanOrEqual(minTextHeight);
          }
          for (const h of metrics.rowNumberTextHeights) {
            expect(h, 'Row-number text height').toBeGreaterThanOrEqual(minTextHeight);
          }
          for (const h of metrics.tableHeaderHeights) {
            expect(h, 'Table header text height').toBeGreaterThanOrEqual(minTextHeight);
          }
          for (const h of metrics.cellGlyphHeights) {
            expect(h, 'Table cell glyph text height (measured via Range)').toBeGreaterThanOrEqual(minTextHeight);
          }
          expect(metrics.exprTextHeight, 'Expression text height').toBeGreaterThanOrEqual(minTextHeight);
          for (const h of metrics.instructionHeights) {
            expect(h, 'Instruction line text height').toBeGreaterThanOrEqual(minTextHeight);
          }

          // 2. Truth table cell minimum size: >= 7 mm tall and >= 10 mm wide (at 100%)
          if (scale === 1.0) {
            for (const cell of metrics.tableCellDimensions) {
              expect(cell.heightMm, 'Truth table cell height >= 7 mm').toBeGreaterThanOrEqual(7.0);
              expect(cell.widthMm, 'Truth table cell width >= 10 mm').toBeGreaterThanOrEqual(10.0);
            }
          }

          // 3. Label separation: labels must be >= 0.8 mm apart
          const labels = metrics.labelRects;
          for (let i = 0; i < labels.length; i += 1) {
            for (let j = i + 1; j < labels.length; j += 1) {
              const dist = computeBoxDistanceMm(labels[i], labels[j]);
              expect(dist, `Labels ${i} and ${j} distance >= 0.8 mm`).toBeGreaterThanOrEqual(0.8);
            }
          }

          // 4. Central 60% clearance (no line/outline through central 60% of any badge or text)
          expect(
            metrics.central60Intersections,
            `No line should cross central 60% in ${sheet.id} (${pageKind})`
          ).toEqual([]);

          // 5. SVG text containment: all text inside SVG bounding box
          for (const item of metrics.svgTextContainment) {
            expect(item.inside, `SVG text "${item.text}" must stay inside SVG container`).toBe(true);
          }

          // 6. Outline stroke width (0.35-0.8 mm) and dash segments (>= 2 mm)
          for (const os of metrics.outlineStyles) {
            expect(os.strokeWidthMm, 'Outline stroke width between 0.35 and 0.8 mm').toBeGreaterThanOrEqual(0.35);
            expect(os.strokeWidthMm, 'Outline stroke width between 0.35 and 0.8 mm').toBeLessThanOrEqual(0.8);
            for (const seg of os.dashSegmentsMm) {
              expect(seg, 'Dash segments must be >= 2 mm').toBeGreaterThanOrEqual(2.0);
            }
          }

          // 7. Content stays inside page bounds
          expect(metrics.pageBounds.width, 'Page sheet width within letter size').toBeLessThanOrEqual(187);
          expect(metrics.pageBounds.height, 'Page sheet height within letter size').toBeLessThanOrEqual(257);
        });
      }
    }
  }
});

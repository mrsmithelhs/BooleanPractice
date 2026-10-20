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

            // D2 & D3 & D4 Elements
            const labelBoxes = Array.from(document.querySelectorAll('.shape-label-badge-box')).map((el) => {
              const x = Number(el.getAttribute('x'));
              const y = Number(el.getAttribute('y'));
              const w = Number(el.getAttribute('width'));
              const h = Number(el.getAttribute('height'));
              return { x1: x, y1: y, x2: x + w, y2: y + h, width: w, height: h };
            });

            const badgeCirclesForD2 = Array.from(document.querySelectorAll('.region-row-number-circle')).map((el) => {
              const cx = Number(el.getAttribute('cx'));
              const cy = Number(el.getAttribute('cy'));
              const r = Number(el.getAttribute('r'));
              return { cx, cy, r };
            });

            const leaderLinesData = Array.from(document.querySelectorAll('.leader-line')).map((el) => {
              return {
                x1: Number(el.getAttribute('x1')),
                y1: Number(el.getAttribute('y1')),
                x2: Number(el.getAttribute('x2')),
                y2: Number(el.getAttribute('y2')),
              };
            });

            // D2: Distance from each badge to label boxes, leader lines, and other badges
            const badgeClearances = badgeCirclesForD2.map((badge, bIdx) => {
              let minToLabel = Infinity;
              for (const lb of labelBoxes) {
                const dx = Math.max(0, Math.max(lb.x1 - badge.cx, badge.cx - lb.x2));
                const dy = Math.max(0, Math.max(lb.y1 - badge.cy, badge.cy - lb.y2));
                const d = Math.hypot(dx, dy) - badge.r;
                if (d < minToLabel) minToLabel = d;
              }

              let minToLeader = Infinity;
              for (const ll of leaderLinesData) {
                const l2 = (ll.x2 - ll.x1) ** 2 + (ll.y2 - ll.y1) ** 2;
                let t = l2 === 0 ? 0 : ((badge.cx - ll.x1) * (ll.x2 - ll.x1) + (badge.cy - ll.y1) * (ll.y2 - ll.y1)) / l2;
                t = Math.max(0, Math.min(1, t));
                const px = ll.x1 + t * (ll.x2 - ll.x1);
                const py = ll.y1 + t * (ll.y2 - ll.y1);
                const d = Math.hypot(badge.cx - px, badge.cy - py) - badge.r;
                if (d < minToLeader) minToLeader = d;
              }

              let minToOtherBadge = Infinity;
              for (let j = 0; j < badgeCirclesForD2.length; j += 1) {
                if (j === bIdx) continue;
                const ob = badgeCirclesForD2[j];
                const d = Math.hypot(badge.cx - ob.cx, badge.cy - ob.cy) - (badge.r + ob.r);
                if (d < minToOtherBadge) minToOtherBadge = d;
              }

              return { minToLabel, minToLeader, minToOtherBadge };
            });

            // D3: Label box clearance from frame and from shape outlines
            const outlinePaths = Array.from(document.querySelectorAll('.shape-outline'));
            const labelBoxClearances = labelBoxes.map((lb) => {
              const frameClearance = Math.min(lb.x1 - 1, 179 - lb.x2, lb.y1 - 1, 94 - lb.y2);

              let minOutlineClearance = Infinity;
              const samplePts = [];
              for (let x = lb.x1; x <= lb.x2; x += 1.0) {
                samplePts.push({ x, y: lb.y1 }, { x, y: lb.y2 });
              }
              for (let y = lb.y1; y <= lb.y2; y += 1.0) {
                samplePts.push({ x: lb.x1, y }, { x: lb.x2, y });
              }

              for (const path of outlinePaths) {
                const len = path.getTotalLength();
                const step = Math.max(0.5, Math.min(len / 180, 1.0));
                for (let l = 0; l <= len; l += step) {
                  const pt = path.getPointAtLength(l);
                  for (const sp of samplePts) {
                    const d = Math.hypot(pt.x - sp.x, pt.y - sp.y);
                    if (d < minOutlineClearance) minOutlineClearance = d;
                  }
                }
              }

              return { frameClearance, minOutlineClearance };
            });

            // D4: Swatches comparison with outlines
            const swatchesData = Array.from(document.querySelectorAll('.shape-label-group')).map((g) => {
              const varName = g.querySelector('.shape-label-text')?.textContent.trim() || '';
              const swatchLine = g.querySelector('.shape-label-swatch');
              const swatchWidth = Number(swatchLine?.getAttribute('stroke-width') || '0');
              const swatchDash = swatchLine?.getAttribute('stroke-dasharray') || 'none';
              const x1 = Number(swatchLine?.getAttribute('x1') || '0');
              const x2 = Number(swatchLine?.getAttribute('x2') || '0');
              const lengthMm = Math.abs(x2 - x1);

              const outline = document.querySelector(`.shape-outline-${varName}`);
              const outlineWidth = Number(outline?.getAttribute('stroke-width') || '0');
              const outlineDash = outline?.getAttribute('stroke-dasharray') || 'none';

              return {
                varName,
                swatchWidth,
                swatchDash,
                lengthMm,
                outlineWidth,
                outlineDash,
              };
            });

            // D5: Worked steps wrapping check
            const workedStepsData = Array.from(document.querySelectorAll('.worked-step-item')).map((el) => {
              const rects = el.getClientRects();
              const heightMm = el.getBoundingClientRect().height * PX_TO_MM;
              return {
                isSingleLine: rects.length <= 1,
                heightMm,
                text: el.textContent.trim(),
              };
            });

            // Item 3: Leader lines do not cross any other shape's outline
            function ccw(a, b, c) {
              return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
            }
            function doIntersect(p1, p2, p3, p4) {
              return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
            }

            const leaderIntersections = [];
            const labelGroups = Array.from(document.querySelectorAll('.shape-label-group'));
            for (const g of labelGroups) {
              const v = g.querySelector('.shape-label-text')?.textContent.trim() || '';
              const line = g.querySelector('.leader-line');
              if (!line) continue;
              const p1 = { x: Number(line.getAttribute('x1')), y: Number(line.getAttribute('y1')) };
              const p2 = { x: Number(line.getAttribute('x2')), y: Number(line.getAttribute('y2')) };

              const otherOutlines = Array.from(document.querySelectorAll('.shape-outline')).filter(
                (el) => !el.classList.contains(`shape-outline-${v}`)
              );

              for (const outline of otherOutlines) {
                const len = outline.getTotalLength();
                const step = 0.5; // mm
                let prevPt = outline.getPointAtLength(0);
                for (let l = step; l <= len; l += step) {
                  const curPt = outline.getPointAtLength(l);
                  if (doIntersect(p1, p2, prevPt, curPt)) {
                    leaderIntersections.push(
                      `Leader line for ${v} intersects outline ${outline.getAttribute('class')}`
                    );
                    break;
                  }
                  prevPt = curPt;
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
              badgeClearances,
              labelBoxClearances,
              swatchesData,
              workedStepsData,
              leaderIntersections,
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

          // 7. D2: Badges avoid label boxes, leaders, and other badges with >= 1 mm clearance
          for (const bc of metrics.badgeClearances) {
            expect(bc.minToLabel, 'Badge must avoid label boxes with clearance >= 1 mm').toBeGreaterThanOrEqual(1.0);
            expect(bc.minToLeader, 'Badge must avoid leader lines with clearance >= 1 mm').toBeGreaterThanOrEqual(1.0);
            expect(bc.minToOtherBadge, 'Badge must avoid other badges with clearance >= 1 mm').toBeGreaterThanOrEqual(1.0);
          }

          // 8. D3: Label boxes have >= 3 mm clearance from frame and shape outlines
          for (const lbc of metrics.labelBoxClearances) {
            expect(lbc.frameClearance, 'Label box frame clearance >= 3 mm').toBeGreaterThanOrEqual(3.0);
            expect(lbc.minOutlineClearance, 'Label box shape outline clearance >= 3 mm').toBeGreaterThanOrEqual(3.0);
          }

          // 9. D4: Swatch matches outline and shows at least 2 full periods (and >= 14 mm)
          for (const sw of metrics.swatchesData) {
            expect(sw.swatchDash, `Swatch dasharray must match outline for ${sw.varName}`).toBe(sw.outlineDash);
            expect(sw.swatchWidth, `Swatch stroke-width must match outline for ${sw.varName}`).toBe(sw.outlineWidth);
            expect(sw.lengthMm, `Swatch length must be >= 14 mm for ${sw.varName}`).toBeGreaterThanOrEqual(14.0);

            if (sw.swatchDash && sw.swatchDash !== 'none') {
              const segs = sw.swatchDash.trim().split(/\s+/).map(Number.parseFloat);
              const period = segs.reduce((sum, s) => sum + s, 0);
              expect(
                sw.lengthMm,
                `Swatch length must show at least 2 full periods for ${sw.varName}`
              ).toBeGreaterThanOrEqual(2 * period - 0.01);
            }
          }

          // 10. D5: Worked steps fit on single line on key pages
          if (pageKind === 'key') {
            for (const step of metrics.workedStepsData) {
              expect(step.isSingleLine, `Worked step "${step.text}" must fit on single line`).toBe(true);
              expect(step.heightMm, `Worked step height for "${step.text}" must be single line <= 5.5 mm`).toBeLessThanOrEqual(5.5);
            }
          }

          // 11. Content stays inside page bounds
          expect(metrics.pageBounds.width, 'Page sheet width within letter size').toBeLessThanOrEqual(187);
          expect(metrics.pageBounds.height, 'Page sheet height within letter size').toBeLessThanOrEqual(257);

          // 12. Item 3: Leader lines do not cross any other shape outline
          expect(
            metrics.leaderIntersections,
            `Leader lines must not cross any other shape outline in ${sheet.id} (${pageKind})`
          ).toEqual([]);
        });
      }
    }
  }
});

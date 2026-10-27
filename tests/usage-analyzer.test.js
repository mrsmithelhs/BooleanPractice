// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareFiles, summarizeFile } from '../src/usage/analyzer.js';
import { withIntegrity } from '../src/usage/format.js';

function loadFixture(filename) {
  const fullPath = resolve('tests/fixtures/usage', filename);
  const text = readFileSync(fullPath, 'utf8');
  return JSON.parse(text);
}

describe('Analyzer (src/usage/analyzer.js)', () => {
  it('clean pair produces zero review flags', async () => {
    const fileA = loadFixture('clean-student-a.json');
    const fileB = loadFixture('clean-student-b.json');

    const summaryA = await summarizeFile(fileA);
    const summaryB = await summarizeFile(fileB);

    expect(summaryA.isValid).toBe(true);
    expect(summaryA.integrity.ok).toBe(true);
    expect(summaryA.hashChain.ok).toBe(true);

    expect(summaryB.isValid).toBe(true);
    expect(summaryB.integrity.ok).toBe(true);
    expect(summaryB.hashChain.ok).toBe(true);

    const comparison = compareFiles([summaryA, summaryB], { expectedClassCode: 'PERIOD-1' });
    expect(comparison[0].flags).toHaveLength(0);
    expect(comparison[1].flags).toHaveLength(0);
  });

  it('detects integrity mismatch flag on edited file', async () => {
    const file = loadFixture('flag-integrity-mismatch.json');
    const summary = await summarizeFile(file);
    expect(summary.integrity.ok).toBe(false);

    const comparison = compareFiles([summary]);
    const flagTypes = comparison[0].flags.map((f) => f.type);
    expect(flagTypes).toContain('integrity_mismatch');
  });

  it('detects broken hash chain flag', async () => {
    const file = loadFixture('flag-broken-chain.json');
    const summary = await summarizeFile(file);
    expect(summary.hashChain.ok).toBe(false);
    expect(summary.hashChain.brokenAtSeq).toBe(3);

    const comparison = compareFiles([summary]);
    const flagTypes = comparison[0].flags.map((f) => f.type);
    expect(flagTypes).toContain('broken_chain');
  });

  it('detects class code mismatch flag when expected code is provided', async () => {
    const file = loadFixture('flag-class-code-mismatch.json');
    const summary = await summarizeFile(file);

    const comparison = compareFiles([summary], { expectedClassCode: 'PERIOD-1' });
    const flagTypes = comparison[0].flags.map((f) => f.type);
    expect(flagTypes).toContain('class_code_mismatch');
  });

  it('detects teacher_view_opened review flag and lists solves after it', async () => {
    const file = loadFixture('flag-teacher-view-opened.json');
    const summary = await summarizeFile(file);

    expect(summary.teacherViewOpened.length).toBeGreaterThan(0);
    expect(summary.solvesAfterTeacherView.length).toBeGreaterThan(0);

    const comparison = compareFiles([summary]);
    const flagTypes = comparison[0].flags.map((f) => f.type);
    expect(flagTypes).toContain('teacher_view_opened');
  });

  it('detects implausible speed flag for solves under 10s on first check', async () => {
    const file = loadFixture('flag-implausible-speed.json');
    const summary = await summarizeFile(file);

    const comparison = compareFiles([summary]);
    const flagTypes = comparison[0].flags.map((f) => f.type);
    expect(flagTypes).toContain('implausible_speed');
  });

  it('detects same install ID under different student names', async () => {
    const file1 = loadFixture('flag-same-install-1.json');
    const file2 = loadFixture('flag-same-install-2.json');

    const s1 = await summarizeFile(file1);
    const s2 = await summarizeFile(file2);

    const comparison = compareFiles([s1, s2]);
    expect(comparison[0].flags.map((f) => f.type)).toContain('same_install_different_names');
    expect(comparison[1].flags.map((f) => f.type)).toContain('same_install_different_names');
  });

  it('detects duplicate hash / byte-identical files', async () => {
    const file1 = loadFixture('flag-duplicate-hash-1.json');
    const file2 = loadFixture('flag-duplicate-hash-2.json');

    const s1 = await summarizeFile(file1);
    const s2 = await summarizeFile(file2);

    const comparison = compareFiles([s1, s2]);
    expect(comparison[0].flags.map((f) => f.type)).toContain('duplicate_hash');
    expect(comparison[1].flags.map((f) => f.type)).toContain('duplicate_hash');
  });

  it('detects identical fingerprints across different students with matching timing', async () => {
    const file1 = loadFixture('flag-identical-fingerprints-1.json');
    const file2 = loadFixture('flag-identical-fingerprints-2.json');

    const s1 = await summarizeFile(file1);
    const s2 = await summarizeFile(file2);

    const comparison = compareFiles([s1, s2]);
    expect(comparison[0].flags.map((f) => f.type)).toContain('identical_fingerprints');
    expect(comparison[1].flags.map((f) => f.type)).toContain('identical_fingerprints');
  });

  it('two perfect runs with different timing are NOT flagged as identical attempts', async () => {
    const t0 = 1729860000000;
    // Student 1 solves 3 sheets perfectly with its own timing
    const run1 = {
      schemaVersion: 1,
      app: 'boolean-practice',
      exportedAt: new Date(t0 + 100000).toISOString(),
      student: { name: 'Student One', classCode: 'CS-A' },
      installId: '11111111-1111-1111-1111-111111111111',
      events: [
        { seq: 1, t: t0, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 1 }, prevHash: '0' },
        { seq: 2, t: t0 + 2000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table' }, prevHash: '1' },
        { seq: 3, t: t0 + 35000, type: 'shading_checked', data: { set: 'shapes-1', sheet: 2, correct: true, attempt: 1 }, prevHash: '2' },
        { seq: 4, t: t0 + 37000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 2, mode: 'shade' }, prevHash: '3' },
        { seq: 5, t: t0 + 80000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 3, correct: true, attempt: 1 }, prevHash: '4' },
        { seq: 6, t: t0 + 82000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 3, mode: 'table' }, prevHash: '5' },
      ],
      summary: { sheets: {} },
    };

    // Student 2 solves 3 sheets perfectly with significantly different timing
    const run2 = {
      schemaVersion: 1,
      app: 'boolean-practice',
      exportedAt: new Date(t0 + 200000).toISOString(),
      student: { name: 'Student Two', classCode: 'CS-A' },
      installId: '22222222-2222-2222-2222-222222222222',
      events: [
        { seq: 1, t: t0, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 1 }, prevHash: '0' },
        { seq: 2, t: t0 + 10000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table' }, prevHash: '1' },
        { seq: 3, t: t0 + 20000, type: 'shading_checked', data: { set: 'shapes-1', sheet: 2, correct: true, attempt: 1 }, prevHash: '2' },
        { seq: 4, t: t0 + 25000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 2, mode: 'shade' }, prevHash: '3' },
        { seq: 5, t: t0 + 40000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 3, correct: true, attempt: 1 }, prevHash: '4' },
        { seq: 6, t: t0 + 43000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 3, mode: 'table' }, prevHash: '5' },
      ],
      summary: { sheets: {} },
    };

    const s1 = await summarizeFile(run1);
    const s2 = await summarizeFile(run2);

    const comparison = compareFiles([s1, s2]);
    expect(comparison[0].flags.some((f) => f.type === 'identical_fingerprints')).toBe(false);
    expect(comparison[1].flags.some((f) => f.type === 'identical_fingerprints')).toBe(false);
  });

  it('a copied file with a changed name and recomputed hash IS flagged as identical attempts', async () => {
    const original = loadFixture('flag-identical-fingerprints-1.json');
    const copy = JSON.parse(JSON.stringify(original));
    copy.student.name = 'Cheating Copy Student';
    delete copy.integrity;
    const sealedCopy = await withIntegrity(copy);

    const s1 = await summarizeFile(original);
    const s2 = await summarizeFile(sealedCopy);

    const comparison = compareFiles([s1, s2]);
    expect(comparison[0].flags.map((f) => f.type)).toContain('identical_fingerprints');
    expect(comparison[1].flags.map((f) => f.type)).toContain('identical_fingerprints');
  });

  it('fewer than 6 signal events never triggers identical attempts flag', async () => {
    const t0 = 1729860000000;
    // Exactly matching short run (only 4 signal events)
    const runA = {
      schemaVersion: 1,
      app: 'boolean-practice',
      exportedAt: new Date(t0 + 50000).toISOString(),
      student: { name: 'Student Alpha', classCode: 'CS-A' },
      installId: 'aaaaaaaa-1111-1111-1111-111111111111',
      events: [
        { seq: 1, t: t0, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: false, attempt: 1 }, prevHash: '0' },
        { seq: 2, t: t0 + 10000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 2 }, prevHash: '1' },
        { seq: 3, t: t0 + 12000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table' }, prevHash: '2' },
        { seq: 4, t: t0 + 20000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 2, correct: true, attempt: 1 }, prevHash: '3' },
      ],
      summary: { sheets: {} },
    };

    const runB = {
      schemaVersion: 1,
      app: 'boolean-practice',
      exportedAt: new Date(t0 + 50000).toISOString(),
      student: { name: 'Student Beta', classCode: 'CS-A' },
      installId: 'bbbbbbbb-2222-2222-2222-222222222222',
      events: JSON.parse(JSON.stringify(runA.events)),
      summary: { sheets: {} },
    };

    const s1 = await summarizeFile(runA);
    const s2 = await summarizeFile(runB);

    const comparison = compareFiles([s1, s2]);
    expect(comparison[0].flags.some((f) => f.type === 'identical_fingerprints')).toBe(false);
    expect(comparison[1].flags.some((f) => f.type === 'identical_fingerprints')).toBe(false);
  });

  it('marks same student across multiple install IDs as info, not review flag', async () => {
    const file1 = loadFixture('info-multi-install-1.json');
    const file2 = loadFixture('info-multi-install-2.json');

    const s1 = await summarizeFile(file1);
    const s2 = await summarizeFile(file2);

    const comparison = compareFiles([s1, s2]);
    // Review flags should be empty
    expect(comparison[0].flags).toHaveLength(0);
    expect(comparison[1].flags).toHaveLength(0);

    // Infos should contain multiple_install_ids
    expect(comparison[0].infos.map((i) => i.type)).toContain('multiple_install_ids');
    expect(comparison[1].infos.map((i) => i.type)).toContain('multiple_install_ids');
  });
});

// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareFiles, summarizeFile } from '../src/usage/analyzer.js';

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

  it('detects identical fingerprints across different students', async () => {
    const file1 = loadFixture('flag-identical-fingerprints-1.json');
    const file2 = loadFixture('flag-identical-fingerprints-2.json');

    const s1 = await summarizeFile(file1);
    const s2 = await summarizeFile(file2);

    const comparison = compareFiles([s1, s2]);
    expect(comparison[0].flags.map((f) => f.type)).toContain('identical_fingerprints');
    expect(comparison[1].flags.map((f) => f.type)).toContain('identical_fingerprints');
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

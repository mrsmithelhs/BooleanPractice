import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

import { CAPTURE_ROOT } from './ui-tour-capture.js';

export const SYNTHESIS_DIR_NAME = 'synthesis';
export const REVIEWS_DIR_NAME = 'reviews';
export const DEFAULT_REVIEW_CAPTURE_ROOT = CAPTURE_ROOT;

const severityOrder = ['blocker', 'high', 'medium', 'low'];
const confidenceOrder = ['high', 'medium', 'low'];

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value == null || value === '') {
    return [];
  }

  return [value];
}

function uniqueArray(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && String(value).trim() !== ''))];
}

function sortBySeverity(a, b) {
  return severityOrder.indexOf(a) - severityOrder.indexOf(b);
}

function sortByConfidence(a, b) {
  return confidenceOrder.indexOf(a) - confidenceOrder.indexOf(b);
}

async function readJsonIfExists(path) {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function readTextIfExists(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

function parseListFromText(value) {
  return uniqueArray(
    String(value ?? '')
      .split(/[,;\n]/u)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function parseAffectedScreenshots(value) {
  return parseListFromText(value).map((item) => item.replace(/^#/, ''));
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  return ['1', 'true', 'yes', 'y'].includes(normalizeText(value));
}

function parseKeyValueField(line) {
  const match = String(line).match(/^\s*(?:[-*]\s*)?([A-Za-z][A-Za-z /_-]+):\s*(.+?)\s*$/u);
  if (!match) {
    return null;
  }

  return {
    key: normalizeText(match[1]),
    value: match[2].trim(),
  };
}

function parseMarkdownFindingBlocks(text, reviewerId, sourceFileName) {
  const blocks = [];
  const lines = String(text ?? '').split(/\r?\n/u);
  let current = null;

  const pushCurrent = () => {
    if (!current) {
      return;
    }

    if (current.title || current.category || current.severity || current.confidence || current.evidenceSummary || current.likelyUserImpact || current.suggestedFixDirection) {
      blocks.push({
        ...current,
        reviewerId,
        source: {
          type: 'markdown',
          fileName: sourceFileName,
        },
      });
    }

    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headingMatch = line.match(/^\s*(?:#{2,6}\s*|[-*]\s*)?(finding|issue|observation)\b[:-]?\s*(.*)$/iu);
    if (headingMatch) {
      pushCurrent();
      current = {
        title: headingMatch[2].trim() || 'Untitled finding',
        category: '',
        severity: '',
        confidence: '',
        affectedScreenshots: [],
        affectedTours: [],
        reviewers: [reviewerId],
        evidenceSummary: '',
        likelyUserImpact: '',
        suggestedFixDirection: '',
        needsInteractiveConfirmation: false,
      };
      continue;
    }

    if (!current) {
      continue;
    }

    const field = parseKeyValueField(line);
    if (field) {
      switch (field.key) {
        case 'title':
          current.title = field.value;
          break;
        case 'category':
          current.category = field.value;
          break;
        case 'severity':
          current.severity = field.value.toLowerCase();
          break;
        case 'confidence':
          current.confidence = field.value.toLowerCase();
          break;
        case 'affected screenshot numbers':
        case 'affected screenshots':
        case 'screenshots':
          current.affectedScreenshots = parseAffectedScreenshots(field.value);
          break;
        case 'affected tours':
        case 'tours':
          current.affectedTours = parseListFromText(field.value);
          break;
        case 'likely user impact':
        case 'user impact':
          current.likelyUserImpact = field.value;
          break;
        case 'suggested fix direction':
        case 'fix direction':
          current.suggestedFixDirection = field.value;
          break;
        case 'needs interactive confirmation':
          current.needsInteractiveConfirmation = parseBoolean(field.value);
          break;
        case 'evidence':
        case 'summary':
          current.evidenceSummary = current.evidenceSummary
            ? `${current.evidenceSummary}\n${field.value}`
            : field.value;
          break;
        default:
          current.evidenceSummary = current.evidenceSummary
            ? `${current.evidenceSummary}\n${line.trim()}`
            : line.trim();
          break;
      }
      continue;
    }

    if (line.trim()) {
      current.evidenceSummary = current.evidenceSummary
        ? `${current.evidenceSummary}\n${line.trim()}`
        : line.trim();
    }
  }

  pushCurrent();
  return blocks;
}

function normalizeFinding(rawFinding, { reviewerId, sourceFileName }) {
  const screenshots = uniqueArray(
    asArray(rawFinding.affectedScreenshots)
      .map((value) => String(value).trim())
      .sort((a, b) => a.localeCompare(b)),
  );
  const tours = uniqueArray(
    asArray(rawFinding.affectedTours)
      .map((value) => String(value).trim())
      .sort((a, b) => a.localeCompare(b)),
  );
  const category = String(rawFinding.category ?? 'uncategorized').trim() || 'uncategorized';
  const severity = String(rawFinding.severity ?? 'medium').toLowerCase();
  const confidence = String(rawFinding.confidence ?? 'medium').toLowerCase();

  return {
    title: String(rawFinding.title ?? rawFinding.summary ?? 'Untitled finding').trim(),
    category,
    severity: severityOrder.includes(severity) ? severity : 'medium',
    confidence: confidenceOrder.includes(confidence) ? confidence : 'medium',
    affectedScreenshots: screenshots,
    affectedTours: tours,
    reviewers: uniqueArray([...asArray(rawFinding.reviewers), reviewerId]),
    evidenceSummary: String(rawFinding.evidenceSummary ?? rawFinding.notes ?? '').trim(),
    likelyUserImpact: String(rawFinding.likelyUserImpact ?? rawFinding.userImpact ?? '').trim(),
    suggestedFixDirection: String(rawFinding.suggestedFixDirection ?? rawFinding.fixDirection ?? '').trim(),
    needsInteractiveConfirmation: parseBoolean(rawFinding.needsInteractiveConfirmation),
    source: {
      type: rawFinding.source?.type ?? 'json',
      fileName: sourceFileName,
    },
  };
}

function buildFindingGroupKey(finding) {
  return [
    normalizeText(finding.category),
    normalizeText(finding.title),
    finding.affectedScreenshots.join(','),
    finding.affectedTours.join(','),
  ].join('|');
}

function mergeFindingGroup(group, finding) {
  group.instances.push(finding);
  group.reviewers = uniqueArray([...group.reviewers, ...finding.reviewers]);
  group.affectedScreenshots = uniqueArray([...group.affectedScreenshots, ...finding.affectedScreenshots]);
  group.affectedTours = uniqueArray([...group.affectedTours, ...finding.affectedTours]);
  group.severityCounts[finding.severity] = (group.severityCounts[finding.severity] ?? 0) + 1;
  group.confidenceCounts[finding.confidence] = (group.confidenceCounts[finding.confidence] ?? 0) + 1;
  group.categories[finding.category] = (group.categories[finding.category] ?? 0) + 1;
  if (!group.titles[finding.title]) {
    group.titles[finding.title] = 0;
  }
  group.titles[finding.title] += 1;
  if (finding.evidenceSummary) {
    group.evidenceSummaries.push(finding.evidenceSummary);
  }
  if (finding.likelyUserImpact) {
    group.userImpacts.push(finding.likelyUserImpact);
  }
  if (finding.suggestedFixDirection) {
    group.suggestedFixDirections.push(finding.suggestedFixDirection);
  }
  group.needsInteractiveConfirmation = group.needsInteractiveConfirmation || finding.needsInteractiveConfirmation;
}

function finalizeFindingGroup(group) {
  const sortedSeverityEntries = Object.entries(group.severityCounts).sort((a, b) => {
    const diff = b[1] - a[1];
    return diff !== 0 ? diff : sortBySeverity(a[0], b[0]);
  });
  const sortedConfidenceEntries = Object.entries(group.confidenceCounts).sort((a, b) => {
    const diff = b[1] - a[1];
    return diff !== 0 ? diff : sortByConfidence(a[0], b[0]);
  });
  const sortedTitleEntries = Object.entries(group.titles).sort((a, b) => {
    const diff = b[1] - a[1];
    return diff !== 0 ? diff : a[0].localeCompare(b[0]);
  });
  const sortedCategoryEntries = Object.entries(group.categories).sort((a, b) => {
    const diff = b[1] - a[1];
    return diff !== 0 ? diff : a[0].localeCompare(b[0]);
  });

  const severity = sortedSeverityEntries[0]?.[0] ?? 'medium';
  const confidence = sortedConfidenceEntries[0]?.[0] ?? 'medium';
  const title = sortedTitleEntries[0]?.[0] ?? 'Untitled finding';
  const category = sortedCategoryEntries[0]?.[0] ?? 'uncategorized';
  const repeatCount = group.instances.length;
  const severitySpread = uniqueArray(Object.keys(group.severityCounts));
  const confidenceSpread = uniqueArray(Object.keys(group.confidenceCounts));

  return {
    id: group.id,
    title,
    category,
    severity,
    confidence,
    repeatCount,
    affectedScreenshots: uniqueArray(group.affectedScreenshots),
    affectedTours: uniqueArray(group.affectedTours),
    reviewers: uniqueArray(group.reviewers),
    evidenceSummary: uniqueArray(group.evidenceSummaries).join('\n\n'),
    likelyUserImpact: uniqueArray(group.userImpacts).join('\n\n'),
    suggestedFixDirection: uniqueArray(group.suggestedFixDirections).join('\n\n'),
    needsInteractiveConfirmation: group.needsInteractiveConfirmation,
    severitySpread,
    confidenceSpread,
    severityCounts: group.severityCounts,
    confidenceCounts: group.confidenceCounts,
    categories: group.categories,
    sourceFindings: group.instances,
    contradiction: severitySpread.length > 1 || confidenceSpread.length > 1,
  };
}

async function readReviewFolder(reviewFolderPath) {
  const entries = await readdir(reviewFolderPath, { withFileTypes: true });
  const reviewerId = basename(reviewFolderPath);
  const findings = [];
  const notes = [];
  const jsonFiles = [];
  const markdownFiles = [];

  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.')) {
      continue;
    }

    const filePath = join(reviewFolderPath, entry.name);
    if (entry.name.toLowerCase().endsWith('.json')) {
      jsonFiles.push(filePath);
      continue;
    }

    if (entry.name.toLowerCase().endsWith('.md') || entry.name.toLowerCase().endsWith('.markdown')) {
      markdownFiles.push(filePath);
    }
  }

  for (const filePath of jsonFiles) {
    let parsed = null;
    try {
      parsed = await readJsonIfExists(filePath);
    } catch {
      continue;
    }
    if (!parsed) {
      continue;
    }

    const rawFindings = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.findings)
        ? parsed.findings
        : [];

    for (const rawFinding of rawFindings) {
      findings.push(
        normalizeFinding(rawFinding, {
          reviewerId,
          sourceFileName: basename(filePath),
        }),
      );
    }
  }

  for (const filePath of markdownFiles) {
    const contents = await readTextIfExists(filePath);
    if (contents.trim()) {
      notes.push({
        fileName: basename(filePath),
        text: contents.trim(),
      });
    }
    const parsedBlocks = parseMarkdownFindingBlocks(contents, reviewerId, basename(filePath));
    for (const rawFinding of parsedBlocks) {
      findings.push(
        normalizeFinding(rawFinding, {
          reviewerId,
          sourceFileName: basename(filePath),
        }),
      );
    }
  }

  return {
    reviewerId,
    folderPath: reviewFolderPath,
    notes,
    findings,
  };
}

async function collectReviewFolders(captureFolder) {
  const reviewsFolder = join(captureFolder, REVIEWS_DIR_NAME);
  try {
    const entries = await readdir(reviewsFolder, { withFileTypes: true });
    const reviewFolders = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== SYNTHESIS_DIR_NAME)
      .map((entry) => join(reviewsFolder, entry.name))
      .sort((a, b) => basename(a).localeCompare(basename(b)));
    const skipped = entries
      .filter((entry) => !entry.isDirectory() || entry.name.startsWith('.') || entry.name === SYNTHESIS_DIR_NAME)
      .map((entry) => ({
        folderName: entry.name,
        reason: entry.isDirectory() ? 'synthesis or hidden folder' : 'not a directory',
      }));

    return { reviewsFolder, reviewFolders, skipped };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { reviewsFolder, reviewFolders: [], skipped: [{ folderName: REVIEWS_DIR_NAME, reason: 'reviews folder missing' }] };
    }
    throw error;
  }
}

async function readManifest(captureFolder) {
  const manifestPath = join(captureFolder, 'manifest.json');
  const manifest = await readJsonIfExists(manifestPath);
  if (!manifest) {
    throw new Error(`Missing manifest.json in capture folder: ${captureFolder}`);
  }
  return { manifestPath, manifest };
}

export async function findLatestCaptureFolder(captureRoot = DEFAULT_REVIEW_CAPTURE_ROOT) {
  const resolvedRoot = resolve(captureRoot);
  let entries = [];
  try {
    entries = await readdir(resolvedRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }

  const directories = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== SYNTHESIS_DIR_NAME)
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  for (const folderName of directories) {
    const candidate = join(resolvedRoot, folderName);
    const { manifestPath } = await readManifestMaybe(candidate);
    if (manifestPath) {
      return candidate;
    }
  }

  return null;
}

async function readManifestMaybe(captureFolder) {
  try {
    return await readManifest(captureFolder);
  } catch {
    return { manifestPath: '', manifest: null };
  }
}

function buildReviewNotesSection(reviewFolders = []) {
  return reviewFolders.length
    ? reviewFolders.map((folder) => `- ${folder.reviewerId}: ${folder.notes.length} note file(s), ${folder.findingCount} finding(s)`).join('\n')
    : '- No review folders were found.';
}

function buildSkippedFoldersSection(skippedFolders) {
  return skippedFolders.length
    ? skippedFolders.map((entry) => `- ${entry.folderName}: ${entry.reason}`).join('\n')
    : '- None';
}

function buildCaptureScreenshotSection(screenshots) {
  return screenshots.length
    ? screenshots.map((shot) => `- ${shot.id}. ${shot.filename} (${shot.tourId} / ${shot.viewportId})`).join('\n')
    : '- None';
}

function buildGroupedFindingMarkdown(group, manifest) {
  const screenshots = group.affectedScreenshots
    .map((id) => {
      const shot = manifest.screenshots.find((entry) => String(entry.id) === String(id) || entry.filename.includes(String(id)));
      return shot ? `${id} (${shot.filename})` : String(id);
    })
    .join(', ') || 'None';

  return [
    `## ${group.title}`,
    '',
    `- Category: ${group.category}`,
    `- Severity: ${group.severity}`,
    `- Confidence: ${group.confidence}`,
    `- Repeat count: ${group.repeatCount}`,
    `- Reviewers: ${group.reviewers.join(', ')}`,
    `- Affected screenshots: ${screenshots}`,
    `- Affected tours: ${group.affectedTours.join(', ') || 'None'}`,
    `- Consensus status: ${group.contradiction ? 'contradiction or spread across reviewers' : group.repeatCount > 1 ? 'consensus issue' : 'isolated issue'}`,
    '',
    group.evidenceSummary ? `Evidence:\n\n${group.evidenceSummary}` : 'Evidence: None',
    '',
    group.likelyUserImpact ? `Likely user impact:\n\n${group.likelyUserImpact}` : 'Likely user impact: Unspecified',
    '',
    group.suggestedFixDirection ? `Suggested fix direction:\n\n${group.suggestedFixDirection}` : 'Suggested fix direction: Unspecified',
    '',
  ].join('\n');
}

function buildSummaryMarkdown(result) {
  const reviewFolders = Array.isArray(result.reviewFolders) ? result.reviewFolders : [];
  const skippedReviewFolders = Array.isArray(result.skippedReviewFolders) ? result.skippedReviewFolders : [];
  const screenshots = Array.isArray(result.screenshots) ? result.screenshots : [];
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const reviewers = Array.isArray(result.reviewers) ? result.reviewers : [];
  const lines = [];
  lines.push('# UI Review Synthesis');
  lines.push('');
  lines.push(`Capture folder: ${result.captureFolder}`);
  lines.push(`Capture datetime: ${result.captureDateTime || 'Unknown'}`);
  lines.push(`Reviewers included: ${reviewers.length ? reviewers.join(', ') : 'None'}`);
  lines.push(`Review folders skipped: ${skippedReviewFolders.length}`);
  lines.push('');
  lines.push('## Tours And Screenshots');
  lines.push('');
  lines.push(buildCaptureScreenshotSection(screenshots));
  lines.push('');
  lines.push('## Review Folder Summary');
  lines.push('');
  lines.push(buildReviewNotesSection(reviewFolders));
  lines.push('');
  lines.push('## Skipped Review Folders');
  lines.push('');
  lines.push(buildSkippedFoldersSection(skippedReviewFolders));
  lines.push('');
  lines.push('## Priority Findings');
  lines.push('');
  lines.push(findings.length ? findings.map((finding) => `- ${finding.severity.toUpperCase()}: ${finding.title} (${finding.repeatCount} reviewer${finding.repeatCount === 1 ? '' : 's'})`).join('\n') : '- No findings were extracted.');
  lines.push('');
  lines.push('## Open Questions');
  lines.push('');
  lines.push(findings.length
    ? findings.filter((finding) => finding.needsInteractiveConfirmation || finding.contradiction).slice(0, 5).map((finding) => `- ${finding.title}: ${finding.contradiction ? 'reviewers disagreed' : 'needs interactive confirmation'}`).join('\n') || '- None'
    : '- None');
  lines.push('');
  return lines.join('\n');
}

function buildPrioritizedFindingsMarkdown(result) {
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const lines = [];
  lines.push('# Prioritized Findings');
  lines.push('');
  if (!findings.length) {
    lines.push('No findings were synthesized.');
    lines.push('');
    return lines.join('\n');
  }

  for (const finding of findings) {
    lines.push(buildGroupedFindingMarkdown(finding, { screenshots: result.screenshots ?? [] }));
  }

  return lines.join('\n');
}

function buildFindingIndexJson(result) {
  const findings = Array.isArray(result.findings) ? result.findings : [];
  return {
    captureFolder: result.captureFolder,
    captureDateTime: result.captureDateTime || '',
    reviewers: Array.isArray(result.reviewers) ? result.reviewers : [],
    skippedReviewFolders: Array.isArray(result.skippedReviewFolders) ? result.skippedReviewFolders : [],
    findings: findings.map((finding, index) => ({
      id: `finding-${String(index + 1).padStart(3, '0')}`,
      title: finding.title,
      category: finding.category,
      severity: finding.severity,
      confidence: finding.confidence,
      repeatCount: finding.repeatCount,
      affectedScreenshots: finding.affectedScreenshots,
      affectedTours: finding.affectedTours,
      reviewers: finding.reviewers,
      evidenceSummary: finding.evidenceSummary,
      likelyUserImpact: finding.likelyUserImpact,
      suggestedFixDirection: finding.suggestedFixDirection,
      needsInteractiveConfirmation: finding.needsInteractiveConfirmation,
      contradiction: finding.contradiction,
    })),
  };
}

function buildProposedFixPacketsMarkdown(result) {
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const candidates = findings.filter((finding) => finding.severity === 'blocker' || finding.severity === 'high' || finding.repeatCount > 1);
  if (!candidates.length) {
    return '';
  }

  const lines = [];
  lines.push('# Proposed Fix Packets');
  lines.push('');

  for (const finding of candidates) {
    lines.push(`## ${finding.title}`);
    lines.push('');
    lines.push(`- Problem evidence: ${finding.evidenceSummary || 'See prioritized findings.'}`);
    lines.push(`- Affected screenshots: ${finding.affectedScreenshots.join(', ') || 'None'}`);
    lines.push(`- Affected tours: ${finding.affectedTours.join(', ') || 'None'}`);
    lines.push(`- Suggested scope: ${finding.category}`);
    lines.push('- Non-goals: do not modify the underlying review contract or raw notes.');
    lines.push(`- Likely files or UI areas: ${finding.affectedTours.join(', ') || 'Unknown from evidence alone'}`);
    lines.push('- Validation idea: re-run the blind review workflow and confirm the issue no longer appears in the same screenshot set.');
    lines.push('');
  }

  return lines.join('\n');
}

export async function synthesizeUiReviews({
  captureFolder,
  captureRoot = DEFAULT_REVIEW_CAPTURE_ROOT,
} = {}) {
  const resolvedCaptureFolder = captureFolder ? resolve(captureFolder) : await findLatestCaptureFolder(captureRoot);
  if (!resolvedCaptureFolder) {
    throw new Error(`No capture folder found under ${resolve(captureRoot)}`);
  }

  const { manifest } = await readManifest(resolvedCaptureFolder);
  const { reviewFolders, skipped } = await collectReviewFolders(resolvedCaptureFolder);
  const reviewSummaries = [];

  for (const reviewFolderPath of reviewFolders) {
    const review = await readReviewFolder(reviewFolderPath);
    if (!review.findings.length && !review.notes.length) {
      skipped.push({
        folderName: basename(reviewFolderPath),
        reason: 'review folder contained no markdown notes or findings',
      });
      continue;
    }
    reviewSummaries.push(review);
  }

  if (!reviewSummaries.length) {
    throw new Error(`No usable review folders were found under ${join(resolvedCaptureFolder, REVIEWS_DIR_NAME)}.`);
  }

  const grouped = new Map();
  for (const review of reviewSummaries) {
    for (const finding of review.findings) {
      const key = buildFindingGroupKey(finding);
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: '',
          title: finding.title,
          category: finding.category,
          severityCounts: {},
          confidenceCounts: {},
          categories: {},
          titles: {},
          instances: [],
          reviewers: [],
          affectedScreenshots: [],
          affectedTours: [],
          evidenceSummaries: [],
          userImpacts: [],
          suggestedFixDirections: [],
          needsInteractiveConfirmation: false,
        });
      }

      mergeFindingGroup(grouped.get(key), finding);
    }
  }

  const findings = [...grouped.values()].map((group, index) => {
    group.id = `finding-${String(index + 1).padStart(3, '0')}`;
    return finalizeFindingGroup(group);
  }).sort((a, b) => {
    const severityDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
    if (severityDiff !== 0) {
      return severityDiff;
    }
    const repeatDiff = b.repeatCount - a.repeatCount;
    if (repeatDiff !== 0) {
      return repeatDiff;
    }
    const confidenceDiff = confidenceOrder.indexOf(a.confidence) - confidenceOrder.indexOf(b.confidence);
    if (confidenceDiff !== 0) {
      return confidenceDiff;
    }
    return a.title.localeCompare(b.title);
  });

  const synthesisFolder = join(resolvedCaptureFolder, SYNTHESIS_DIR_NAME);
  await mkdir(synthesisFolder, { recursive: true });

  const result = {
    captureFolder: resolvedCaptureFolder,
    captureDateTime: manifest.captureDateTime || '',
    reviewers: reviewSummaries.map((review) => review.reviewerId),
    reviewFolders: reviewSummaries.map((review) => ({
      reviewerId: review.reviewerId,
      notes: review.notes.map((note) => `${note.fileName}: ${note.text.slice(0, 120)}`),
      findingCount: review.findings.length,
    })),
    skippedReviewFolders: skipped,
    screenshots: manifest.screenshots ?? [],
    findings,
  };

  const summaryMarkdown = buildSummaryMarkdown(result);
  const prioritizedMarkdown = buildPrioritizedFindingsMarkdown(result);
  const findingIndex = buildFindingIndexJson(result);
  const proposedFixPackets = buildProposedFixPacketsMarkdown(result);

  await writeFile(join(synthesisFolder, 'summary.md'), `${summaryMarkdown}\n`, 'utf8');
  await writeFile(join(synthesisFolder, 'prioritized-findings.md'), `${prioritizedMarkdown}\n`, 'utf8');
  await writeFile(join(synthesisFolder, 'finding-index.json'), `${JSON.stringify(findingIndex, null, 2)}\n`, 'utf8');
  if (proposedFixPackets) {
    await writeFile(join(synthesisFolder, 'proposed-fix-packets.md'), `${proposedFixPackets}\n`, 'utf8');
  }

  return {
    ...result,
    synthesisFolder,
    outputFiles: {
      summaryMarkdown,
      prioritizedMarkdown,
      findingIndex,
      proposedFixPackets,
    },
  };
}

export function buildSynthesisCommandArgs(captureFolder) {
  return ['--capture', captureFolder];
}

# Sheets Assignment Mode

Plan 21 uses a Google Sheets workbook as the classroom source of truth for assignment sequences.

## Workbook Tabs

### `Assignments`

One row per assignment.

Required columns:

- `assignmentId` - stable identifier used by the app, roster, and submissions.
- `sequence` - positive integer order for teacher-facing listing.
- `title` - display name for the assignment.

Optional columns:

- `active` - `true` or `false`; inactive assignments are ignored.
- `className` - useful for filtering or documentation.
- `notes` - teacher notes.

### `Assignment Items`

One row per challenge in an assignment.

Required columns:

- `assignmentItemId` - stable id for the item in the sequence.
- `assignmentId` - links the item to the assignment row.
- `sequence` - positive integer order within the assignment.
- `challengeMode` - one of `truth-table`, `venn`, `equivalence`, or `simplification`.
- `challengeId` - problem id or challenge id from the shared catalog.

Optional columns:

- `active` - `true` or `false`.
- `label` - teacher-friendly item label.
- `notes` - teacher notes.

### `Roster`

Optional row-per-student metadata.

Recommended columns:

- `studentEmail` - the student email seen by Apps Script identity APIs.
- `studentName` - display name.
- `className` - class or period label.
- `section` - section label.
- `assignmentId` - the assignment sequence assigned to the student.

### `Submissions`

Submission rows are appended here by the GAS bridge. The sheet can be created automatically if it does not already exist.

## Authoring Rules

- Keep ids stable. Avoid renaming `assignmentId`, `assignmentItemId`, or `challengeId` unless you are intentionally changing the assignment contract.
- Use `sequence` values to control order. The app sorts by sequence and does not randomize teacher-authored rows.
- Keep the workbook readable. Teachers should be able to edit assignments and roster rows directly in Sheets without a separate tool.
- Use `?assignmentId=...` in a GAS deployment link when you want to direct the client to a specific assignment.

## Validation Behavior

- Invalid assignment rows are rejected before the student sees the assignment UI.
- Unknown challenge ids fail safely and block the assignment load.
- The static GitHub Pages build does not load Sheets assignments unless a GAS bootstrap injects workbook context.


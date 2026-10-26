# Student Usage Files & Local Teacher View

## 1. Overview

Boolean Practice supports offline, serverless verification of student puzzle activity following **DECISION-009**. The application has no backend, no accounts, and makes no network calls. Instead, the puzzle page locally records the student's own attempts in browser storage, and the student exports their progress as a signed JSON file.

Teachers review collected files using a local-only admin tool (`admin.html`) served exclusively by the local development server (`npm run dev`). The admin page is never built into GitHub Pages (`dist/`) or Google Apps Script (`gas-dist/`).

---

## 2. Student Workflow

1. The student opens the puzzle page:
   - Default: `/puzzle.html`
   - Class-specific link: `/puzzle.html?class=PERIOD-1` (pre-fills the class code).
2. The student works on shape logic puzzle sheets. Each check, solve, and attempt duration is recorded in the browser's local storage.
3. When finished, the student clicks **Download my progress** in the top navigation bar.
4. An inline modal opens:
   - **Full Name** (required, e.g. "Alex Carter")
   - **Class Code** (optional or pre-filled, e.g. "PERIOD-1")
5. The student clicks **Download Progress (.json)**:
   - A file named `bp-usage-<name-slug>-<install-id-short>-<YYYYMMDD>.json` downloads to their device.
6. The student submits this JSON file through the classroom LMS (Google Classroom, Canvas, email, etc.) as requested by the teacher.

> [!NOTE]
> If browser storage is disabled (e.g., restricted private mode), the puzzle continues to function fully. The export dialog notifies the student that progress cannot be persisted across sessions, but allows downloading the active session's work.

---

## 3. Teacher Review Workflow

1. Download student usage files into a local folder, such as `local/usage/` (which is git-ignored).
2. Start the local development server from the repository root:
   ```bash
   npm run dev
   ```
3. Open `http://127.0.0.1:5177/admin.html` in your browser.
4. Drag and drop student JSON files into the drop zone (or click to browse). Files are read completely inside the browser using the File API; nothing is uploaded anywhere.
5. Enter the **Expected Class Code** (e.g. `PERIOD-1`) to highlight submissions with mismatched or missing codes.
6. The table displays:
   - Student name and class code
   - Browser Install ID (first 8 characters)
   - Solved sheets grid (which sheets were solved and how many checks were needed)
   - Active time spent on sheets
   - Last activity timestamp
   - **Review Flags** (anomalies needing inspection)
7. Click **View Details** or any student name to inspect:
   - SHA-256 integrity verification
   - Cryptographic event hash chain continuity
   - Specific review flag explanations
   - Sheet attempt counts and active time
   - Full event timeline
8. Click **Export class summary (CSV)** to download a local spreadsheet summary. Keep any exported CSV files in `local/` to maintain student privacy.

---

## 4. File Schema (`schemaVersion: 1`)

Each exported file is a JSON payload:

```json
{
  "schemaVersion": 1,
  "app": "boolean-practice",
  "appVersion": "0.1.0",
  "exportedAt": "2026-10-25T23:00:00.000Z",
  "student": {
    "name": "Alex Carter",
    "classCode": "PERIOD-1"
  },
  "installId": "11111111-0000-0000-0000-000000000001",
  "sessions": [
    {
      "sessionId": "sess-1",
      "startedAt": "2026-10-25T22:50:00.000Z",
      "lastActivityAt": "2026-10-25T22:58:00.000Z",
      "urlParams": {
        "set": "shapes-1",
        "sheet": 1,
        "mode": "table"
      }
    }
  ],
  "events": [
    {
      "seq": 1,
      "t": 1729896600000,
      "sessionId": "sess-1",
      "type": "session_started",
      "data": { "urlParams": { "set": "shapes-1" } },
      "prevHash": "0000000000000000000000000000000000000000000000000000000000000000"
    }
  ],
  "summary": {
    "eventsTruncated": false,
    "firstRetainedSeq": 1,
    "totalEvents": 1,
    "sheets": {
      "shapes-1:1": {
        "solved": true,
        "solvedAt": "2026-10-25T22:58:00.000Z",
        "mode": "table",
        "outputChecks": 2,
        "shadingChecks": 0,
        "activeMs": 44000
      }
    }
  },
  "integrity": {
    "algorithm": "SHA-256",
    "sha256": "c978c77e01b1cd224622e0d6f21b6642d84672cf30ffc193b1b8d56c420387fa"
  }
}
```

### Event Taxonomy

| Event Type | Data Payload | Purpose |
|---|---|---|
| `session_started` | `{ urlParams }` | Session initiation (excludes `teacher` param). |
| `sheet_opened` | `{ set, sheet, mode }` | Navigation to a puzzle sheet. |
| `notation_toggled` | `{ notation }` | Notation switch between words and Java symbols. |
| `outputs_checked` | `{ set, sheet, correct, attempt, blankCount, wrongCount, cellEdits, mode }` | Truth table check submission. |
| `shading_checked` | `{ set, sheet, correct, attempt, missedCount, extraCount, regionToggles, mode }` | Diagram shading check submission. |
| `sheet_solved` | `{ set, sheet, mode, attempts, activeMs }` | Puzzle completion milestone. |
| `breakdown_opened` | `{ set, sheet }` | Subexpression breakdown disclosure opened. |
| `teacher_view_opened` | `{ set, sheet }` | Only recorded when `?teacher=1` is viewed (max 1 per sheet per session). |
| `export_requested` | `{}` | Student initiated export flow. |

---

## 5. Review Flags and Honest Limits

The analyzer highlights suspicious patterns as **Review Flags**:

1. **Integrity mismatch (possible file edit):** The SHA-256 digest of the canonical JSON payload does not match the file's recorded integrity hash.
2. **Event sequence or hash chain broken:** An event was modified, deleted, or inserted, breaking the cryptographic `prevHash` link at a specific sequence number.
3. **Class code mismatch:** The student's recorded class code does not match the teacher's expected class code.
4. **Teacher view opened in this browser:** The student opened `?teacher=1` in this browser. The flag details which sheets were viewed and whether any solves occurred afterwards.
5. **Implausible solving speed:** A sheet was solved on the first check in under 10 seconds of active time (`< 10s`).
6. **Same browser install ID under different student names:** Two or more files share the same browser install ID under different typed names (suggesting one device submitted work for multiple students).
7. **Identical file content / duplicate integrity hash:** Two or more submissions are identical copies.
8. **Identical attempt sequence under different student names:** Different students with different install IDs produced the exact same sequence of check attempts and errors.
9. **Multi-device usage (Info only):** The same student name was used across multiple install IDs (normal when students switch between school Chromebooks and home computers).

> [!IMPORTANT]
> **Honest limit:** Flags indicate items for teacher review, not proof of misconduct. Verification catches casual copying and editing; a determined student can edit any file and recompute hashes. The teacher view never claims certainty.

---

## 6. Privacy Contract

- **No Server Storage:** No student identity or usage data is transmitted to or stored on any server.
- **Git Hygiene:** No student files, student names, or class summaries may ever be committed to git. Real files must reside strictly within `local/usage/`.

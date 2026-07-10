# Boolean Practice — Agent Guide

> **This is the canonical agent entry point for this repository.**
> `CLAUDE.md` (repo root) points here. Read this file before working on any task.

---

## 1. Project Overview and Current Stage

A static Vue 3 educational web application that helps AP Computer Science A students reason through boolean expressions using stepwise truth tables, interactive SVG Venn diagrams, equivalence and simplification practice, and optional GAS/Sheets classroom output.

**Current stage: The core static Vue app and optional GAS classroom surface are implemented; Plans 32-36 are formalizing Bootstrap consumer adoption and future maintainer workflows.**

---

## 2. Area Map


| Area | Description |
|---|---|
| Shared semantics | Pure parser, evaluator, truth-table, Venn, catalog, predicate, and assignment logic in `src/`. |
| Student practice | Vue application shell and learning surfaces in `ui/`. |
| Classroom output | Optional GAS/Sheets packaging and server integration in `gas/` and `scripts/`. |
| Validation | Unit, component, accessibility, and browser checks in `tests/`. |
| Maintainer workflow | Local dev console, packet status, UI capture, and review synthesis under `scripts/` and `docs/`. |
| Historical reference | Read-only archived Apps Script source under `archive/`. |

---

## 3. Core Repository Structure

```
archive/          Read-only legacy Apps Script reference
src/              Shared parser, evaluator, catalog, truth-table, Venn, and classroom logic
gas/              Optional Apps Script-facing output and server integration
ui/               Vue app shell and student-facing components
tests/            Unit, component, accessibility, and Playwright coverage
scripts/          Build, local-console, capture, synthesis, and packet tooling
docs/             Product, architecture, deployment, workflow, and packet contracts
reports/          Packet progress reports and durable implementation evidence
local/            Ignored local-only development/review artifacts
```

---

## 4. Key Commands

Run from the repository root:

```
npm install
npm run dev:console       # human-facing local console hub
npm run dev:control       # backward-compatible alias
npm run test              # Vitest suite
npm run test:e2e          # Playwright suite
npm run lint
npm run build             # static Pages build
npm run build:gas         # optional GAS package

node scripts/dev/plan-status.js list
node scripts/dev/plan-status.js check <id>
node scripts/dev/plan-status.js lint
node scripts/dev/plan-status.js render

# Packet status tooling:
node scripts/dev/plan-status.js list            # table of all packets + effective status
node scripts/dev/plan-status.js check <id>      # exit 0 + RUNNABLE, or exit 1 + reason
node scripts/dev/plan-status.js lint            # check for schema violations
node scripts/dev/plan-status.js render          # regenerate docs/development/README.md index
node scripts/dev/plan-status.js set <id> <status> [--resolution "…"] [--superseded-by <id>]
                                                # orchestrator: change status + re-render + lint atomically (refuses to write if result won't lint)
```

> **Before starting any packet, run `node scripts/dev/plan-status.js check <id>`.**
> **If it exits nonzero, stop and report the reason — do not implement a blocked packet.**

**Optional dev console:** If the project exposes `npm run dev:console`, treat it as a submenu-driven command hub for local dev lifecycle, tests, builds, packet-status visibility, and advanced scripts. The packet-status submenu should make the list/status view easy to reach, and any command that mutates local generated output, packet frontmatter, or remote/external state should be confirmation-gated before it runs. If the console executes package scripts:
- Centralize package-script execution behind a shared wrapper helper.
- Avoid spawning raw `npm.cmd` directly on Windows (spawn `cmd.exe /d /s /c "npm run <script> -- <args>"` or equivalent tested wrapper with `shell: false` to avoid launch/EINVAL issues).
- Ensure the invocation command shown to the user on confirmation screens is the exact same command object that gets executed.
- Report spawn/launch failures (e.g. `result.error`) distinctly from child process nonzero exit statuses so environment/configuration errors are immediately debuggable.
- Add regression tests to the console's test suite to cover script launching and error handling.

---

## 5. Critical Architecture Constraints

**Read this section before touching any shared code.**

- `src/` is the framework-independent source of truth for parsing, evaluation, truth-table generation, Venn region mapping, catalog data, predicate atoms, and authored relational-equivalence knowledge.
- `ui/` owns Vue rendering, browser interaction, focus management, feedback, and practice-session state; it must consume shared semantics rather than duplicate them.
- Truth-table and Venn views must agree for the same expression and assignment ordering, and Venn support remains limited to one, two, and three variables.
- GitHub Pages is a static build with no runtime backend, user accounts, or server-side persistence. GAS/Sheets output is optional, separately packaged, and generated from shared source.
- Numeric predicate atoms are authored presentation mappings to simple boolean variables; do not infer arbitrary Java syntax, object fields, methods, arrays, or collections.
- Student-facing UI should prioritize active practice, preserve keyboard and screen-reader access, and keep visual state distinctions legible without relying on color alone.
- Run the focused tests and build checks required by the packet before claiming delivery; do not treat a passing proxy count as proof of the user-facing objective.

---

## 6. Key Reference Routing Table

When your task touches a component, read these first.

**Orientation / project-wide** (read first on any task)

| Topic | Read this |
|---|---|
| Repo folder roles and rules | `docs/repo-structure.md` (if it exists) |
| Project decisions history | `docs/decision-log.md` |
| Active / pending plans | `docs/development/README.md` |
| Documentation hub | `README.md` and the routing table below |

| Topic | Read this |
|---|---|
| Product and pedagogy | `docs/product-spec.md` |
| Architecture and source boundaries | `docs/architecture.md`, `docs/project-structure.md` |
| Testing and browser validation | `docs/testing.md`, `package.json`, `tests/` |
| Deployment and build surfaces | `docs/deployment.md`, `package.json`, `scripts/build-gas.mjs` |
| Human-facing local development | `docs/local-dev-console.md`, `scripts/dev/control-console.js` |
| Packet lifecycle and current work | `docs/workflows/packet-tracking-system.md`, `docs/development/README.md` |
| Decisions and unresolved owner questions | `docs/decision-log.md`, `docs/open-questions.md` |
| Shared boolean semantics | `src/parser/`, `src/evaluator/`, `src/truth-table/`, `src/venn/` |
| Student practice surfaces | `ui/`, `ui/components/`, `ui/style.css` |
| Optional classroom output | `gas/`, `scripts/build-gas.mjs`, `src/gas/`, `docs/sheets-assignments.md` |

---

## 7. Guardrails

**These apply in every task. Do not override without explicit owner approval.**

1. **Implementers never set packet completion status.** Do not flip `status: draft` to `complete` or edit orchestrator review notes. Report results and stop; the orchestrator/owner verifies and sets status.

2. **Verify against artifacts, not reports.** "Tests pass" and large counts are evidence, not proof. State precisely what was verified and how, so a reviewer can confirm the claim maps to the goal. Don't declare victory on a proxy metric.

3. **Decisions route through the owner.** Anything an implementer writes as "owner decision" without an owner in the loop is a defect. Surface unresolved decisions in the progress report; stop if the decision is load-bearing.

4. **Terminal states require a written `resolution`.** A `complete`, `superseded`, or `parked` packet with `resolution: null` fails lint. If you close a packet, write why.

5. **Report against the actual objective, not a proxy.** The progress report must state what was verified and how — not just that tests passed. The reviewer must be able to confirm the claim maps to the goal without re-running everything.

6. **Investigation before mutation, with an owner gate between.** For significant behavioral or structural changes: first investigate and produce a report; then wait for an owner gate; then implement. Packets that jump straight to implementation without evidence of the problem are high-risk.

7. **Docs describe what exists or is decided, never what is imagined.** A doc that describes planned or speculative state misleads the next agent. If it's aspirational, say so explicitly, or don't write it yet.

8. **Project-specific data rules.**

   - The static GitHub Pages build must not collect or persist student identity data.
   - Do not add user accounts, server-side persistence, or hidden analytics without an explicit owner decision recorded in `docs/decision-log.md`.
   - GAS and Sheets are optional classroom surfaces. Live Sheet writes, deployment changes, and identity/access behavior require the approval gates in the relevant packet.
   - The GAS server, not the static client, owns any configured account-email lookup described by the existing GAS contract; the client must not store student email locally.
   - Keep generated local review artifacts and machine-specific environment files out of tracked source according to the existing ignore and local-dev docs.




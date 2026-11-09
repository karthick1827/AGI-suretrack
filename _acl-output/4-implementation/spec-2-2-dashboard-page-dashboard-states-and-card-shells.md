---
title: 'Story 2.2 — Dashboard page, Dashboard states and card shells'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-10'
status: In Review
story_key: 2-2-dashboard-page-dashboard-states-and-card-shells
jira: NEW
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-2-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/dashboard` shows only the shell from Story 2.1. Nothing lays out the six Dashboard sections (KPI strip plus five cards), handles loading or failure, or makes the page exactly as tall as its Figma frame for each Dashboard state.

**Approach:**
- Build the Dashboard page on the state document the layout already provides (Outlet context `{ state, status, doc, retry }`).
- Add `src/lib/dashboardLayout.js` `FRAME[state]`, which holds every section's x, y, width and height for Full `6215:58878`, Small `6864:4514` and All-good `6879:15603`, copied from the PRD and design spec.
- Add the shared `CardShell` (FR-65) and the uniform section contract `{ status, data, onRetry }` (AD-18).
- Render all six section slots in the `loading` / `ready` / `error` statuses (FR-95/FR-96). In this story, `ready` sections show only their card shell and header; the card contents come in Stories 2.3 to 2.8.
- The page height equals the frame: 1052 / 860 / 856 px via `pageBottomSpacePx` 16 / 28 / 24.

## Boundaries & Constraints

**Always:**
- **Exact values:** every position, size, colour, radius, border and shadow comes from PRD FR-65 and FR-93 to FR-96, and design spec Part B §2.1, §4 and §10, verbatim, per state.
- **Card shell:** white, 1 px `#D1D5DB` border, radius 12, shadow `0 2px 2px rgba(39,39,39,0.1)`, with card header padding and typography per FR-65.
- **Data:** readings are never computed or formatted (FR-94); the page renders only data from the Outlet-context document. Layout comes only from `FRAME[state]`, never from content height, so CLS is 0 (AD-18).
- **Loading and error:** the loading placeholder (`#F4F5F6` block at the final card size) and the error (`Couldn’t load this section.` + `Retry`, from `copy.js`) follow the FR-95/FR-96 [ASSUMPTION] styling, placed in `/* states */` blocks. Retry calls the layout's `retry`; it never refetches on its own.
- **Unchanged:** the Login, Forgot Password and Header/profile Fidelity checks.

**Ask First:** a value not found in the PRD or design spec; token, font or baseline changes; new copy.

**Never:** the KPI strip and card contents (Stories 2.3 to 2.8); a second fetch of the dashboard document; responsive CSS; `react-router-dom`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full | `demo`, `/dashboard` | Six sections at `FRAME.full` positions; document height exactly 1052 px | N/A |
| Small | `?state=small` or `small` account | `FRAME.small` positions; height 860 px | N/A |
| All-good | `?state=allgood` or `allgood` account | `FRAME.allgood` positions; height 856 px | N/A |
| Loading | `VITE_DATA_LATENCY_MS=300` | Each section shows the placeholder at its final size; no layout shift | N/A |
| Error | `?__fail=dashboard` | Each section shows `Couldn’t load this section.` + `Retry`; badge hidden | Retry reloads the document once through the layout |
| Unknown state | `?state=xyz` | Falls back (Session state, then `full`) per AD-11 | N/A |
| Fidelity | Each state at 1366 px | Every section box within ±1 px of `FRAME[state]`; page height exact; card-shell colour, border, radius and shadow exact | Windows advisory, macOS authoritative |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:868-876` (FR-65 card shell) and `:1196-1241` (FR-93 to FR-96).
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:599-614` (§2.1 vertical positions), `:700-717` (§4 card shell) and `:923-941` (§10 state differences).
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md` §B: `pageBottomSpacePx` and the section data keys.
- `src/pages/SignedInLayout.jsx`: already loads the document once and exposes `{ state, status, doc, retry }` via the Outlet context. Reuse it; don't refetch.
- `src/app/App.jsx`: the `/dashboard` route renders the new `DashboardPage`.
- `src/lib/copy.js`, `fid.js`: add only the missing Dashboard section keys (verbatim PRD copy).
- `figma-reference/1x/dashboard-*.raw-1374x*.png`: used for visual comparison only once the cards exist (Story 2.8). This story uses measurement audits.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/dashboardLayout.js`: `FRAME.full/small/allgood`, each section's `{ x, y, w, h }` and `pageBottomSpacePx`, plus unit tests that pin every value to the PRD.
- [ ] `src/ui/CardShell.jsx` and `.module.css`: the FR-65 shell and card header slot.
- [ ] `src/ui/SectionState.jsx` and `.module.css`: the loading placeholder and the error with Retry.
- [ ] `src/pages/Dashboard/DashboardPage.jsx` and `.module.css`: six absolutely placed section slots from `FRAME[state]`, each taking `{ status, data, onRetry }`.
- [ ] `src/app/App.jsx`: wire `/dashboard` to `DashboardPage`.
- [ ] `tests/unit/dashboard-page.test.jsx`: every I/O-matrix row except Fidelity.
- [ ] `tests/fidelity/dashboard-layout.spec.js` and `expected/dashboard-layout.json`: per-state section boxes (±1 px), exact page height and card-shell style audit.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except the already-recorded Windows screenshot advisories, and all earlier Fidelity checks are unchanged.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

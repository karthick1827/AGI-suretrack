---
status: In Review
spec_approved_by: Manager (via Markdown Studio)
spec_approved_at: 2026-11-09T05:06:07.264Z
title: 'Story 2.2 — Dashboard page, Dashboard states and card shells'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-10'
baseline_commit: '37bf9fb493675ef8b8738404d9ed100fe453981d'
implementation_status: review
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
- [x] `src/lib/dashboardLayout.js`: `FRAME.full/small/allgood`, each section's `{ x, y, w, h }` and `pageBottomSpacePx`, plus unit tests that pin every value to the PRD.
- [x] `src/ui/CardShell.jsx` and `.module.css`: the FR-65 shell and card header slot.
- [x] `src/ui/SectionState.jsx` and `.module.css`: the loading placeholder and the error with Retry.
- [x] `src/pages/Dashboard/DashboardPage.jsx` and `.module.css`: six absolutely placed section slots from `FRAME[state]`, each taking `{ status, data, onRetry }`.
- [x] `src/app/App.jsx`: wire `/dashboard` to `DashboardPage`.
- [x] `tests/unit/dashboard-page.test.jsx`: every I/O-matrix row except Fidelity.
- [x] `tests/fidelity/dashboard-layout.spec.js` and `expected/dashboard-layout.json`: per-state section boxes (±1 px), exact page height and card-shell style audit.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except the already-recorded Windows screenshot advisories, and all earlier Fidelity checks are unchanged.

## Spec Change Log

- 2026-11-09 — **Review loop 1 (patches only):**
  - **Section states:** a missing Outlet context, unknown status, or a `ready` document with a missing slice now shows the error state instead of a blank or grey card. The header renders only with a title and subtitle; a blank link means no View All. `data-state` emits the state actually used.
  - **Retry:** disabled without `onRetry`; repeated clicks load the document once. Keyboard focus moves to the page while sections reload.
  - **Layout helpers:** `lastRowBottom()` and `pageHeight()` are safe with empty or missing values.
  - **Accessibility:** each card `<section>` is labelled by its title.
  - **Tests:** source-text and planning-doc wording tests were replaced with behavioural tests. New tests cover a state change without a reload. The fidelity check also measures View All and the chevron, and uses the scroll-safe KPI box.
  - **Card shadow:** stays `filter: drop-shadow`, as FR-65 and design spec §4 specify.
  - **KEEP:** Figma visuals, baselines and copy are unchanged.

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

## Implementation Review (Story 2.2)

**Result:**
- **Commits:** `c14c4e6` and `12a491b` on `feature/2-2-dashboard-states`.
- **Lint and build:** `npm run lint` is clean and `npm run build` succeeds.
- **Unit tests:** `npm test` passes **751/751**.
- **Fidelity check:** `npm run test:fidelity` passes **39/41**. The two failures are the known Windows advisories (Header 0.516%, Forgot modal 0.705%); macOS CI is authoritative. All six Dashboard-layout checks pass for Full, Small and All-good.

### Acceptance Criteria Checklist

- [x] **Layout (FR-93, AD-18):** six sections at `FRAME[state]` positions within ±1 px for Full, Small and All-good.
- [x] **Page height:** exactly 1052 / 860 / 856 px.
- [x] **Card shell (FR-65):** colour, border, radius, shadow and header match.
- [x] **Loading (FR-95):** the placeholder at final size, with no layout shift.
- [x] **Error (FR-96):** `Couldn’t load this section.` + `Retry`. Retry reloads the document once through the layout.
- [x] **Unknown state:** falls back per AD-11.
- [x] **Earlier checks:** Login, Forgot Password and Header/profile fidelity checks are unchanged.

### Review Findings

- **Patched (17):** listed in the Spec Change Log above.
- **Deferred (2):** in [deferred-work.md](deferred-work.md).
  - Per-section Retry names and one live region for errors (needs new copy).
  - The Retry hit-target size.
- **Rejected:**
  - Title ellipsis: the verbatim text fits, and clipping risks the Figma visuals.
  - FRAME height de-duplication and deriving `CONTENT_TOP`: the fidelity audits already cover them.
  - A textual CSS helper.
  - A remark about story artefacts.

## Suggested Review Order

**Layout**

- The frame table per state and the page-height helpers.
  [`dashboardLayout.js:1`](../../src/lib/dashboardLayout.js#L1)
- Six slots, the section contract, fallbacks and Retry focus.
  [`DashboardPage.jsx:1`](../../src/pages/Dashboard/DashboardPage.jsx#L1)
- Retry de-duplication.
  [`SignedInLayout.jsx:1`](../../src/pages/SignedInLayout.jsx#L1)

**Shared UI**

- The FR-65 shell and header.
  [`CardShell.jsx:1`](../../src/ui/CardShell.jsx#L1)
- Loading placeholder and error + Retry.
  [`SectionState.jsx:1`](../../src/ui/SectionState.jsx#L1)

**Tests**

- I/O matrix, state change without reload, fallbacks.
  [`dashboard-page.test.jsx:1`](../../tests/unit/dashboard-page.test.jsx#L1)
- Per-state boxes, page height, card-shell style, View All.
  [`dashboard-layout.spec.js:1`](../../tests/fidelity/dashboard-layout.spec.js#L1)

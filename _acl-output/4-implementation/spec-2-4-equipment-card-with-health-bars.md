---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-09T06:26:31.562Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 2.4 — Equipment card with Health bars'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
baseline_commit: 'fc6e3f482c15d6b1a4d442aed4d9397e042e3255'
implementation_status: in-progress
story_key: 2-4-equipment-card-with-health-bars
jira: SCRUM-37
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-2-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Equipment card (Story 2.2) shows only its shell and header. Customers can't see how each equipment type is doing, or spot alerts and offline units.

**Approach:**
- Fill the Equipment card inside the existing `{ status, data, onRetry }` section contract (AD-18), for Full `6215:58878`, Small `6864:4514` and All-good `6879:15603`.
- Add the pure chart module `src/lib/geometry.js` with `healthSegments({ alerts, offline, healthy })` (AD-8). It implements the exact FR-69 formula.
- Render one row per `equipmentCard.rows[]` entry: type, count, Health bar, verbatim caption and chevron. Add the per-state row dividers (FR-68).
- Each row and `View All` is a link through `paths.js` (FR-72).

## Boundaries & Constraints

**Always:**
- **Exact values:** every size, position, gap, colour, font and divider comes from PRD FR-66 to FR-72 and design spec Part B §5, §10, §12 to §14, verbatim, per state.
- **Health bar:**
  - **Container:** 474×8, radius 4, `overflow: hidden`.
  - **Segments:** square-cornered, separated by 2 px gaps, in the order alert `#C62828` → offline hatch → healthy `#15803D`. Zero-count segments are omitted.
  - **Widths:** `(474 − 2·(k − 1)) × count / total`. The expected values in FR-69 must hold to ±1 px (for example, Bins 201.43 / 67.14 / 201.43).
  - **Inputs:** widths come from `rows[].alerts`, `rows[].offline` and `rows[].healthy`, never parsed from the caption.
- **Offline hatch:** the verbatim FR-70 17-stripe `linear-gradient(43.841deg, …)`. The `repeating-linear-gradient` approximation is allowed only if it passes the Fidelity check.
- **Caption:** `rows[].caption`, verbatim. Digit runs are Roboto 700 `#111827`; words and ` · ` are Roboto 400 `#4B5563`, 14 px, 6 px below the bar. Nothing is pluralised, summed or reformatted (FR-94).
- **Dividers:** per state, drawn exactly as in each frame (FR-68).
- **Links:**
  - A row opens `paths.equipment({ type: typeKey })`, and `View All` opens `paths.equipment()`.
  - Both are reachable with Tab and work with Enter.
  - The FR-58 focus ring and `cursor: pointer` show nothing at rest.
  - Every `<img>` has explicit `width`/`height`, and icons use the existing Figma SVGs unmodified (AD-5).
- **Loading and error:** the Story 2.2 `SectionState` at the card's final size, so there is no layout shift.
- **Unchanged:** every earlier Fidelity check (Login, Forgot Password, Header/profile, Dashboard layout, KPI strip).

**Ask First:** a value not found in the PRD or design spec; token, font or baseline changes; new copy; a new icon export.

**Never:** other cards' contents (Stories 2.5 to 2.8); tooltips (AD-14); computing or formatting a displayed value; responsive CSS; `react-router-dom`; a second fetch.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full | `demo`, `/dashboard` | `Equipment (20)` / `Health by type` + `View All`. Rows `Bins 7`, `Piles 3`, `Flats 2`, `Tanks 6`, `Dryers 2` with FR-69 widths and verbatim captions | N/A |
| Hatch | Full Bins | An offline segment at x 203.43, width 67.14, with the FR-70 hatch | N/A |
| Small | `?state=small` | `Equipment (2)`; `Bin 1` all alert (474) `1 alert`; `Dryer 1` all healthy (474) `1 healthy` | N/A |
| All-good | `?state=allgood` | `Equipment (1)`; `Bin 1` all healthy `1 healthy`; divider as drawn | N/A |
| Geometry | `healthSegments` unit tests | Every FR-69 row ±0.01; a total of 0 gives no segments, with no `NaN` | Empty bar |
| Navigation | Click or Enter on a row or `View All` | `/equipment?type=<typeKey>` or `/equipment` | Placeholder page |
| Loading / error | Latency or `?__fail=dashboard` | Story 2.2 placeholder or error at the card size | Retry via the layout |
| Fidelity | Each state at 1366 px | The card region screenshot is within 0.5% of the 1× Figma render; rows, bars, segments and text are within ±1 px; copy is exact | Windows advisory, macOS authoritative |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:868-952`: FR-65 to FR-72.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:718-769` (Part B §5 Equipment card), plus §10, §12 to §14 for state differences, typography, assets and readings.
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md:285-290` (§B `equipmentCard.*`, `rows[]`), plus the JSON at `:350-357` (Full) and `:441-445` (Small).
- `src/pages/Dashboard/DashboardPage.jsx`: the Equipment section slot. `src/ui/CardShell.jsx` (header plus View All). `src/ui/SectionState.jsx`.
- `src/lib/paths.js` `equipment({ type })`. `src/lib/fid.js` `equipmentCard.*`. `src/lib/dashboardLayout.js` `FRAME[state].equipment`.
- `src/assets/icons/chevron-right.svg` and the existing View All chevron.
- `figma-reference/1x/dashboard-{full,small,allgood}-*.raw-1374x*.png`: crop the card region at test setup with the alignment check. The committed renders are never edited.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/geometry.js`: `healthSegments()`, pure, the FR-69 formula, returning `{ kind, x, width }[]`.
- [ ] `src/features/dashboard/equipment/EquipmentCard.jsx` and `.module.css`: rows, Health bar, hatch, caption digit-run styling, dividers per state, row links, and `data-fid`.
- [ ] `src/pages/Dashboard/DashboardPage.jsx`: the Equipment section renders `EquipmentCard` when ready.
- [ ] `src/lib/fid.js`: add only the missing Equipment node ids.
- [ ] `tests/unit/geometry.test.js` and `tests/unit/equipment-card.test.jsx`: every I/O-matrix row except Fidelity, plus a check that no value is formatted.
- [ ] `tests/fidelity/equipment-card.spec.js` and `expected/equipment-card.json`: per-state card screenshot against the cropped Figma render (≤ 0.5%), the ±1 px audit of rows, bars and segments, and the copy audit.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except the already-recorded Windows screenshot advisories, and all earlier Fidelity checks are unchanged.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

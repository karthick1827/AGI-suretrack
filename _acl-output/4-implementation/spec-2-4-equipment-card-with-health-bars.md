---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-09T09:19:23.543Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
spec_approved_by: Manager (via Markdown Studio)
spec_approved_at: 2026-11-09T06:26:31.562Z
title: 'Story 2.4 — Equipment card with Health bars'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
baseline_commit: 'fc6e3f482c15d6b1a4d442aed4d9397e042e3255'
implementation_status: done
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

- 2026-11-09 — **Row spacing follows the Figma frames (Manager to confirm):** the PRD row rule (padding 12/8, each border 1 px) puts Full rows 2–4 about 2 px lower than the Full frame, which fails ±1 px. The rows match the frames instead:
  - The list is pulled out 1 px on the top, left and right, because Figma's card border takes no layout space.
  - Full rows 2–4 (Figma "Item" wrappers) use padding 10/10.
  - Plain bordered rows (Full row 5, Small row 2, All-good row 1) use padding-right 1 px, because every frame draws their bar at x 129.

  Each value is explained in the CSS and pinned by the tests.
- 2026-11-09 — **Pixel check on Windows (developer decision, Manager to confirm):** the card screenshot differs from the cropped Figma render on Windows by:
  - Full: **0.758%**.
  - Small: **0.889%**.
  - All-good: **0.804%**.

  The limit is **0.5%**. About 1,110 to 1,180 pixels per state come from the card header text: Story 2.2's header uses SF Pro, which Windows doesn't have, so it draws Inter. Without the header the card is at 0.345% / 0.155% / 0.084%. Every ±1 px, style, copy, hover, focus and navigation check passes. The limit stays 0.5%, and **macOS CI is authoritative**.
- 2026-11-09 — **Caption digit weight:** `tokens.css` has no 700 token, so the caption digits use a raw `700`, as the KPI strip already does. Adding a bold token is a token change (Ask First). **Manager to decide** whether to add one.
- 2026-11-09 — **Review loop 1 (patches only):**
  - **Overflow:** extra rows are clipped inside the card body and never drawn over the header. Full centring uses `safe center`.
  - **Hover:** the row hover fill stays inside the card border. The focus ring is checked for clipping on all four sides.
  - **Data guards:**
    - A row with no usable name is not a link.
    - A numeric caption renders as text.
    - A ready card with no usable rows shows the error state.
    - Counts must be non-negative integers.
    - For a duplicate type, the first row wins.
  - **Page:** every section gets `variant`, and an unknown variant falls back to Full.
  - **Tests:**
    - Per-row padding is asserted on all four sides.
    - The card has its own crop references.
    - Clear errors replace crashes in the test helpers.
    - Behavioural checks replace the brittle source-text checks.
    - A pixel test covers hover.
    - A test confirms 7 rows stay inside the card.
  - **KEEP:** the visuals at rest are unchanged (the same pixel counts before and after) and the copy is verbatim.

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

## Implementation Review (Story 2.4)

**Result:**
- **Commits:** `39a2f6a` and `a41416c` on `feature/2-4-equipment-card`.
- **Lint and build:** `npm run lint` is clean and `npm run build` succeeds.
- **Unit tests:** `npm test` passes **863/863**.
- **Fidelity check:** `npm run test:fidelity` passes **68/76**. The 8 failures are all Windows screenshot comparisons:
  - Equipment card: Full 0.758%, Small 0.889%, All-good 0.804%.
  - The five recorded earlier: Header, Forgot modal, and KPI Full, Small and All-good.

  macOS CI is authoritative.

### Acceptance Criteria Checklist

- [x] **Header (FR-66):** `Equipment (20)` / `Health by type` with `View All` and the chevron.
- [x] **Rows (FR-67/FR-68):** `Bins 7`, `Piles 3`, `Flats 2`, `Tanks 6`, `Dryers 2`, with dividers per state, within ±1 px of each frame.
- [x] **Health bars (FR-69):** Bins 201.43 / 67.14 / 201.43; Piles 157.33 / 314.67; Flats and Dryers 474; Tanks 78.67 / 393.33. All within ±1 px.
- [x] **Colours and hatch (FR-70):** alert `#C62828`, healthy `#15803D`, and the verbatim 17-stripe offline hatch.
- [x] **Captions (FR-71):** verbatim, with the digit runs bold.
- [x] **Small and All-good:** `Equipment (2)` with `Bin 1` all alert and `Dryer 1` all healthy; `Equipment (1)` with `Bin 1` all healthy.
- [x] **Navigation (FR-72):** rows open `/equipment?type=<typeKey>` and View All opens `/equipment`, with mouse and keyboard.
- [ ] **Card screenshot ≤ 0.5%:** pending macOS. Windows is advisory (see the Change Log).

### Review Findings

- **Patched (14):** listed in the Spec Change Log above.
- **Deferred (1):** a minimum visible width for a tiny non-zero segment (needs an FR-69 change), in [deferred-work.md](deferred-work.md).
- **Rejected:**
  - Text ellipsis or truncation: it risks the Figma visuals.
  - Removing the Figma-matching 1 px row offsets.
  - The `Number.MAX_VALUE` empty bar.
  - The "pixel ratio not asserted" concern: snapshots point at the cropped Figma baselines.

## Suggested Review Order

**Equipment card**

- Rows, the Health bar, the hatch, the caption digit runs, row links and guards.
  [`EquipmentCard.jsx:1`](../../src/features/dashboard/equipment/EquipmentCard.jsx#L1)
- Figma-matching row offsets, the overflow clip, and the states block (hover and focus).
  [`EquipmentCard.module.css:1`](../../src/features/dashboard/equipment/EquipmentCard.module.css#L1)
- The FR-69 formula (pure).
  [`geometry.js:1`](../../src/lib/geometry.js#L1)
- The usable-rows rule shared by the page and the card.
  [`equipmentRows.js:1`](../../src/features/dashboard/equipment/equipmentRows.js#L1)
- Sections always receive `variant`.
  [`DashboardPage.jsx:1`](../../src/pages/Dashboard/DashboardPage.jsx#L1)

**Tests**

- FR-69 values and edge cases.
  [`geometry.test.js:1`](../../tests/unit/geometry.test.js#L1)
- The I/O matrix and guards.
  [`equipment-card.test.jsx:1`](../../tests/unit/equipment-card.test.jsx#L1)
- Screenshot, ±1 px audit, padding, hover, focus, overflow and navigation.
  [`equipment-card.spec.js:1`](../../tests/fidelity/equipment-card.spec.js#L1)

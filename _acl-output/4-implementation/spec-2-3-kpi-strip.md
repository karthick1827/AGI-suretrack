---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-09T05:52:11.735Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 2.3 — KPI strip'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
story_key: 2-3-kpi-strip
jira: SCRUM-37
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-2-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Dashboard's KPI slot (Story 2.2) is an empty box. Customers can't see at a glance how much needs attention, how much Equipment they have per type, what is online or offline, or how many fans are running. Nothing on the strip can be clicked.

**Approach:**
- Build `KpiSection` inside the existing `{ status, data, onRetry }` contract (AD-18), filling the slot at 24, 136, 1318×90.
- Draw the strip shell (FR-59) and five KPI tiles (FR-60 to FR-63) at exact per-state widths and x positions, for Full `6215:58878`, Small `6864:4514` and All-good `6879:15603`.
- Render the values verbatim from `doc.kpi` (FR-94, AD-7), with the six exported KPI SVG icons.
- Make each tile and each Equipment sub-count block a separate link through `paths.js` (FR-64), with no visual change.

## Boundaries & Constraints

**Always:**
- **Exact values:** every size, x position, padding, gap, colour, radius, shadow, font and icon comes from PRD FR-59 to FR-64 and design spec Part B §3, §10, §12 to §14, verbatim, per state.
  - The strip renders radius 12 with `box-shadow: 0px 2px 4px 0px rgba(39,39,39,0.15)`.
  - Tiles have padding 12/20 and gap 14. Every tile except the first has a `#E6E8EB` left divider.
- **Per-state differences, as drawn:**
  - All-good uses the tick icon `kpi_tick.svg` (20×20) on `#EAF8EF`, with a grey Regular label. Full and Small use `kpi_alert.svg` on `#FDECEC`, with a `#C62828` Bold label.
  - Breakdown numbers are Regular (400) in Full and Bold (700) in Small and All-good, driven by `kpi.equipment.subCountWeight`.
  - Tile widths and x positions follow FR-61 to FR-63 (for example, Full Equipment 500 at x 264; All-good tiles grouped at x 552 with gap 20).
- **Data:** numbers and labels are the JSON display values verbatim. Nothing is computed, summed, pluralised or reformatted, and `7 of 24` is kept as a string. The Q-K1 mismatches are kept as is.
- **Links:** routes come only from `paths.js`: `alerts()`, `equipment()`, `equipment({ type })`, and `equipment({ status })`. Every target renders the FR-57 placeholder. Tiles are reachable with Tab in visual order and activated with Enter.
  - The FR-58 focus ring and `cursor: pointer` show nothing at rest.
- **Loading and error:** loading and error use the Story 2.2 `SectionState` at the strip's final size, so there is no layout shift.
- **`data-fid`:** `FID.kpi.strip` moves from the slot onto the strip element. The icon fids are added.
- **Unchanged:** the Login, Forgot Password, Header/profile and Dashboard-layout Fidelity checks.

**Ask First:** a value not found in the PRD or design spec; token, font or baseline changes; new copy; a new icon export.

**Never:** the card contents (Stories 2.4 to 2.8); tooltips (AD-14); computing values; responsive CSS; `react-router-dom`; a second fetch.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full | `demo`, `/dashboard` | `7` `Need attention · 2 critical` (red); `20` `Equipment` with `7 Bins` `3 Piles` `2 Flats` `6 Tanks` `2 Dryers` (Regular); `16` `Online`; `4` `Offline`; `7 of 24` `Fans running now` | N/A |
| Small | `?state=small` | `1` `Need attention · 1 critical`; `2` `Equipment` (`1 Bin`, `1 Dryer`, Bold); `2` `Online`; `0` `Offline`; `2 of 3` | N/A |
| All-good | `?state=allgood` | `0` `Need attention · all good` with the green tick and a grey label; `1` `Equipment` (`1 Bin`, Bold); `1` `Online`; `0` `Offline`; `2 of 3` | N/A |
| Navigation | Click or Enter on a tile | Need attention → `/alerts`; Equipment → `/equipment`; a sub-count → `/equipment?type=<typeKey>`; Online/Offline → `/equipment?status=online` or `offline`; Fans → `/equipment` | Placeholder page |
| Keyboard | Tab through the strip | Tiles and sub-counts in visual left-to-right order | N/A |
| Loading / error | Latency or `?__fail=dashboard` | Story 2.2 placeholder or error at 1318×90 | Retry via the layout |
| Fidelity | Each state at 1366 px | The strip region screenshot is within 0.5% of the 1× Figma render; every tile, icon and text box is within ±1 px; copy is exact | Windows advisory, macOS authoritative |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:787-857`: FR-59 to FR-64. `:207` FR-5 KPI shadow.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:662-699` (Part B §3 KPI strip), plus §10, §12 to §14 for state differences, typography, assets and readings.
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md:261-283` (§B): `kpi.*` keys, `allGood`, `subCountWeight`, `breakdown[].typeKey`.
- `src/pages/Dashboard/DashboardPage.jsx`: the `KpiSection` slot (already takes `{ status, data, onRetry }`).
- `src/ui/SectionState.jsx`: the loading and error states.
- `src/lib/paths.js`: `alerts()` and `equipment({ type | status })`. `src/lib/fid.js` `kpi.*`. `src/lib/dashboardLayout.js` `FRAME[state].kpi`.
- `src/assets/icons/kpi_{alert,tick,equip,online,offline,fans}.svg`.
- `figma-reference/1x/dashboard-{full,small,allgood}-*.raw-1374x*.png`: crop the KPI strip region at test setup. The committed renders are never edited.

## Tasks & Acceptance

**Execution:**
- [ ] `src/features/dashboard/kpi/KpiStrip.jsx` and `.module.css`: the strip shell, five tiles, per-state widths and x positions, icons, verbatim values, and per-tile links with `data-fid`.
- [ ] `src/pages/Dashboard/DashboardPage.jsx`: `KpiSection` renders `KpiStrip` when ready, and `SectionState` otherwise. Move `FID.kpi.strip` onto the strip.
- [ ] `src/lib/fid.js`: add only the missing KPI node ids.
- [ ] `tests/unit/kpi-strip.test.jsx`: every I/O-matrix row except Fidelity, plus a check that no value is formatted.
- [ ] `tests/fidelity/kpi-strip.spec.js` and `expected/kpi-strip.json`: per-state strip screenshot against the cropped Figma render (≤ 0.5%), the ±1 px measurement audit and the copy audit.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except the already-recorded Windows screenshot advisories, and all earlier Fidelity checks are unchanged.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-09T10:09:05.598Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 2.6 — Fan activity card with Runtime chart'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
story_key: 2-6-fan-activity-card-with-runtime-chart
jira: NEW
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-2-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Fan activity card (Story 2.2) shows only its shell and header. Customers can't see how many fans are running, today's runtime and energy, or how runtime has trended over the week.

**Approach:**
- Fill the Fan activity card (426×326) inside the existing `{ status, data, onRetry, variant }` section contract (AD-18), for Full `6215:58878`, Small `6864:4514` and All-good `6879:15603`.
- Render the three Stat tiles (FR-79).
- Render the 7-day Runtime chart (FR-80, FR-81). Its geometry comes from a new pure `geometry.runtimeBars()` (AD-8): bar heights are exactly `barPx` (0 px tolerance, AD-14), with the PRD fallback formula when `barPx` is absent.
- Render the verbatim caption (FR-82).
- The card is display-only, with no links.

## Boundaries & Constraints

**Always:**
- **Exact values:** every size, position, gap, colour, radius and font comes from PRD FR-78 to FR-82 and design spec Part B §7, §10, §12 to §14, verbatim, per state.
- **Stat tiles:** three tiles of about 118 px with 16 px gaps in a 386 px row. Background `#F4F5F6`, radius 8, padding 8/10. The value uses the SF stack 590 16/1.5 in a 20 px box, `#111827`. The label uses SF 400 12/1.5 in a 17 px box, `rgba(0,0,0,0.8)`. Values and labels are verbatim from `fanActivity.tiles`; Q-N1 contradictions are kept.
- **Runtime chart:**
  - **Area:** 386×119 in Full, 386×120 in Small and All-good. No axes or gridlines.
  - **Columns:** 7 columns of 55.14 px, each 103 high, bottom-aligned on one baseline.
  - **Bars:** 24 wide, radius `5px 5px 2px 2px`, fill `#0B7A3B` (`isToday` bar `#0A5C30`). Bar x offsets: 15.57, 70.71, 125.86, 181.00, 236.14, 291.29, 346.43.
  - **Heights:** exactly `barPx`: Wed 54, Thu 61, Fri 66, Sat 72, Sun 68, Mon 79, Today 76. The fallback when `barPx` is missing is `round(hours / max(hours) × 79)`.
- **Labels:**
  - **Value label:** `String(hours) + "h"`, the one display string the PRD defines as derived from a chart number (PRD addendum §B). It sits 18 px above the bar top, Roboto 400 12 `#4B5563`.
  - **Day label:** padding-top 5, Roboto 400 12 `#4B5563`; the `isToday` label is Roboto 700 12 `#111827`.
- **Accessibility:** the chart has the accessible name `fanActivity.chartLabel`, verbatim.
- **Caption:** padding-top 12, SF 400 12/1.5 `rgba(0,0,0,0.8)`, wrapping to 2 lines, verbatim.
- **Guards (as in Stories 2.3 to 2.5):**
  - Only strings and finite numbers render.
  - Fewer or more than 7 chart entries, or non-finite hours, never produce `NaN` or a crash.
  - A ready slice with no usable tiles or chart shows the Story 2.2 error state.
  - Font weights use tokens where one exists; there is no 700 token, so a raw 700 with a comment.
  - No `::after` overlays.
- **Loading and error:** the Story 2.2 `SectionState` at the card's size, so there is no layout shift.
- **Unchanged:** every earlier Fidelity check.

**Ask First:** a value not found in the PRD or design spec; token, font or baseline changes; new copy; a new icon export.

**Never:** other cards' contents (Stories 2.7 and 2.8); tooltips or hover values on bars (AD-14); links; any change to the bar heights other than `barPx`; responsive CSS; `react-router-dom`; a second fetch.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full and Small | `demo` or `?state=small` | `Fan activity` / `All storage fans`; tiles `7` Running Now, `86 h` Runtime Today, `410 kWh` Energy Today | N/A |
| All-good | `?state=allgood` | Tiles `2 of 3`, `7 h 24 m`, `38 kWh` | N/A |
| Chart | Any state | Bars 54/61/66/72/68/79/76 px (exact) at the FR-80 x offsets; value labels `62h` to `86h`; `Today` bold and `#0A5C30` | N/A |
| Fallback | `runtimeBars` with no `barPx` | `round(hours / max × 79)`; max 0 or non-finite → 0 px bars, no `NaN` | Zero-height bar |
| Caption | Any state | `Runtime hours, last 7 days. Higher this week as Auto modes used the cool nights.` on 2 lines | N/A |
| Accessibility | Chart | Name `Fan runtime hours for the last 7 days, from 62 to 90 hours` | N/A |
| Bad data | Missing tiles or chart, wrong lengths, objects as values | No crash; the section error when nothing usable remains | Story 2.2 error |
| Loading / error | Latency or `?__fail=dashboard` | Story 2.2 placeholder or error at the card size | Retry via the layout |
| Fidelity | Each state at 1366 px | The card region screenshot is within 0.5% of the 1× Figma render; bars are 0 px from `barPx`; other boxes are within ±1 px; copy is exact | Windows advisory, macOS authoritative |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md` §4.8: FR-78 to FR-82 and notes Q-N1/Q-N2.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:802-` (Part B §7 Fan activity card), plus §10, §12 to §14.
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md:298-300, 323` (§B `fanActivity.*`, `barPx`) and `:609-619` (B.8 expected chart results).
- `src/lib/geometry.js`: add `runtimeBars()` next to `healthSegments()`.
- `src/features/dashboard/equipment/EquipmentCard.jsx`, `equipmentRows.js` and `src/features/dashboard/alerts/alertItems.js`: guard and content-rule patterns.
- `src/pages/Dashboard/DashboardPage.jsx` (the Fan activity slot), `src/ui/CardShell.jsx`, `src/ui/SectionState.jsx`, `src/lib/dashboardLayout.js` `FRAME[state].fanActivity`, `src/lib/fid.js`.
- `figma-reference/1x/dashboard-{full,small,allgood}-*.raw-1374x*.png`: crop the card at test setup through `writeCroppedBaseline` with its own references constant. The committed renders are never edited.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/geometry.js` `runtimeBars(chart)`: pure, returns `{ day, hours, isToday, x, height }[]`, with `barPx` first and the formula as the fallback.
- [ ] `src/features/dashboard/fan/FanActivityCard.jsx` and `.module.css`: Stat tiles, Runtime chart, labels, caption and `data-fid`.
- [ ] `src/pages/Dashboard/DashboardPage.jsx`: the Fan activity section renders `FanActivityCard` when ready, with a content rule.
- [ ] `src/lib/fid.js`: add only the Fan activity node ids documented in the PRD or design spec.
- [ ] `tests/unit/geometry.test.js` (`runtimeBars`) and `tests/unit/fan-activity-card.test.jsx`: every I/O-matrix row except Fidelity, plus a check that only the PRD-defined `<hours>h` label is derived.
- [ ] `tests/fidelity/fan-activity-card.spec.js` and `expected/fan-activity-card.json`: per-state card screenshot against the cropped Figma render (≤ 0.5%), bar heights at 0 px, the ±1 px audit, and the copy audit.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except the already-recorded Windows screenshot advisories, and all earlier Fidelity checks are unchanged.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

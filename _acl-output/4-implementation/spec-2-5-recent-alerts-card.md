---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-09T09:20:47.741Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 2.5 — Recent Alerts card'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
baseline_commit: 'aad8f5ffc9e65a6c89c8a4fd213bfbaa0b888aa1'
implementation_status: in-progress
story_key: 2-5-recent-alerts-card
jira: SCRUM-38
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-2-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Recent Alerts card (Story 2.2) shows only its shell and header. Customers can't see their most urgent alerts or jump to what to do next. The All-good state has no reassuring Empty state.

**Approach:**
- Fill the Recent Alerts card inside the existing `{ status, data, onRetry, variant }` section contract (AD-18), for Full `6215:58878`, Small `6864:4514` and All-good `6879:15603`.
- Render `recentAlerts.items[]` in file order as Alert rows (FR-74, FR-76). Each row has a severity icon, title, `<deviceId> | <location>` meta line, severity text, time and Action link.
- Add the two links: the Action link opens `paths.alertAction(deviceId, actionKey)`, and the rest of the row opens `paths.equipmentDetail(deviceId)` (FR-75).
- Show the FR-77 Empty state when `items` is empty.

## Boundaries & Constraints

**Always:**
- **Exact values:** every size, position, gap, colour, font, separator and icon comes from PRD FR-73 to FR-77 and design spec Part B §6, §10, §12 to §14, verbatim, per state.
- **Severity:**
  - Critical: `alert_crit.svg` in a 20 px `#DC2626` circle, with `#DC2626` text.
  - Warning: `alert_warn.svg` in a 20 px `#FFA526` circle, with `#D97706` text.
  - `severity` selects both the icon and the colour. An unknown severity renders no icon and neutral text, and never crashes.
- **Action link:** `#005C2F` text with `arrow_right.svg` (stroke 1.33).
- **Data:**
  - Rows appear in file order, with at most 4 shown.
  - Titles, times, severities and actions are verbatim, including the `Missing Fan Switched` typo and the mixed device-ID lengths (Q-A3).
  - Nothing is computed, refreshed or reformatted. Relative time is not refreshed (Q-A2 not built).
- **Small and All-good:**
  - Small shows the one `HotSpot Detected` row and keeps its bottom border as drawn.
  - All-good shows the Empty state: `#F4F5F6`, radius 12, padding 32/18, 134 high, the title `No Alerts Right Now` (Roboto 700 16) and the body copy with U+2019 (Roboto 400 14/20.3, width 377, wrapping after "tanks.").
- **Links:**
  - The Action link and the row link are separate `<a>` elements, with no link inside another link and no `::after` overlays. Both are reachable with Tab and work with Enter.
  - The FR-58 hover (`#F0FFF8` row, underlined Action text) and the focus ring show nothing at rest. Hover stays inside the card border.
  - Every link has a usable accessible name.
  - Every `<img>` has explicit `width`/`height`, and Figma SVGs are used unmodified (AD-5).
- **Guards (as in Stories 2.3 and 2.4):** only strings and finite numbers render. An item with no usable `deviceId` or `actionKey` is not a link. Items with a duplicate `id` keep the first. A ready slice with no usable `items` array shows the Story 2.2 error state, while an empty array shows the Empty state.
- **AD-14:** no tooltips. Dryer alerts, when present in data, render as ordinary Alert rows.
- **Unchanged:** every earlier Fidelity check.

**Ask First:** a value not found in the PRD or design spec; token, font or baseline changes; new copy; a new icon export.

**Never:** other cards' contents (Stories 2.6 to 2.8); relative-time refresh or absolute-time tooltips (Q-A2); responsive CSS; `react-router-dom`; a second fetch.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full | `demo`, `/dashboard` | `Recent Alerts` / `Most urgent first. Each item links to what to do next.` + `View All`. Four rows in file order: HotSpot Detected (Critical, 30 mins ago, View Hotspot), Static Pressure (Critical, 2 hours ago, Check Fans), No Communication (Warning, 3 hours ago, Check Connection), Missing Fan Switched (Warning, 1 day ago, Check Fan Switches) | N/A |
| Small | `?state=small` | Only the `HotSpot Detected` · `759 \| Wheat Storage` row, with its bottom border as drawn | N/A |
| All-good | `?state=allgood` | The FR-77 Empty state; the header and `View All` remain | N/A |
| Action link | Click or Enter on `View Hotspot` | `/equipment/759/hotspot` | Placeholder page |
| Row link | Click on the row outside the Action link | `/equipment/759` | Placeholder page |
| View All | Click or Enter | `/alerts` | Placeholder page |
| Bad data | Unknown severity, missing `deviceId`, duplicate `id`, more than 4 items | No crash; no unnamed link; first `id` wins; at most 4 rows | Non-link row |
| Loading / error | Latency or `?__fail=dashboard` | Story 2.2 placeholder or error at the card size | Retry via the layout |
| Fidelity | Each state at 1366 px | The card region screenshot is within 0.5% of the 1× Figma render; rows, icons, text and the Empty state are within ±1 px; copy is exact | Windows advisory, macOS authoritative |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:953-1017`: FR-73 to FR-77 and notes Q-A1 to Q-A3.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:770-801` (Part B §6 Recent Alerts card), plus §10, §12 to §15.
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md:263, 292-297` (§B `recentAlerts.*`, `items[]`, `actionKey`, `empty`).
- `src/features/dashboard/equipment/EquipmentCard.jsx` and `equipmentRows.js`: the patterns to follow (guards, usable-rows rule, links, hover inside the border, focus ring).
- `src/pages/Dashboard/DashboardPage.jsx` (the Recent Alerts slot), `src/ui/CardShell.jsx`, `src/ui/SectionState.jsx`.
- `src/lib/paths.js` `alertAction()`, `equipmentDetail()`, `alerts()`. `src/lib/fid.js` `recentAlerts.*`. `src/lib/dashboardLayout.js` `FRAME[state].recentAlerts`.
- `src/assets/icons/alert_crit.svg`, `alert_warn.svg`, `arrow_right.svg`.
- `figma-reference/1x/dashboard-{full,small,allgood}-*.raw-1374x*.png`: crop the card at test setup through `writeCroppedBaseline` with its own references constant. The committed renders are never edited.

## Tasks & Acceptance

**Execution:**
- [ ] `src/features/dashboard/alerts/RecentAlertsCard.jsx` and `.module.css`: Alert rows, severity icons and colours, separators per state, the Action link and row link, and the Empty state, with `data-fid`.
- [ ] `src/pages/Dashboard/DashboardPage.jsx`: the Recent Alerts section renders `RecentAlertsCard` when ready.
- [ ] `src/lib/fid.js`: add only the missing Recent Alerts node ids.
- [ ] `tests/unit/recent-alerts-card.test.jsx`: every I/O-matrix row except Fidelity, plus a check that no value is formatted.
- [ ] `tests/fidelity/recent-alerts-card.spec.js` and `expected/recent-alerts-card.json`: per-state card screenshot against the cropped Figma render (≤ 0.5%); the ±1 px audit of rows, icons and the Empty state; the copy audit; real pointer clicks and the Tab order.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except the already-recorded Windows screenshot advisories, and all earlier Fidelity checks are unchanged.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

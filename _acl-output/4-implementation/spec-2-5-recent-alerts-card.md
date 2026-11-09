---
status: In Review
spec_approved_by: Manager (via Markdown Studio)
spec_approved_at: 2026-11-09T09:20:47.741Z
title: 'Story 2.5 — Recent Alerts card'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
baseline_commit: 'aad8f5ffc9e65a6c89c8a4fd213bfbaa0b888aa1'
implementation_status: review
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

- 2026-11-09 — **Values follow the Figma frames (Manager to confirm):** these four differ from the PRD by more than ±1 px, so they follow the frames. Each is explained in the CSS.
  1. **Separator:** drawn as the bottom pixel of the 8 px track. The frames show a 78 px detail column and a 90 px row pitch, whereas the PRD's 8 px padding plus a 1 px border gives 79 px.
  2. **Critical glyph:** centred in its 20 px circle. The PRD's padding 3.333 with a 15 px glyph doesn't fit.
  3. **Last row:** the last of two or more rows drops its invisible 8 px padding along with its separator, so four Full rows fill the 340 px content exactly.
  4. **Empty-state height:** 134 px, as measured. Its natural height would be 133.35.
- 2026-11-09 — **Meta-line format:** `copy.js` gains `dashboard.alertMeta` = `{deviceId} | {location}`, the PRD FR-74 / addendum §B format verbatim. No new wording.
- 2026-11-09 — **Pixel check on Windows (developer decision, Manager to confirm):** the card screenshot differs from the cropped Figma render on Windows by:
  - Full: **2.299%**.
  - Small: **1.979%**.
  - All-good: **1.765%**.

  The limit is **0.5%**. With only the text boxes masked, the difference is 0.126% / 0.122% / 0.044%, so the cause is text rendering: the SF Pro header falls back to Inter on Windows, and Roboto rasterises differently. Every ±1 px, style and copy check passes. The limit stays 0.5% and **macOS CI is authoritative**. This card is text-heavy, so the macOS run matters most here.
- 2026-11-09 — **Review loop 1 (patches only):**
  - **Rows per frame:** Full 4, Small 1 and All-good 1. Rows the frame can't show are not rendered, so no hidden link can take focus.
  - **Data guards:**
    - A numeric `deviceId` is converted to text.
    - The Action is drawn only as a working link. There is no lone arrow or fake link.
    - Whitespace-only texts don't name a link.
    - `target()` treats only the rejected-input `TypeError` as unroutable.
  - **Empty state:** with no usable title or body it shows the section error, and it never renders a blank heading.
  - **Markup:**
    - The Warning glyph has integer `width`/`height` of 14 (13.846 px in CSS).
    - The row link sets `text-decoration: none` explicitly.
    - The list uses `list`/`listitem` roles.
    - Each Action link is described by its row title.
  - **Tests:**
    - Click and hover points are measured instead of hard-coded, and the crop follows the header height.
    - Blank View All labels can't produce an unnamed link.
    - A cleaner unknown-severity test.
    - A Small 4-item Tab test.
  - **KEEP:** the at-rest visuals are unchanged (the same pixel counts before and after) and the copy is verbatim.

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

## Implementation Review (Story 2.5)

**Result:**
- **Commits:** `a883e2b` and `f0df7ea` on `feature/2-5-recent-alerts`.
- **Lint and build:** `npm run lint` is clean and `npm run build` succeeds.
- **Unit tests:** `npm test` passes **913/913**.
- **Fidelity check:** `npm run test:fidelity` passes **85/96**. The 11 failures are all Windows screenshot comparisons:
  - Recent Alerts: Full 2.299%, Small 1.979%, All-good 1.765%.
  - The 8 recorded earlier: Header, Forgot modal, KPI ×3 and Equipment ×3.

  macOS CI is authoritative.

### Acceptance Criteria Checklist

- [x] **Header (FR-73):** `Recent Alerts` / `Most urgent first. Each item links to what to do next.` + `View All` (→ `/alerts`).
- [x] **Full rows (FR-74/FR-76):** HotSpot Detected, Static Pressure, No Communication and Missing Fan Switched, in file order, with severity, time and Action link verbatim.
- [x] **Severity styling:** critical `alert_crit.svg` in a `#DC2626` circle; warning `alert_warn.svg` in a `#FFA526` circle; text `#DC2626` / `#D97706`; Action `#005C2F` with `arrow_right.svg`.
- [x] **Links (FR-75):** the Action opens `/equipment/<deviceId>/<actionKey>` and the row opens `/equipment/<deviceId>`, with mouse and keyboard. There are no nested links.
- [x] **Small:** the single `HotSpot Detected` row, with its bottom border as drawn.
- [x] **All-good (FR-77):** the Empty state `No Alerts Right Now` with the body copy (’), wrapping after "tanks.".
- [x] **Data:** verbatim; nothing computed, refreshed or formatted.
- [ ] **Card screenshot ≤ 0.5%:** pending macOS. Windows is advisory (see the Change Log).

### Review Findings

- **Patched (14):** listed in the Spec Change Log above.
- **Deferred (1):** Warning text `#D97706` contrast at 12 px (about 3.2:1), for a design decision, in [deferred-work.md](deferred-work.md).
- **Rejected:**
  - Title/meta ellipsis and long-text overflow: this is a fixed canvas, and Figma specifies the title ellipsis.
  - `String(1e21)` formatting.
  - The lone row's separator: as drawn.
  - Safari `overflow-clip-margin`: Chromium is the target.
  - Removing the FR-58 cursor rules.
  - The keyboard-test cost.

## Suggested Review Order

**Recent Alerts card**

- Rows per frame, guards, sibling row and Action links, accessible names and the Empty state.
  [`RecentAlertsCard.jsx:1`](../../src/features/dashboard/alerts/RecentAlertsCard.jsx#L1)
- Frame-matching values, the separator track, hover inside the border and the states block.
  [`RecentAlertsCard.module.css:1`](../../src/features/dashboard/alerts/RecentAlertsCard.module.css#L1)
- The usable-items, rows-per-frame and Empty-state content rules shared with the page.
  [`alertItems.js:1`](../../src/features/dashboard/alerts/alertItems.js#L1)

**Tests**

- The I/O matrix, guards and accessibility.
  [`recent-alerts-card.test.jsx:1`](../../tests/unit/recent-alerts-card.test.jsx#L1)
- The screenshot, ±1 px audit, measured clicks, Tab, hover and focus.
  [`recent-alerts-card.spec.js:1`](../../tests/fidelity/recent-alerts-card.spec.js#L1)

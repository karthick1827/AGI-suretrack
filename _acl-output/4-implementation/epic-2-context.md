---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-08T20:52:21.178Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
---

# Epic 2 Context: Farm status at a glance on the Dashboard

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A signed-in farm customer lands on a Dashboard that rebuilds the Figma frames pixel for pixel: Header, KPI strip, Equipment health, Recent Alerts with Action links, Fan activity, and Grain and Liquid On Hand. There are three Dashboard states: Full `6215:58878` (1366×1052), Small `6864:4514` (1366×860) and All-good `6879:15603` (1366×856). The epic builds on Epic 1's tokens, fonts and assets, the `api.js` data port, `session.js` with `RequireSession`, `paths.js`/`copy.js`/`fid.js`, `OverlayProvider` and the Playwright fidelity harness. It adds the signed-in shell and every Dashboard section.

## Stories

- Story 2.1: Signed-in app shell and Header
- Story 2.2: Dashboard page, Dashboard states and card shells
- Story 2.3: KPI strip
- Story 2.4: Equipment card with Health bars
- Story 2.5: Recent Alerts card
- Story 2.6: Fan activity card with Runtime chart
- Story 2.7: Grain On Hand card
- Story 2.8: Liquid On Hand card

## Requirements & Constraints

- **Verbatim readings:** every shown number or label is the display string from `dashboard.<state>.json`, character for character, including `·` (U+00B7), `’` (U+2019), typos and deliberate contradictions (`7 Need attention · 2 critical`, `79% full` beside `84% Fill`, `Missing Fan Switched`). Components never format, sum, pluralise, re-sort or "fix" a reading. Numeric fields feed only geometry and logic. A unit test must fail if a component computes a shown reading.
- **Page grid:**
  - Header is 0,0 at 1366×64. The title strip is at y 64, 68 px high on `#F3F4F4`. The KPI strip is at 24,136 (1318×90). Content starts at 24,246.
  - Row 1 has two 649-wide cards with a 20 px gap: 444 high in Full, 240 in Small and All-good.
  - Row 2 has three 426×326 cards with 20 px gaps.
  - Bottom space is 16 / 28 / 24 px, taken from `pageBottomSpacePx`, which gives page heights of exactly 1052 / 860 / 856.
- **Card shell:** white, 1 px `#D1D5DB` border, radius 12, padding 20, `drop-shadow(0 2px 2px rgba(39,39,39,0.1))`. Header typography and the `View All` and chevron link follow the shared card-header spec.
- **Loading:** with `VITE_DATA_LATENCY_MS`, every section renders at its final size with a `#F4F5F6` radius-8 block and no animation. Header and title strip render immediately. CLS must be 0.
- **Error:** `?__fail=dashboard` makes each section show `Couldn’t load this section.` plus `Retry`. Retry reloads only the data. Header stays usable and the badge is hidden.
- **Hover and focus:** only the minimal assumed styles apply: `:focus-visible` 2 px `#006A36` outline at offset 2, `#F0FFF8` row hover, underline on link hover, and no layout shift. At-rest renders must be identical with these state styles removed.
- **Fidelity check, per state and region:** ≤0.5% differing pixels, measured elements within ±1 px, exact copy. The Runtime chart has 0 px tolerance. macOS Chromium CI is authoritative; Windows results are advisory. Baselines are Figma 1× exports only; never `--update-snapshots` from the app.
- **Performance:** the Dashboard renders from JSON in ≤300 ms after navigation.

## Technical Decisions

- **Fixed canvas (AD-4):** `min-width: 1366px`, left-aligned. No media queries, `vw`/`vh`/`%` sizing or `clamp()`. Fractional px are written literally in CSS Modules.
- **Tokens and assets:** colours and fonts only through `var(--…)` tokens. SVGs are byte-identical Figma exports rendered as `<img>` with explicit size, never recoloured. The only hand-drawn assets are the 12×16 chevron and the Logout icon, which must be exported from `6026:52937` before Story 2.1. Roboto ships in weights 400–800.
- **Data port only (AD-7):** cards never fetch. `dashboardState.js` resolves the state from `?state`, then the Session's `dashboardState`, then `full`, falling through on unknown values (AD-11). The Dashboard page loads exactly one state document through `api.getDashboard(state)` and passes slices down.
- **Section contract (AD-18):** every section takes exactly `{ status: 'loading'|'ready'|'error', data, onRetry }`. Positions and sizes come only from `src/lib/dashboardLayout.js` `FRAME[state]`, never from content height.
- **Geometry (AD-8):** `src/lib/geometry.js` provides `healthSegments`, `runtimeBars`, `grainSegments` and `liquidSegments`.
  - Rules: these are pure functions. Explicit px in the data (`barPx`, `segmentPx`, `segmentTopPx`) always wins over a formula. Grain widths round to 1.25 px.
  - Callers: only feature components call geometry; ui primitives (`HealthBar`, `RuntimeChart`, `FillBar`) receive finished px.
  - Rendering: plain DOM or SVG, with no chart library and no animation.
  - Tests: unit tests assert every expected px value from the QA table, such as Bins 201.43/67.14/201.43 and bars 54/61/66/72/68/79/76.
- **Conflict resolutions (AD-14):**
  - No chart tooltips and no segment hover style.
  - The Runtime chart uses `barPx` exactly.
  - The profile menu is Figma `6026:52937` with only `My Profile` and `Logout`.
  - Dryer alerts render as ordinary Alert rows.
- **Header (AD-17):** every signed-in page renders one `features/shell` `Header({ activeTab, badge, onBellClick })`. Tab labels and page titles come from `copy.js`; the JSON `header.tabs` and `pageTitle` are not read. The badge comes from `bellBadge`, and the Header holds no data.
- **Navigation (AD-10):**
  - Builders: all links use `paths.js` builders, with no `/` literals in components. `?state=` is preserved only on links back to `/dashboard`.
  - Placeholder routes: Equipment, Alerts, equipment `?type=`/`?status=`, `equipmentDetail(id)` and `alertAction(id, actionKey)` all render `Placeholder`.
- **Copy and mapping:** no literal user-visible text in JSX; strings come from the JSON or `copy.js`. Mapped elements carry `data-fid` values from `fid.js`.
- **Layering:** features never import other features. The page composes them.

## UX & Interaction Patterns

- **Profile menu:** clicking the avatar opens it through `useOverlay()` as kind `menu` (no focus trap; Esc closes it). Logout calls `session.signOut()`, and every tab returns to `/login` within 1 s.
- **Active tab:** `#F0FFF8` background, 4 px `#006A36` underline and a green icon.
- **Interactive elements:** KPI tiles, Equipment rows, `View All` links, Alert rows and Action links are real `<a>`/`<button>` elements with `cursor:pointer`, reachable by Tab in visual order.
- **Alert rows:** the Action link opens `alertAction`; the rest of the row opens `equipmentDetail`.
- **Empty states:** Recent Alerts in All-good, and Liquid in Small and All-good, are driven by `empty` being set together with an empty `items[]`.

## Cross-Story Dependencies

- **Story 2.1 first:** the shell, Header and Placeholder-in-Header come before the rest. It needs the exported Logout icon and Epic 1's `OverlayProvider` and `session.js`.
- **Story 2.2 next:** it supplies `dashboardState.js`, `dashboardLayout.js`, the Dashboard page, `CardShell` and the loading and error wiring that Stories 2.3–2.8 plug into.
- **Geometry:** Stories 2.4 and 2.6–2.8 extend the shared `geometry.js` and its unit tests. Stories 2.7 and 2.8 share the `FillBar` and `LegendItem` primitives.
- **Final check:** Story 2.8 closes the epic with the full-page Fidelity check for all three frames.
- **Epic 3:** Notifications attaches to the Header's `onBellClick` and the overlay `panel` kind.

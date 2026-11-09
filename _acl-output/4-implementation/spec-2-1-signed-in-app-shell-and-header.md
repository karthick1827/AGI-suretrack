---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-08T20:54:10.297Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 2.1 — Signed-in app shell and Header'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
baseline_commit: 'b56840ba2779ee51f779113c7559c007cf7413d9'
implementation_status: in-review
story_key: 2-1-signed-in-app-shell-and-header
jira: NEW
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-2-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** after sign-in the user lands on a bare "Coming soon" placeholder. There is no Header, navigation, bell, avatar menu or Logout, and no shared page canvas for the Dashboard cards.

**Approach:** build the signed-in shell from Figma frame `6215:58878`:
- the 1366 px canvas on `#F3F4F6`;
- the 64 px white Header, with the logo, three Nav tabs (Dashboard active), the bell and badge, and the avatar;
- the 68 px page-title strip on `#F3F4F4` reading `Dashboard`;
- the avatar's profile menu, reproduced from Figma panel `6026:52937` with only `My Profile` and `Logout` (AD-14), wired to `session.signOut()`.

Every signed-in route renders this shell (AD-17). `/dashboard` shows the shell, the title strip and an empty content area until Story 2.2. Equipment and Alerts open the "Coming soon" placeholder inside the shell, with the matching tab active.

## Boundaries & Constraints

**Always:**
- **Exact values:** every value and copy string comes from PRD FR-50 to FR-58, verbatim. The page renders the one `Header` with `{ activeTab, badge, onBellClick }`, and labels come from `copy.js` (AD-17).
- **Assets and layout:** Figma SVGs (`logo.svg`, `widget5.svg`, `garage.svg`, `nav_danger.svg`, `bell.svg`, and the divider kept at opacity 0) are used unmodified. Fixed canvas (AD-4); tokens and CSS Modules only.
- **Badge:** `bellBadge` comes from the resolved state JSON (`2` in all states); the Header itself does no data fetching.
- **Profile menu:** opens through `useOverlay()` with kind `menu`, closes on Esc, outside click or route change, and returns focus to the avatar.
- **Logout:** `signOut()` sends every tab to `/login`. FR-35 says `/login` opens with empty fields and no banner, so a Logout from the menu passes no `from` and no `reason` (this resolves the deferred note from Story 1.3).
- **Baselines (prerequisite):** the 1× Figma exports must exist before the Fidelity check is written. They are exported read-only through the Figma connector:
  - Header `6227:63670` (1366×64) → `figma-reference/header-6227-63670.png`;
  - profile panel `6026:52937` (290×768) → `figma-reference/profile-menu-6026-52937.png`;
  - the Logout icon (from `6026:52937`) → `figma-assets/dashboard/logout.svg`, byte-identical.

**Ask First:** a Figma export that differs in size from its frame; new copy; token, font or Login-baseline changes.

**Never:** Dashboard cards or KPI strip (Stories 2.2+); the Notifications panel (Epic 3; the bell only calls `onBellClick`); hover visuals beyond FR-58; `react-router-dom`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Signed in | `demo`, open `/dashboard` | Header + title strip, Dashboard tab active, badge `2` | N/A |
| Nav | Click `Equipment` or `Alerts` | "Coming soon" placeholder in the shell, matching tab active | N/A |
| Avatar menu | Click avatar | Profile panel (Figma geometry) with `My Profile` + `Logout`; focus inside | Esc or outside click closes; focus returns to avatar |
| Logout | Click `Logout` | Every tab on `/login` within 1 s; empty fields; no banner; Back doesn't return | N/A |
| Signed out | Open `/dashboard` | Redirect to `/login` (Story 1.3 guard) | N/A |
| Fidelity | `/dashboard` at 1366 px; menu open | Header region ≤ 0.5% vs `header-6227-63670.png`; panel ≤ 0.5% vs `profile-menu-6026-52937.png`; ±1 px measurements; exact copy | Windows advisory, macOS authoritative |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:688-792`: FR-50 to FR-58 (canvas and grid, Header, Nav tabs, bell and badge, avatar and Logout, title strip, route protection, placeholder, hover and focus).
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:597-661` (Part B §2): page layout, Header (`6227:63670`, master `6194:35398`) and the title strip. Asset table at `:1046-1087`.
- `src/app/App.jsx`: the routes and `RoutedOverlayProvider`. Wrap the signed-in routes in a `SignedInLayout`.
- `src/pages/Placeholder/`: render it inside the shell.
- `src/lib/session.js`: `signOut()`. `src/lib/dashboardState.js` doesn't exist yet; resolve `bellBadge` via `getDashboard()` with the state order (`?state`, then Session, then `full`).
- `src/ui/overlay/`: `open({ id, kind: 'menu', component, props, trigger })`.
- `tests/fidelity/support/fidelity.js`: reuse the screenshot, measurement and copy audits.

## Tasks & Acceptance

**Execution:**
- [x] Export the 1× Header, the profile panel and the Logout icon from Figma (read-only); copy the icon to `src/assets/icons/logout.svg`.
- [x] `src/lib/dashboardState.js`: `resolveDashboardState(search, session)`, a pure resolver (AD-11).
- [x] `src/features/shell/Header.jsx` and `.module.css`, `NavTabs`, `BellButton`, `AvatarButton`: FR-51 to FR-53 at exact geometry with `data-fid`.
- [x] `src/features/shell/ProfileMenu.jsx` and `.module.css`: FR-54 panel geometry, `My Profile` + `Logout`.
- [x] `src/pages/SignedInLayout.jsx` and `.module.css`: the canvas, the title strip (FR-55) and the outlet.
- [x] `src/app/App.jsx`: signed-in routes inside the layout; `activeTab` derived from the route.
- [x] `tests/unit/shell.test.jsx`: every I/O-matrix row except Fidelity.
- [x] `tests/fidelity/shell.spec.js` and `expected/header.json`: the Header and profile-panel screenshots, measurement and copy audits.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except possible Windows-only screenshot advisories (each recorded with its ratio), and the Login and Forgot Password checks are unchanged.

## Spec Change Log

- 2026-11-09 — **Baseline exports done (pre-implementation):** 1× Figma renders were exported read-only to `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-reference/1x/`:
  - `header-6227-63670.raw-1374x72.png`: the Header **with shadow overflow**. Crop the 1366×64 header at test setup with an alignment check (white header edges), never editing the file.
  - `profile-menu-6026-52937.png`: 290×768, exact.
  - The Dashboard raws (`*.raw-1374x*.png`) and `notifications-8270-44312.png` are for later stories.

  The **Logout icon** is still to be exported, as the first implementation task. Use the Figma connector's `get_design_context` on `6026:52937` (load the figma-design-to-code guidance first) and save it byte-identical to `figma-assets/dashboard/logout.svg` and `src/assets/icons/logout.svg`. If the connector is unavailable, HALT and report.

- 2026-11-09 — **Implementation notes (developer decisions):**
  - **Logout icon:** exported read-only with `get_design_context` on `6026:52937` (asset `0fb0b.svg`, 24×24, stroke `#E05400`) to `figma-assets/dashboard/logout.svg` and `src/assets/icons/logout.svg`, byte-identical (sha256 `54a40714…2c1e1d`).
  - **Profile panel placement:** 290×768 at x 1076, y 64 (below the Header, right edge on the 1366 canvas), so the avatar stays clickable as a toggle. It keeps the Figma geometry: the omitted user block and four entries leave their space empty, so `Logout` stays at panel (26, 379). The Figma close "X" is not rendered (AD-14: title and Logout only). The Fidelity check masks the "X" and the omitted block in both the baseline and the capture, and uses a 1366×832 viewport so the whole panel is captured.
  - **Nav tab underline:** drawn as a 4 px inset box-shadow, not a CSS border. Figma's stroke sits outside the layout, so the icon and label are centred in the full 64 px; a border lifted them 2 px.
  - **Equipment icon:** `garage.svg` already carries opacity 0.7, so only the label is dimmed (the Figma render confirms it). The active Equipment tab uses the same unmodified icon, because no green variant was exported.
  - **Logout without return path:** `signOut()` now notifies same-tab listeners with `{ crossTab: false, signedOut: true }`, and `SessionSync` sends that tab to `/login` with no router state. Other tabs keep `{ from, reason: 'required' }`, which shows no banner.
  - **Pixel check on Windows (advisory):** Header 451 px = **0.516%** against 0.5% (text and icon anti-aliasing at sub-pixel x; every measurement and copy audit passes). Profile panel: passes (0.455% upper bound). Login is unchanged (≤ 0.436%), and Forgot Password is unchanged at the documented 0.70% Windows advisory. macOS CI is authoritative.

- 2026-11-09 — **Review fixes (21 items):**
  - **Dashboard state:** the shell resolves the state once per mount and loads the state document again only when `?state` or the Session's `dashboardState` changes. Child pages get `{ state, status, doc, retry }` through the Outlet context, so Story 2.2 doesn't fetch it again.
  - **Badge:** it shows only positive counts, grows with `min-width`, and is linked to the bell by `aria-describedby`.
  - **Bell:** `aria-disabled` when there is no handler. It has its own positioning wrapper.
  - **Logout:**
    - If removing the Session from storage fails, that record is cancelled in memory, so the tab still goes to `/login`.
    - A second activation is ignored.
  - **Profile menu:**
    - It closes when focus moves outside the panel and the avatar.
    - For a press outside, the `pointerdown` target decides: on a focusable control, focus stays on that control; elsewhere, focus returns to the avatar.
    - The avatar has `aria-controls`, and `aria-expanded` is true while the panel is open.
  - **Paths:** `tabForPath` ignores case.
  - **Header shadow:** it stays a `drop-shadow`. A `box-shadow` was measured and rejected: its rows below the Header were 223/228/236/242, against ≈226/230/235/238 in the Figma render (`drop-shadow` gives 227/230/234/237).
  - **Windows pixel advisories:** unchanged. Header is 0.516% (451 px); Forgot Password is 0.70% (1581 px).

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected exit code 0, except for documented Windows screenshot advisories.

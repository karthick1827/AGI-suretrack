---
title: 'Story 2.1 — Signed-in app shell and Header'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
status: In Review
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
- [ ] Export the 1× Header, the profile panel and the Logout icon from Figma (read-only); copy the icon to `src/assets/icons/logout.svg`.
- [ ] `src/lib/dashboardState.js`: `resolveDashboardState(search, session)`, a pure resolver (AD-11).
- [ ] `src/features/shell/Header.jsx` and `.module.css`, `NavTabs`, `BellButton`, `AvatarButton`: FR-51 to FR-53 at exact geometry with `data-fid`.
- [ ] `src/features/shell/ProfileMenu.jsx` and `.module.css`: FR-54 panel geometry, `My Profile` + `Logout`.
- [ ] `src/pages/SignedInLayout.jsx` and `.module.css`: the canvas, the title strip (FR-55) and the outlet.
- [ ] `src/app/App.jsx`: signed-in routes inside the layout; `activeTab` derived from the route.
- [ ] `tests/unit/shell.test.jsx`: every I/O-matrix row except Fidelity.
- [ ] `tests/fidelity/shell.spec.js` and `expected/header.json`: the Header and profile-panel screenshots, measurement and copy audits.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except possible Windows-only screenshot advisories (each recorded with its ratio), and the Login and Forgot Password checks are unchanged.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected exit code 0, except for documented Windows screenshot advisories.

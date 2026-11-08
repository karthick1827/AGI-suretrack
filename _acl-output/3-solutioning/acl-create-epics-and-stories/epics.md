---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-06T04:51:03.315Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: "AGI SureTrack Farm Web — Login & Dashboard: Epic Breakdown"
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md
  - _acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md
  - _acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md
  - _acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/brief.md
  - _acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md
  - _acl-output/spec-1-5-login-web.md
  - _acl-output/spec-1-27-login-form-validation-successful-login.md
  - _acl-output/spec-1-28-login-failed-login-account-status-connectivity-err.md
  - _acl-output/spec-1-29-forgot-password-or-username-request-reset-link.md
  - _acl-output/spec-1-31-privacy-policy-terms-of-service.md
  - _acl-output/spec-1-37-dashboard-equipment-health-summary.md
  - _acl-output/spec-1-38-dashboard-recent-alerts.md
  - _acl-output/spec-1-39-dashboard-grain-on-hand.md
  - _acl-output/spec-1-40-dashboard-liquid-on-hand-tanks.md
created: "2026-11-05"
updated: "2026-11-05"
---

# AGI SureTrack Farm Web — Login & Dashboard: Epic Breakdown

## Overview

This document breaks AGI SureTrack Farm Web (Login & Dashboard) into epics and implementable stories. It draws on three approved sources: the PRD, the Figma design specification and the architecture spine. Existing Jira stories keep their SCRUM keys; new stories are marked **NEW**.

## Requirements Inventory

### Functional Requirements

*There are 101 FRs from the approved PRD. Each FR's full testable consequences (exact px, hex, font and copy) live in PRD §4 and form the acceptance contract for the story that covers it.*

**PRD §4.1 Design Foundation**

- FR-1: **Colour Design tokens** — The build exposes every colour used by the Figma frames as a named Design token whose value is the exact hex from the addendum, and every coloured element on every screen takes its colour from one of these tokens.
- FR-2: **Spacing, radius and border Design tokens** — The build exposes the Figma spacing, radius and border-width variables as Design tokens and uses them for the elements that Figma binds them to.
- FR-3: **Typography Design tokens (named text styles)** — The build exposes every Figma named text style as a typography Design token (family, weight, size, line-height, letter-spacing) and applies it to the text nodes that use it.
- FR-4: **Font families and loading** — The build renders every text node in the font family and weight Figma specifies, using the brief's resolved font strategy.
- FR-5: **Elevation Design tokens** — The build exposes each Figma shadow as a Design token with the exact CSS listed in the addendum.
- FR-6: **Icons and logo as unmodified Figma SVGs** — Every icon and logo on every screen is the SVG exported from Figma, used unmodified, inline or imported; no icon is a raster image.
- FR-7: **Photographs and raster assets** — Raster images ship only where they are visible, in optimised form, and placed exactly as in Figma.
- FR-8: **Global rendering and copy rules** — Every screen is built to the 1366 px Figma frame with exact values and verbatim copy.
- FR-9: **Minimal styling for undesigned states** — Any interactive state Figma does not draw (focus, hover, error, loading, disabled, modal backdrop) uses the smallest styling built from existing Design tokens and leaves the at-rest appearance identical to the Figma frame.
- FR-10: **Fidelity check** — Each screen can be verified automatically against its Reference render.

**PRD §4.2 Login Page**

- FR-11: **Signed-out access lands on the Login page** — A signed-out user who opens any SureTrack route is shown the Login page, and the route they asked for is remembered.
- FR-12: **Frame and background photo composition** — The Login page reproduces the Figma frame's background: a white frame clipping two mirrored layers of the silo photo.
- FR-13: **Green angled panel** — The Login page shows the semi-transparent green angled panel over the photo exactly as drawn.
- FR-14: **Bottom-right leftover triangle kept as drawn** — The Login page keeps the visible corner of the right overlay.
- FR-15: **Form column layout and logo** — The form column sits on the green panel with the exact vertical rhythm of the Figma auto-layout.
- FR-16: **Title and field labels** — The Login page shows the title and both field labels in the Figma typography.
- FR-17: **Username and Password inputs** — The user can type a username and password into two inputs that look exactly like the Figma rectangles at rest.
- FR-18: **Login button** — The user can submit the form with a white Login button drawn exactly as in Figma.
- FR-19: **"Forgot Password or Username?" link** — The user can open the Forgot Password modal from a link drawn exactly as in Figma.
- FR-20: **Legal text and Privacy Policy / Terms of Service links** — The user can read the legal sentence and open each legal document in a new browser tab.
- FR-21: **Keyboard order and Enter-to-submit** — The user can complete the Login page entirely by keyboard.
- FR-22: **Required-field validation** — The user is told which required field is empty, and nothing is checked against `users.json` until both are filled.
- FR-23: **Submit loading state and double-submit guard** — After a valid submit the Login button shows a loading state and ignores further clicks until the result arrives.
- FR-24: **Dummy authentication against users.json** — The user signs in with a Dummy account from `users.json`; the result follows a fixed order of checks.
- FR-25: **Successful sign-in and redirect** — A user whose Dummy account is valid gets a Session and lands on the Dashboard or on the page they originally requested.
- FR-26: **Wrong credentials** — A user who enters an unknown username or wrong password sees a generic message and can retry immediately.
- FR-27: **Locked account** — A user whose Dummy account is locked is told so, when they can try again (if known), and how to reach SureTrack Coach.
- FR-28: **Inactive account or no active subscription** — A user whose Dummy account is inactive or has no active subscription is not signed in and is told to contact SureTrack Coach.
- FR-29: **Expired password** — A user whose password has expired is told so and can open the Forgot Password modal from the message.
- FR-30: **Too many attempts** — After too many consecutive wrong-credential attempts the user is told when they can try again and the Login button is disabled until then.
- FR-31: **Offline and timeout** — A user whose browser is offline, or whose check does not complete within the timeout, sees a connection or timeout message and can retry.
- FR-32: **Alert banner presentation** — All sign-in errors and the session-expired notice appear in one alert banner above the form that screen readers announce.
- FR-33: **Already signed in** — A user with a valid Session who opens the Login page goes straight to the Dashboard.
- FR-34: **Session expiry** — A user whose Session expires is returned to the Login page on their next action and goes back to the same page after signing in.
- FR-35: **Logout returns to the Login page** — A user who signs out is returned to the Login page in every open SureTrack tab and cannot see their data with Back.

**PRD §4.3 Forgot Password Modal**

- FR-36: **Open the Forgot Password modal** — The user can open the Forgot Password modal over the Login page.
- FR-37: **Modal container** — The modal surface matches the Figma frame's container.
- FR-38: **Header and title** — The modal header shows the title exactly as in Figma.
- FR-39: **Invisible close X kept as drawn** — The close X exists at its Figma position but stays invisible at rest, and still closes the modal.
- FR-40: **Body and intro copy** — The modal body shows the intro copy exactly as in Figma.
- FR-41: **Email field** — The user can type an email address into a required Email field drawn exactly as in Figma.
- FR-42: **Help "?" icon and tooltip** — The user can see a tooltip explaining which email to use by hovering or focusing the help icon.
- FR-43: **Help text and SureTrack Coach number** — The modal shows how to reach SureTrack Coach exactly as in Figma.
- FR-44: **Footer, Cancel and Submit** — The modal footer shows Cancel and Submit exactly as in Figma.
- FR-45: **Email validation** — The user is told when the email is missing or badly formed after leaving the field.
- FR-46: **Submit disabled until the email is valid** — Submit cannot be activated until the email is valid, without changing Submit's drawn appearance.
- FR-47: **Loading and identical confirmation** — A user who submits a valid email sees a loading state and then the same confirmation, whatever the email.
- FR-48: **Close the modal and return focus** — The user can close the modal with Cancel, Esc, a click outside or the close X, and focus returns to the opener.
- FR-49: **Focus management inside the modal** — While the modal is open, keyboard focus stays inside it in a fixed order.

**PRD §4.4 App Shell & Header**

- FR-50: **Page canvas and grid** — The system renders the Dashboard on a fixed 1366 px layout with the exact vertical rhythm of the Figma frame.
- FR-51: **Header container** — The system shows a Header across the top of every signed-in view.
- FR-52: **Nav tabs with active Dashboard tab** — User can see three Nav tabs with the Dashboard tab marked active and can open each tab's page.
- FR-53: **Bell button and badge** — User can open the Notifications panel from the bell, which shows an unread badge.
- FR-54: **Avatar and Logout** — User can open the avatar menu and log out.
- FR-55: **Page-title strip** — The system shows the page title "Dashboard" in its own strip under the Header.
- FR-56: **Route protection (Session required)** — Unauthenticated user is redirected to Login when opening the Dashboard and returned after signing in.
- FR-57: **"Coming soon" placeholder for out-of-scope destinations** — User who follows a link to an out-of-scope page sees a "Coming soon" placeholder inside the app shell.
- FR-58: **Minimal hover and focus behaviour (not designed in Figma)** — User can see which interactive element is under the pointer or has keyboard focus, without the at-rest appearance changing.

**PRD §4.5 KPI Strip**

- FR-59: **KPI strip shell** — The system shows the KPI strip as one white rounded panel.
- FR-60: **KPI tile anatomy (icon tile and text block)** — The system draws each KPI tile with a coloured icon tile and a number-over-label text block.
- FR-61: **Need attention KPI tile** — User can see how many items need attention and the critical count.
- FR-62: **Equipment KPI tile with type breakdown** — User can see total Equipment and the count per equipment type.
- FR-63: **Online, Offline and Fans running KPI tiles** — User can see online and offline equipment counts and how many fans are running.
- FR-64: **KPI tile navigation** — User can open the matching page from each KPI tile.

**PRD §4.6 Equipment Card**

- FR-65: **Card shell and header (shared by all five cards)** — The system draws each Dashboard card with the shared card shell.
- FR-66: **Equipment card header content** — User can see how many equipment items the account has.
- FR-67: **Equipment row layout** — User can see each equipment type with its count, Health bar, caption and chevron.
- FR-68: **Row dividers per Dashboard state** — The system separates rows with hairline dividers exactly as each frame draws them.
- FR-69: **Health bar geometry and formula** — User can see each type's health split proportionally into alert, offline and healthy Health segments.
- FR-70: **Offline hatch pattern** — User can distinguish offline equipment by a grey diagonal hatch.
- FR-71: **Health caption** — User can read the split as text under each Health bar.
- FR-72: **Row and View All navigation** — User can open Equipment at a type's section from its row, or the full Equipment page from View All.

**PRD §4.7 Recent Alerts Card**

- FR-73: **Card layout and header** — User can see the Recent Alerts card next to the Equipment card.
- FR-74: **Alert row content and typography** — User can read each alert's severity, title, device and location, and how long ago it was raised.
- FR-75: **Action link** — User can open the remedial screen for an alert from its Action link.
- FR-76: **Alert row separators and ordering** — The system separates Alert rows exactly as each frame draws them and shows at most four.
- FR-77: **Empty state "No Alerts Right Now"** — User with no alerts sees a reassuring Empty state instead of rows.

**PRD §4.8 Fan Activity Card**

- FR-78: **Fan activity card layout and header** — User can see the Fan activity card first in row 2.
- FR-79: **Stat tiles** — User can see fans running now, runtime today and energy today.
- FR-80: **Runtime chart geometry and bar formula** — User can compare fan runtime hours for the last 7 days.
- FR-81: **Runtime chart labels** — User can read each day's hours and day name, with today emphasised.
- FR-82: **Chart caption** — User can read what the chart shows.

**PRD §4.9 Grain On Hand Card**

- FR-83: **Card layout and header** — User can see the Grain On Hand card in the middle of row 2.
- FR-84: **Summary line and fill label** — User can see total grain against capacity and the fill percentage.
- FR-85: **Grain Fill bar segments and formula** — User can see grain inventory split by Commodity with unused capacity as track.
- FR-86: **Segment tooltip** — User can hover a Commodity segment to see its name, amount and share of capacity.
- FR-87: **Legend** — User can read each Commodity's colour, name, amount and unit count in two columns.

**PRD §4.10 Liquid On Hand Card**

- FR-88: **Card layout and header** — User can see the Liquid On Hand card at the right of row 2.
- FR-89: **Summary line and fill label (Full)** — User can see total liquid against capacity and the fill percentage.
- FR-90: **Liquid Fill bar segments and formula** — User can see liquid volume split by Liquid product with available capacity as track.
- FR-91: **Legend (Full)** — User can read each Liquid product's colour, name, volume and tank count.
- FR-92: **Empty state "No Tanks Monitored Yet"** — User with no tanks sees an Empty state in the card.

**PRD §4.11 Dashboard States & Data Loading**

- FR-93: **Dashboard state selection** — User (tester) can select the Dashboard state with a URL query.
- FR-94: **Verbatim readings rule** — The system renders every reading exactly as stored, without recomputing or reformatting.
- FR-95: **Loading placeholders** — User sees placeholders while the Dashboard data loads, with no layout shift when data arrives.
- FR-96: **Load error with Retry** — User can retry when Dashboard data fails to load, without losing the rest of the page.

**PRD §4.12 Notifications Panel**

- FR-97: **Open and close** — User can open the Notifications panel from the bell and close it with ✕ or Esc.
- FR-98: **Panel container and title row** — User can see the panel title.
- FR-99: **Unread Only toggle** — User can show only unread Notification items or all of them.
- FR-100: **Filter chips** — User can filter Notification items by type with Filter chips.
- FR-101: **Notification items** — User can read each notification's message, type tag and time.

### NonFunctional Requirements

- NFR-1: **Reference viewport.** Every screen is designed for, and verified at, 1366 px wide. The Login page is 1366×768; the Dashboard is 1366 px wide with its frame's height (1052 / 860 / 856). On wider viewports the canvas stays left-aligned and never stretches.
- NFR-2: **Fonts.**
  - Roboto 400–800 and Inter are self-hosted (WOFF2, `font-display: block`).
  - SF Pro text uses the system stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, sans-serif`.
- NFR-3: **Icons and images.**
  - Every icon, the logo and the decorative vectors are the exported Figma SVGs, unmodified. Only the chevron is rebuilt.
  - The only rasters are the silo photo (about 2,700 px, WebP with JPEG fallback, ≤ 600 KB) and the avatar.
- NFR-4: **Performance.** Login page LCP ≤ 1.5 s. The Dashboard renders from JSON in ≤ 300 ms after navigation. CLS = 0 on both screens.
- NFR-5: **Accessibility that never changes the at-rest look.**
  - Semantic buttons and links; labelled inputs; `aria-live` status.
  - Focus trap and Esc on the modal and panel; tab orders as in the Jira stories.
  - Icons have text alternatives or `aria-hidden`.
- NFR-6: **Browser support.** The latest two versions of Chrome, Edge, Safari and Firefox on desktop. The Fidelity check baseline is Chrome on macOS.
- NFR-7: **Data isolation.** Screens read data only through one data-access module, so the JSON can be swapped for the API without changing any screen.
- NFR-8: **Code health.** `npm run build` and `npm run lint` pass with zero errors, and there are no console errors or warnings in any Dashboard state.
- NFR-9: **Fidelity check (PRD §8).** For each frame:
  - pixel diff ≤ 0.5% (silo photo and avatar masked);
  - every measured element within ±1 px (the Runtime chart within 0 px);
  - exact colours, fonts and radii;
  - copy matching character for character;
  - chart segments matching their formulas.

### Additional Requirements

**Architecture spine (Approved): the binding rules every story must cite.**

- **No starter template.** The build goes into the existing React 19.3.1 + Vite 8.3.6 repo; `src/` is a starter app to be replaced. Epic 1 Story 1 sets up the project skeleton, the layered source tree and the dependencies:
  - react-router 8.5.1
  - @fontsource/roboto 5.3.0 and @fontsource/inter 5.3.0
  - @playwright/test 1.64.1, Vitest 5.1.0, @testing-library/react 16.3.3, @testing-library/dom 10.4.2 and jsdom 30.1.3
  - sharp 0.35.5
  - `engines: node >=22.22.0`
- **AD-1:** the Figma frame is the visual source of truth; deviations are allowed only after a Figma revision.
- **AD-2 / AD-3:** one `tokens.css` holding verbatim Figma values, with no colour or font literals in components. CSS Modules only; no Tailwind, CSS-in-JS or UI kit.
- **AD-4:** a fixed 1366 px canvas with no media queries and no `vw`, `vh` or `%` sizing. The exception is overlays: a fixed layer, with a 100dvh panel.
- **AD-5:** Figma SVGs are used byte-identical from `figma-assets/`. Only the chevron is hand-authored; the Logout icon is exported from Figma before its story. The silo photo ships as a 2732 px WebP plus JPEG.
- **AD-6:** the app declares its own `@font-face` with `font-display: block` instead of using the @fontsource CSS. Tests load every weight before capture.
- **AD-7:** data and config.
  - **Verbatim:** screens render data strings exactly as stored.
  - **Loading:** only `src/data/api.js` loads JSON, via `?url` plus fetch.
  - **Latency:** `VITE_DATA_LATENCY_MS` is 300 in development, 0 in test and production.
  - **Test seam:** `?__fail=` in development and test only.
  - **Config:** runtime config lives in `public/app-config.json`.
- **AD-8:** chart geometry lives only in `src/lib/geometry.js`. Explicit px from data (`barPx`, `segmentPx`) wins over formulas. No chart library.
- **AD-9:** `src/lib/session.js` is the sole storage owner.
  - **Keys:** `suretrack.session` `{v:1,…}` in epoch ms, and `suretrack.signin-attempts` `{count, lockedUntil}`.
  - **Expiry:** checked in `getSession(now)`.
  - **Redirect:** router state `{from, reason}`.
  - **Logout:** reaches every tab within 1 s.
- **AD-10:** `react-router@8.5.1` only (`react-router-dom` is banned). Every URL comes from `src/lib/paths.js`. Reserved paths: `/api/*`, `/markdown*` and `/markdown.html`.
- **AD-11:** the Dashboard state is resolved once: `?state`, then the session, then `full`.
- **AD-12:** `OverlayProvider` and `useOverlay` in `src/ui/overlay/`, with kinds modal, menu and panel; rendered through a portal, one at a time, unmounted on close.
- **AD-13:** undesigned hover, focus, error and loading styles go in a trailing `/* states */` block, using tokens only and `:focus-visible`. The at-rest render must not change.
- **AD-14:** PRD conflict resolutions.
  - No chart tooltips.
  - Roboto 400–800.
  - Runtime chart at 0 px tolerance.
  - The profile menu is Figma panel `6026:52937` with only `My Profile` and `Logout`.
  - Dryer alerts are ordinary rows.
  - Login latency is 800 ms.
- **AD-15:** every Figma-mapped element carries `data-fid`, with constants in `src/lib/fid.js`. Playwright `toHaveScreenshot` with maxDiffPixelRatio 0.005 runs on macOS against 1× Figma baselines, plus a measurement audit.
- **AD-16:** all copy comes verbatim from the data JSON or `src/lib/copy.js`. No literal user-visible text in JSX.
- **AD-17:** each page renders the single `Header` with `{activeTab, badge, onBellClick}`; labels come from `copy.js`.
- **AD-18:** every Dashboard section takes `{status, data, onRetry}`, with sizes from `src/lib/dashboardLayout.js` `FRAME[state]`.
- **CI:**
  - an Ubuntu job runs lint, build and Vitest;
  - a `macos-latest` job runs the Playwright behaviour and fidelity tests;
  - baselines come only from 1× Figma exports, and `--update-snapshots` is forbidden.
- **Assets to prepare:** copy `figma-assets/` into `src/assets/`, export the Logout icon from Figma `6026:52937`, and re-export the 1× baselines without shadow overflow.
- **Deferred (not in this breakdown):** production hosting, the real API and authentication, responsive layouts, and chart tooltips.

**Existing Jira stories (approved specs, reused under their keys).**
- **Reused:** SCRUM-27, SCRUM-28, SCRUM-29, SCRUM-31, SCRUM-37, SCRUM-38, SCRUM-39 and SCRUM-40. SCRUM-5 ("Login -- Web") is a parent with no ACs.
- **Excluded:** SCRUM-30 (Reset Password, out of scope) and SCRUM-32 to 36 (Equipment page, a later release).

### UX Design Requirements

No separate UX design contract exists. The visual and interaction requirements are fully specified in two places, and stories cite them directly:
- **PRD §4:** the FR consequences, with the exact Figma values.
- **The brief's Figma design specification:** `briefs/brief-agi-cursor2-2026-11-05/addendum.md`, with `figma-assets/` and `figma-reference/`.

No UX-DR items are duplicated here.

### FR Coverage Map

- FR-1 – FR-10: Epic 1 — Design Foundation (tokens, fonts, assets, global rendering)
- FR-11 – FR-35: Epic 1 — Login page (layout, validation, dummy sign-in, errors, legal links, Logout)
- FR-36 – FR-49: Epic 1 — Forgot Password modal
- FR-50 – FR-58: Epic 2 — App shell & Header
- FR-59 – FR-64: Epic 2 — KPI strip
- FR-65 – FR-72: Epic 2 — Equipment card
- FR-73 – FR-77: Epic 2 — Recent Alerts card
- FR-78 – FR-82: Epic 2 — Fan activity card
- FR-83 – FR-87: Epic 2 — Grain On Hand card
- FR-88 – FR-92: Epic 2 — Liquid On Hand card
- FR-93 – FR-96: Epic 2 — Dashboard states & data loading
- FR-97 – FR-101: Epic 3 — Notifications panel
- NFR-1 – NFR-9: established in Epic 1 (foundation + Fidelity harness), re-verified by every story

## Epic List

### Epic 1: Secure sign-in and account recovery
A farm customer can open SureTrack, sign in through a pixel-exact Login page, see the exact error for each failure case, and request a reset link through the Forgot Password modal. This epic also lays the foundation the later epics rely on: project setup, Design tokens, fonts, Figma assets, the Session and the Fidelity check harness, with the Login baseline.
- **FRs covered:** FR-1 – FR-49
- **Jira:** SCRUM-27, SCRUM-28, SCRUM-29, SCRUM-31 (parent: SCRUM-5), plus NEW stories
- **Governing ADs:** AD-1–AD-7, AD-9, AD-10, AD-12, AD-13, AD-15, AD-16

### Epic 2: Farm status at a glance on the Dashboard
A signed-in customer sees the Header and the full Dashboard: the KPI strip, Equipment health, Recent Alerts with Action links, Fan activity, and Grain and Liquid On Hand. All three Dashboard states match Figma pixel for pixel, with loading and error handling.
- **FRs covered:** FR-50 – FR-96
- **Jira:** SCRUM-37, SCRUM-38, SCRUM-39, SCRUM-40, plus NEW stories
- **Governing ADs:** AD-4, AD-7, AD-8, AD-10, AD-11, AD-14, AD-17, AD-18
- **Builds on:** Epic 1

### Epic 3: Stay informed with Notifications
A signed-in customer opens the bell to see the Notifications panel, toggles Unread Only, filters with Filter chips, and reads every Notification item exactly as Figma shows it.
- **FRs covered:** FR-97 – FR-101
- **Jira:** none; all stories NEW
- **Governing ADs:** AD-7, AD-12, AD-17
- **Builds on:** Epics 1–2

## Epic 1: Secure sign-in and account recovery

A farm customer can open SureTrack, sign in through a pixel-exact Login page, understand every failure case, and request a reset link. The epic also lays the shared foundation (Design tokens, fonts, Figma assets, data port, Session, Fidelity check harness) that the later epics build on.

- **Jira parent:** SCRUM-5 "Login -- Web"
- **Covers:** FR-1 – FR-49 and NFR-1 – NFR-9, which are set up here and re-checked in every story

**Every story in every epic is done only when all of these hold:**
- every consequence of its FRs in PRD §4 is true;
- `npm run build` and `npm run lint` pass with zero errors;
- its Figma frame (or region) passes the Fidelity check (NFR-9);
- it follows the Architecture spine ADs it lists.

### Story 1.1: Project foundation on Figma's design system (NEW)

- [x] Story 1.1 completed — Manager approved 2026-11-06 (story-1.1.md); commits 4644576..e572846 on feature/1-1-project-foundation

As the AGI product owner,
I want the web app set up on Figma's exact Design tokens, fonts and assets,
So that every screen built afterwards matches the design by construction instead of by eye.

**FRs:** FR-1–FR-9 · **ADs:** AD-1–AD-7, AD-10, AD-13, AD-16 · **NFRs:** NFR-2, NFR-3, NFR-6–NFR-8

**Acceptance Criteria:**

**Given** the existing repo (React 19.3.1, Vite 8.3.6, `src/` still the starter app)
**When** the story is complete
**Then** the starter `src/` is replaced by the layered tree in the spine's Structural Seed
**And** these are added at their pinned versions: react-router 8.5.1, @fontsource/roboto and @fontsource/inter 5.3.0, Vitest 5.1.0, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, jsdom 30.1.3 and sharp 0.35.5
**And** `engines.node` is `>=22.22.0`, and `react-router-dom` is absent from `package.json`

**Given** the Figma variables and hard-coded colours in the brief's design spec
**When** `src/styles/tokens.css` is created
**Then** every colour, spacing, radius, border width, shadow, font family and text style in FR-1, FR-2, FR-3 and FR-5 exists as a CSS custom property, with its value copied verbatim (including `#C62828`, `#DC2626`, `#FF0000`, `#F3F4F6` and `#F3F4F4` as separate tokens)
**And** a lint check fails if any `*.module.css` contains a hex, `rgb()` or font-family literal outside `var(--…)`

**Given** the fonts required by FR-4 and AD-6
**When** the app loads
**Then** Roboto 400, 500, 600, 700 and 800 and Inter 400–700 load from local WOFF2 files through `src/styles/fonts.css`, declared with `@font-face … font-display: block`
**And** no `@fontsource` package CSS and no external font URL is requested
**And** SF Pro text resolves through `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, sans-serif`

**Given** the exported files in `figma-assets/` (FR-6, FR-7)
**When** they are copied into `src/assets/`
**Then** each SVG is byte-identical to its export (checksum test)
**And** the silo photo exists as `login-bg.webp` and `login-bg.jpg`, 2732 px wide and ≤ 600 KB each
**And** the right chevron is the only hand-authored SVG (12×16, `#006A36`)

**Given** the data and config contracts (AD-7)
**When** `src/data/api.js` is called
**Then** `getUsers()`, `getDashboard(state)`, `getNotifications()` and `getConfig()` load their files only through `?url` plus `fetch`, with latency from `VITE_DATA_LATENCY_MS`
**And** `?__fail=users|dashboard|notifications` rejects with `{ code, message }` in development and test builds only
**And** the JSON files hold exactly the content of PRD addendum §A and §B (schema test)

**Given** the shared modules
**When** they are created
**Then** `src/lib/paths.js` holds every route in PRD FR-57 and FR-75, `src/lib/copy.js` holds every UI string verbatim (U+00B7, U+2019 and the typos preserved), and `src/lib/fid.js` holds one constant per Figma node ID
**And** the Ubuntu CI job (lint, build, Vitest) passes

### Story 1.2: Pixel-exact Login page with the Fidelity check (SCRUM-27 AC1 · SCRUM-31)

- [x] Story 1.2 completed — Manager approved 2026-11-06 (story-1.2.md + spec); feature/1-2-login-page

As a signed-out farm customer,
I want the Login page to look exactly like AGI's design,
So that I recognise SureTrack and trust where I'm signing in.

**FRs:** FR-10–FR-20 · **ADs:** AD-4, AD-5, AD-13, AD-15, AD-16 · **Figma:** `6026:60111`, 1366×768

**Acceptance Criteria:**

**Given** a signed-out visitor
**When** they open any app route (FR-11)
**Then** they are sent to `/login` and see the Login page

**Given** the Login page at 1366×768 in Chrome on macOS
**When** it renders
**Then** the following match the PRD exactly, each tagged with its `data-fid`:
- the silo photo in its two mirrored placements (FR-12);
- the green angled panel, a gradient from `#009926` to `#006633` at 90% opacity on the polygon (0,0), (692,0), (519.958,768), (0,768) (FR-13);
- the 9×13 px leftover triangle (FR-14);
- the form column and logo (FR-15);
- the title and labels (FR-16);
- the transparent inputs with a 1.5 px `#a4dfbb` border and 4 px radius (FR-17);
- the white Login button with its `#004b27` label (FR-18);
- the Forgot link (FR-19);
- the legal text with its separator in `rgba(255,255,255,0.5)` (FR-20)

**Given** the legal links (SCRUM-31)
**When** the customer clicks `Privacy Policy` or `Terms of Service`
**Then** the URL from `public/app-config.json` opens in a new tab with `rel="noopener noreferrer"`, and anything typed on the Login page stays in place
**And** both links are reachable by keyboard with a visible `:focus-visible` ring that never shows at rest

**Given** the Fidelity check harness (FR-10, AD-15)
**When** `tests/fidelity/login.spec.js` runs on the `macos-latest` CI job
**Then** fonts are loaded for every weight before capture
**And** the screenshot differs from `__baselines__/login-6026-60111.png` (a 1× Figma export) by no more than 0.5% of pixels, with the silo photo masked
**And** the measurement audit shows every `data-fid` element within ±1 px, with exact computed colours, fonts and radii
**And** the copy audit matches every string character for character

### Story 1.3: Sign in and reach the Dashboard (SCRUM-27)

- [x] Story 1.3 completed — Manager approved 2026-11-09 (spec-1-3); feature/1-3-sign-in

As a farm customer,
I want to sign in with my username and password,
So that I can get to my farm's Dashboard.

**FRs:** FR-21–FR-25, FR-33, FR-35 · **ADs:** AD-7, AD-9, AD-10, AD-16

**Acceptance Criteria:**

**Given** the Login page
**When** the customer presses Tab from the top
**Then** focus moves Username → Password → Login → Forgot link → Privacy Policy → Terms of Service (FR-21)
**And** pressing Enter in either field submits the form

**Given** an empty Username or Password
**When** the customer submits
**Then** no sign-in request is made, and the empty field shows `Username is required` or `Password is required` with the [ASSUMPTION] error style from FR-22
**And** the at-rest Login page still passes the Story 1.2 Fidelity check

**Given** valid input
**When** the customer submits
**Then** the Login button shows its loading state and ignores further clicks for the 800 ms policy latency (FR-23)
**And** credentials are checked against `users.json` through `api.js`: the username trimmed and case-insensitive, the password exact (FR-24)

**Given** the Dummy account `demo` / `Demo@123`
**When** sign-in succeeds
**Then** `session.js` writes `suretrack.session` as `{ v: 1, username, displayName, dashboardState, issuedAt, expiresAt }` in epoch ms, with no password
**And** the browser goes to router `state.from`, or `/dashboard` if there is none, replacing the Login page in history (FR-25)
**And** until Epic 2, `/dashboard` renders the protected `Placeholder` route

**Given** a valid Session
**When** the customer opens `/login`
**Then** they go straight to `/dashboard` (FR-33)

**Given** a valid Session in two tabs
**When** `session.signOut()` runs in one tab
**Then** both tabs show `/login` within 1 s, and Back doesn't show signed-in content (FR-35)
**And** the Header's `Logout` control that calls it is delivered in Story 2.1

### Story 1.4: Clear messages when sign-in fails (SCRUM-28)

- [x] Story 1.4 completed — Manager approved 2026-11-09 (spec-1-4); feature/1-4-signin-failures

As a farm customer whose sign-in fails,
I want to see exactly what went wrong,
So that I know whether to retry, reset my password or call SureTrack Coach.

**FRs:** FR-26–FR-32, FR-34 · **ADs:** AD-7, AD-9, AD-13, AD-16

**Acceptance Criteria:**

**Given** wrong credentials
**When** the customer submits
**Then** the alert banner (FR-32) shows `Username or password is incorrect` without saying which field was wrong
**And** the username stays, the password is cleared and focused, and Login is enabled again (FR-26)

**Given** the Dummy accounts `locked`, `inactive` or `nosub`, and `expired`
**When** each signs in with the correct password
**Then** the banner shows the exact copy from FR-27, FR-28 or FR-29, including `SureTrack Coach (855) 293-5607`, the account's try-again time, or a Forgot Password link
**And** no Session is created

**Given** 5 failed attempts in this browser
**When** the fifth fails
**Then** `suretrack.signin-attempts` records `lockedUntil` 15 minutes ahead and survives reload
**And** the banner shows the try-again time, and Login is disabled (opacity 0.5) until then (FR-30)

**Given** the browser is offline, or the `slow` account exceeds the 15 s timeout
**When** the customer submits
**Then** the banner shows the connection or timeout message from FR-31, and the customer can retry

**Given** a Session whose `expiresAt` has passed
**When** the customer's next navigation calls `getSession(now)`
**Then** they land on `/login` with state `reason: 'expired'`, and the banner shows `Your session has expired. Please sign in again.`
**And** after signing in they return to the page they were on (FR-34)

**Given** any banner
**When** it appears
**Then** it sits under the "Login" title with the [ASSUMPTION] styling from FR-32, is announced through `aria-live`, and the page with no banner still passes the Story 1.2 Fidelity check

### Story 1.5: Request a reset link (Forgot Password modal) (SCRUM-29)

- [x] Story 1.5 completed — Manager approved 2026-11-09 (spec-1-5); feature/1-5-forgot-password

As a farm customer who forgot my password or username,
I want to request a reset link by email,
So that I can get back into my account without calling support.

**FRs:** FR-36–FR-49 · **ADs:** AD-4 (overlay exception), AD-12, AD-13, AD-15, AD-16 · **Figma:** `6026:62907`, 600×374

**Acceptance Criteria:**

**Given** the Login page
**When** the customer activates `Forgot Password or Username?`
**Then** `useOverlay()` opens the `modal` kind through `OverlayProvider`, created in this story under `src/ui/overlay/`
**And** the modal is centred on the fixed overlay layer at x 383, y 197 over the [ASSUMPTION] backdrop from FR-36

**Given** the open modal
**When** it renders
**Then** the following match the PRD exactly:
- the container with shadow `0 12px 20px -2px rgba(39,39,39,0.15)` (FR-37);
- the title `Forgot Your Password or Username?` in `#111827` (FR-38);
- the close X kept at opacity 0 (FR-39);
- the intro copy on the `#fbfbfb` body, with its ’ (U+2019) (FR-40);
- the Email field with a red `*` (`#dc2626`) and the `Eg. example@mail.com` placeholder (FR-41);
- the help icon (FR-42);
- `Need additional help?` with `SureTrack Coach (855) 293-5607` (FR-43);
- the footer with `Cancel` and `Submit` on `#006a36` (FR-44)
**And** the modal region passes the Fidelity check against `__baselines__/forgot-password-6026-62907.png`

**Given** the Email field
**When** it is empty or badly formed
**Then** Submit stays disabled, looking exactly as drawn with cursor `not-allowed`
**And** leaving the field shows `Enter a valid email address` (FR-45, FR-46)

**Given** a valid email
**When** the customer submits
**Then** a loading state shows, followed by the same confirmation for any address: `If an account exists for this email, we've sent a reset link. Check your inbox and spam folder.` (FR-47)

**Given** the open modal
**When** the customer clicks Cancel, presses Esc or clicks the backdrop
**Then** the modal unmounts, discarding what was typed, and focus returns to the Forgot link (FR-48)
**And** while it is open, focus stays inside the modal in the order set by FR-49

## Epic 2: Farm status at a glance on the Dashboard

A signed-in customer sees the Header and the full Dashboard: the KPI strip, Equipment health, Recent Alerts with Action links, Fan activity, and Grain and Liquid On Hand. All three Dashboard states match their Figma frames pixel for pixel:

| Dashboard state | Figma frame | Size |
| --- | --- | --- |
| Full | `6215:58878` | 1366×1052 |
| Small | `6864:4514` | 1366×860 |
| All-good | `6879:15603` | 1366×856 |

**Readings rule (FR-94, AD-7):** every number and label shown comes verbatim from `dashboard.<state>.json` (PRD addendum §B). That includes Figma's contradictory readings, such as `7 Need attention · 2 critical`, `79% full` next to `84% Fill`, and `Missing Fan Switched`. Nothing is calculated, pluralised, re-sorted or "fixed" in code.

- **Covers:** FR-50 – FR-96
- **Builds on:** Epic 1

### Story 2.1: Signed-in app shell and Header (NEW)

As a signed-in farm customer,
I want a Header showing where I am, my notifications badge and a way to log out,
So that I can move around SureTrack and end my session safely.

**FRs:** FR-50–FR-58 · **ADs:** AD-4, AD-9, AD-10, AD-12, AD-13, AD-17 · **Figma:** Header in `6215:58878`, profile panel `6026:52937`

**Acceptance Criteria:**

**Given** a Session
**When** any signed-in page renders
**Then** the page canvas is fixed at 1366 px (`min-width: 1366px`, left-aligned) on the `#F3F4F6` page background, with 24 px side gutters and a 1318 px content width (FR-50)
**And** the 64 px white Header shows the `SURETRACKFARM` logo (`logo.svg`, 176.895×14, `#111827`) at its Figma position, with the divider SVG kept at opacity 0 as exported (FR-51)

**Given** the Header Nav tabs `Dashboard`, `Equipment` and `Alerts`, with labels from `copy.js`
**When** the Dashboard is open
**Then** the Dashboard tab is active: background `#F0FFF8`, a 4 px `#006A36` underline and its `widget5.svg` icon in `#006A36`. The other tabs use `garage.svg` and `nav_danger.svg` (FR-52).
**And** clicking Equipment or Alerts goes to `paths.equipment()` or `paths.alerts()`, which render the "Coming soon" `Placeholder` inside the same Header with the matching tab active (FR-57)

**Given** the bell (`bell.svg`, 20 px, `#111827`)
**When** the page passes `badge` from its state document
**Then** the badge shows that value (`2` in every Figma state) on `#FF0000` in Roboto 800 at the Figma geometry (FR-53)
**And** the Header calls `onBellClick` and holds no data of its own (AD-17)

**Given** the avatar (`avatar3.png` in a 32 px circle)
**When** the customer activates it
**Then** `useOverlay()` opens the `menu` kind: Figma panel `6026:52937` geometry (290 px wide, padding 20, gap 32), with the title `My Profile` in Roboto 500 20/24, −0.2 px, `#374151`, a 24 px Logout icon and a 16 px gap, then `Logout` in Roboto 500 16/24 `#E05400` (FR-54, AD-14)
**And** activating `Logout` calls `session.signOut()`, every tab returns to `/login` within 1 s, and `/dashboard` then redirects to `/login` (FR-35, FR-56)
**And** the Logout icon is exported from Figma `6026:52937` byte-identical before this story starts

**Given** the page-title strip
**When** it renders
**Then** it is 68 px high on `#F3F4F4` and shows `Dashboard` with the Figma text style (FR-55)

**Given** hover or keyboard focus on tabs, bell, avatar or menu entries
**When** it occurs
**Then** only the FR-58 [ASSUMPTION] states apply: a 2 px `#006A36` `:focus-visible` outline, with hover rules per FR-58
**And** the at-rest Header still matches the Reference render

### Story 2.2: Dashboard page, Dashboard states and card shells (NEW)

As a farm customer,
I want the Dashboard to load my account's data reliably,
So that I always see my own farm's status, even if something is slow or fails.

**FRs:** FR-65, FR-93–FR-96 · **ADs:** AD-4, AD-7, AD-11, AD-18

**Acceptance Criteria:**

**Given** `/dashboard` with `?state=full|small|allgood`, or none
**When** it loads
**Then** `dashboardState.js` resolves the state as `?state`, then the Session's `dashboardState`, then `full`, falling through on unknown values, and loads exactly one `dashboard.<state>.json` through `api.js` (FR-93)

**Given** the resolved state
**When** the page lays out
**Then** every card position and size comes from `dashboardLayout.js` `FRAME[state]`:
- **Full:** row-1 cards 649×444, row-2 cards 426×326.
- **Small and All-good:** row-1 cards 649×240, row-2 cards 426×326.
- **Bottom space** (`pageBottomSpacePx`): 16 / 28 / 24, so the document height is exactly 1052 / 860 / 856.

**Given** any card
**When** it renders
**Then** it uses the shared card shell: white, 1 px `#D1D5DB` border, 12 px radius, drop shadow `0 2px 2px rgba(39,39,39,0.1)`, with header padding and typography exactly as FR-65 states

**Given** `VITE_DATA_LATENCY_MS=300`
**When** data is loading
**Then** each section receives `{ status: 'loading' }` and shows its [ASSUMPTION] `#F4F5F6` placeholder at the final card size, with no layout shift (CLS 0, FR-95)

**Given** `?__fail=dashboard`
**When** loading fails
**Then** each section shows `Couldn’t load this section.` with `Retry`, and Retry reloads only the data (FR-96)

**Given** loaded data
**When** a value is shown anywhere on the Dashboard
**Then** it is the JSON display string verbatim (FR-94). A unit test fails if any component formats, sums or pluralises a reading.

### Story 2.3: KPI strip (SCRUM-37)

As a farm customer,
I want a one-line summary of what needs attention and how my equipment is doing,
So that I know at a glance where to look.

**FRs:** FR-59–FR-64 · **ADs:** AD-5, AD-7, AD-10, AD-16 · **Figma:** KPI strip in all three frames

**Acceptance Criteria:**

**Given** the KPI strip in the Full state
**When** it renders
**Then** it shows these tiles, verbatim and with their exact icons and tile backgrounds (FR-59–FR-63):
- `7` `Need attention · 2 critical`: `kpi_alert.svg`, stroke `#C62828`, label `#C62828`
- `20` `Equipment`, with the breakdown `7 Bins`, `3 Piles`, `2 Flats`, `6 Tanks`, `2 Dryers`: `kpi_equip.svg`
- `16` `Online`: `kpi_online.svg`
- `4` `Offline`: `kpi_offline.svg`
- `7 of 24` `Fans running now`: `kpi_fans.svg`

The strip shell (radius 16, its shadow rectangle radius 12) and the dividers match FR-59.

**Given** the Small state
**When** it renders
**Then** it shows `1` `Need attention · 1 critical`, `2` `Equipment` (`1 Bin`, `1 Dryer`), `2` `Online`, `0` `Offline` and `2 of 3` `Fans running now`
**And** the breakdown numbers are Bold, as drawn (Regular in Full)

**Given** the All-good state
**When** it renders
**Then** the attention tile shows `0` `Need attention · all good`, with `kpi_tick.svg` (stroke `#005C2F`) on its green tile
**And** the tiles read `1` `Equipment` (`1 Bin`), `1` `Online`, `0` `Offline` and `2 of 3` `Fans running now`

**Given** a KPI tile
**When** the customer clicks it
**Then** it navigates through `paths.js` per FR-64:
- Need attention → Alerts;
- a type count → Equipment at that type;
- Online or Offline → Equipment with that status;
- Fans running now → Equipment.

**Given** each state
**When** the KPI strip region is compared with its Reference render
**Then** it passes the Fidelity check

### Story 2.4: Equipment card with Health bars (SCRUM-37)

As a farm customer,
I want to see how each equipment type is doing,
So that I can spot alerts and offline units quickly.

**FRs:** FR-66–FR-72 · **ADs:** AD-7, AD-8, AD-10 · **Figma:** Equipment card in all three frames

**Acceptance Criteria:**

**Given** the Full state
**When** the Equipment card renders
**Then** the header reads `Equipment (20)` / `Health by type` with `View All` and a chevron (FR-66)
**And** the rows are `Bins 7`, `Piles 3`, `Flats 2`, `Tanks 6`, `Dryers 2`, laid out per FR-67, with dividers per FR-68

**Given** each Health bar (474×8, radius 4, 2 px gaps, order alert → offline → healthy, zero-count segments omitted)
**When** `geometry.healthSegments()` computes it
**Then** the segments are:
- **Bins:** alert 201.43 · offline 67.14 · healthy 201.43
- **Piles:** alert 157.33 · healthy 314.67
- **Flats and Dryers:** healthy 474
- **Tanks:** alert 78.67 · healthy 393.33

Each is within ±1 px (FR-69).
**And** the colours are alert `#C62828` and healthy `#15803D`, and offline uses the `#9CA3AF`/`#D1D5DB` hatch from FR-70

**Given** the captions
**When** they render
**Then** they read verbatim: `3 alerts · 1 offline · 3 healthy`, `1 alert · 2 healthy`, `2 healthy`, `1 alert · 5 healthy` and `2 healthy` (FR-71)

**Given** the Small and All-good states
**When** they render
**Then** Small shows `Equipment (2)`, with `Bin 1` all-alert (474) `1 alert` and `Dryer 1` all-healthy (474) `1 healthy`
**And** All-good shows `Equipment (1)` with `Bin 1` all-healthy `1 healthy`, with the row divider drawn exactly as in that frame (FR-68)

**Given** a row or `View All`
**When** it is clicked
**Then** it opens `paths.equipment({ type })` or `paths.equipment()` (FR-72)

**Given** each state
**When** the card is compared with its Reference render
**Then** it passes the Fidelity check

### Story 2.5: Recent Alerts card (SCRUM-38)

As a farm customer,
I want my most urgent alerts with a link to what to do next,
So that I can respond straight away.

**FRs:** FR-73–FR-77 · **ADs:** AD-7, AD-10, AD-14, AD-16 · **Figma:** Recent Alerts card in all three frames

**Acceptance Criteria:**

**Given** the Full state
**When** the card renders
**Then** the header reads `Recent Alerts` / `Most urgent first. Each item links to what to do next.` with `View All` (FR-73)
**And** four Alert rows appear in file order, each with its severity, time and Action link (FR-74, FR-76):

| Alert | Severity | Time | Action link |
| --- | --- | --- | --- |
| `HotSpot Detected` · `759 | Wheat Storage` | `Critical` | `30 mins ago` | `View Hotspot` |
| `Static Pressure` · `757 | Oat Silo` | `Critical` | `2 hours ago` | `Check Fans` |
| `No Communication` · `18086 | Pinto Storage` | `Warning` | `3 hours ago` | `Check Connection` |
| `Missing Fan Switched` · `753 | Canola East` | `Warning` | `1 day ago` | `Check Fan Switches` |

**And** the severity icons are critical `alert_crit.svg` in a 20 px `#DC2626` circle and warning `alert_warn.svg` in a 20 px `#FFA526` circle. Severity text is `#DC2626` or `#D97706`. Action links are `#005C2F` with `arrow_right.svg`, stroke 1.33.

**Given** an Action link
**When** it is clicked
**Then** it opens `paths.alertAction(deviceId, action)`, while clicking elsewhere on the row opens `paths.equipmentDetail(deviceId)`, both rendering `Placeholder` (FR-75)
**And** dryer alerts, when present in data, render as ordinary Alert rows (AD-14)

**Given** the Small state
**When** the card renders
**Then** it shows only `HotSpot Detected` · `759 | Wheat Storage` · `Critical` · `30 mins ago` · `View Hotspot`, keeping its bottom border as drawn

**Given** the All-good state
**When** the card renders
**Then** the Empty state shows `No Alerts Right Now` / `Everything is on track with your storage, dryers, and tanks. We’ll notify you as soon as anything needs attention.` (FR-77)

**Given** each state
**When** the card is compared with its Reference render
**Then** it passes the Fidelity check

### Story 2.6: Fan activity card with Runtime chart (NEW)

As a farm customer,
I want to see how much my fans have run this week,
So that I understand energy use and drying progress.

**FRs:** FR-78–FR-82 · **ADs:** AD-7, AD-8, AD-14 · **Figma:** Fan activity card in all three frames (426×326)

**Acceptance Criteria:**

**Given** the Full and Small states
**When** the card renders
**Then** it shows `Fan activity` / `All storage fans` and the Stat tiles `7` `Running Now`, `86 h` `Runtime Today` and `410 kWh` `Energy Today`, three tiles of ≈118 px with 16 px gaps (FR-78, FR-79)

**Given** the All-good state
**When** the card renders
**Then** the Stat tiles read `2 of 3` `Running Now`, `7 h 24 m` `Runtime Today` and `38 kWh` `Energy Today`

**Given** the Runtime chart (identical in all states)
**When** `geometry.runtimeBars()` lays it out
**Then** the bars have these heights, exactly from `barPx` with 0 px tolerance (FR-80, AD-14):

| Day | Wed | Thu | Fri | Sat | Sun | Mon | Today |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Height (px) | 54 | 61 | 66 | 72 | 68 | 79 | 76 |

**And** each bar is 24 px wide, with radius 5px 5px 2px 2px, filled `#0B7A3B` (`Today` in `#0A5C30`), centred in 55.14 px columns on one baseline
**And** the value labels are `62h`, `70h`, `74h`, `81h`, `77h`, `90h`, `86h`, Roboto 400 12 `#4B5563`, 18 px above each bar. Day labels are `Wed` to `Mon` in Roboto 400 12 `#4B5563`, with `Today` in Roboto 700 12 `#111827` (FR-81).
**And** the caption reads `Runtime hours, last 7 days. Higher this week as Auto modes used the cool nights.` (FR-82)

**Given** each state
**When** the card is compared with its Reference render
**Then** it passes the Fidelity check

### Story 2.7: Grain On Hand card (SCRUM-39)

As a farm customer,
I want to see how much grain I have by Commodity,
So that I know my inventory without adding up each bin.

**FRs:** FR-83–FR-87 · **ADs:** AD-7, AD-8, AD-14 · **Figma:** Grain On Hand card in all three frames (426×326)

**Acceptance Criteria:**

**Given** the Full state
**When** the card renders
**Then** it shows `Grain On Hand` / `All grain inventory`, the summary `1.40M bu` (bold) `of 1.78M bu · 79% full` and the fill label `79% Fill` (FR-83, FR-84)
**And** the Fill bar (386×10, radius 8.75, 3.75 px gaps) has these segments from `geometry.grainSegments()`, rounded to 1.25 px (FR-85):

| Commodity | Width (px) | Left (px) | Colour |
| --- | --- | --- | --- |
| Canola | 72.5 | 0 | `#E3C341` |
| Corn | 67.5 | 76.33 | `#E07B39` |
| Soybeans | 57.5 | 147.58 | `#6F8F4F` |
| Wheat | 47.5 | 208.83 | `#C98F2E` |
| Barley | 30 | 260.08 | `#8FB36B` |
| Oats | 23.75 | 293.83 | `#B9A47A` |

The track is `#EEF1EF` at 321.33 + 81.25.
**And** the two-column legend reads `Canola` `340k bu · 1 unit`, `Corn` `314k bu · 1 unit`, `Soybeans` `268k bu · 1 unit`, `Wheat` `224k bu · 1 unit`, `Barley` `140k bu · 1 unit` and `Oats` `111k bu · 1 unit`, with the Corn item kept at its scaled 14.551 / 10.913 px sizes (FR-87)

**Given** the Small and All-good states
**When** the card renders
**Then** it shows `21,050 bu` (bold) `of 25,000 bu · 79% full` and `84% Fill`, a single Wheat segment of `segmentPx` 321 at top −0.5, and the legend `Wheat` `21,050 bu · 1 unit · Wheat Storage`

**Given** a segment
**When** it is hovered
**Then** no tooltip and no hover style appear (FR-86 deferred, AD-14)

**Given** each state
**When** the card is compared with its Reference render
**Then** it passes the Fidelity check

### Story 2.8: Liquid On Hand card (SCRUM-40)

As a farm customer with tanks,
I want to see my liquid on hand by Liquid product,
So that I can plan refills.

**FRs:** FR-88–FR-92 · **ADs:** AD-7, AD-8, AD-14 · **Figma:** Liquid On Hand card in all three frames (426×326)

**Acceptance Criteria:**

**Given** the Full state
**When** the card renders
**Then** it shows `Liquid On Hand` / `All liquid storage tanks`, the summary `83k gal` (bold) `of 100k gal · 83% full` and `83% Fill` in Inter (FR-88, FR-89)
**And** the Fill bar (386×9.375, radius 8.203, 3.516 px gaps) has these segments from `geometry.liquidSegments()` at `k_gal × 3.515625` (FR-90):

| Liquid product | Width (px) | Left (px) | Colour |
| --- | --- | --- | --- |
| Propane | 70.313 | 0 | `#0EA5E9` |
| Fuel Oil | 63.281 | 73.828 | `#00B156` |
| Water | 56.25 | 140.625 | `#84CC16` |
| Kerosene | 35.156 | 200.391 | `#14B8A6` |
| Gasoline | 28.125 | 239.063 | `#A855F7` |
| Diesel | 38.672 | 270.703 | `#6366F1` |

The track is at 312.891 + 73.
**And** the legend reads `Propane` `20k gal · 4 tanks`, `Fuel Oil` `18k gal · 3 tanks`, `Water` `16k gal · 4 tanks`, `Kerosene` `10k gal · 2 tanks`, `Gasoline` `8k gal · 2 tanks` and `Diesel` `11k gal · 2 tanks`, at the scaled 14.551 / 10.913 px sizes with 11.719 px swatches (FR-91)
**And** no segment tooltip appears (AD-14)

**Given** the Small and All-good states
**When** the card renders
**Then** the Empty state shows `No Tanks Monitored Yet` / `Keep an eye on propane, diesel and water levels here, and get an alert before a tank runs low.` (FR-92)

**Given** each state
**When** the card is compared with its Reference render
**Then** it passes the Fidelity check, and the full Dashboard page passes for all three frames (1052 / 860 / 856 px tall)

## Epic 3: Stay informed with Notifications

A signed-in customer opens the bell to see the Notifications panel, toggles Unread Only, filters with Filter chips, and reads every Notification item exactly as Figma shows it.

- **Covers:** FR-97 – FR-101
- **Builds on:** Epics 1–2

### Story 3.1: Notifications panel (NEW)

As a farm customer,
I want to open my notifications from the bell and filter them,
So that I don't miss app updates, equipment news or offers.

**FRs:** FR-97–FR-101 · **ADs:** AD-4 (overlay exception), AD-7, AD-12, AD-16, AD-17 · **Figma:** `8270:44312`, 290×768

**Acceptance Criteria:**

**Given** the Dashboard
**When** the customer clicks the bell
**Then** `useOverlay()` opens the `panel` kind: a 290 px panel, `100dvh` tall, anchored to the right edge of the 1366 canvas, with no scrim or animation [ASSUMPTION], and focus moves to ✕ (FR-97)
**And** ✕ (`n_close.svg`, 24 px, `#1E2A2C`) or Esc closes it and returns focus to the bell; clicking outside does not close it. The panel unmounts on close and resets to Unread Only ON and `All` when reopened.

**Given** the open panel
**When** it renders
**Then** the title row (`Notifications` with ✕, `border-bottom: 1px solid rgba(175,195,188,0.4)`, padding-bottom 12) matches FR-98
**And** the `Unread Only` toggle shows ON with `n_toggle.svg` (32×20, `#006A36`/`#FFF`). OFF uses the [ASSUMPTION] `#CFD0D0` track (FR-99).

**Given** the Filter chips `All`, `App`, `Equipment` and `Promotions`, verbatim, including the "Promotions"/"Promotion" mismatch
**When** the customer selects one, by click or with the arrow keys
**Then** the active-chip style moves to it, and only Notification items of that type remain (FR-100)

**Given** `notifications.json`
**When** items render
**Then** each Notification item shows its message, its `App` or `Promotion` tag and its timestamp exactly as in the file and the Figma frame, in file order (not re-sorted), for example `SureTrack app version 3.2 is available with offline field logging. Update now.` · `App` · `Feb 25 | 11:20 am`
**And** clicking an item does nothing [ASSUMPTION] (FR-101)

**Given** the open panel
**When** the panel region is compared with `__baselines__/notifications-8270-44312.png`
**Then** it passes the Fidelity check

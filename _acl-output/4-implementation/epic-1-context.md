# Epic 1 Context: Secure sign-in and account recovery

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A signed-out farm customer signs in through a Login page that is a pixel-exact rebuild of the Figma frame, sees the exact message for every failure case, and can request a reset link from the Forgot Password modal. The epic also lays the foundation Epics 2–3 rely on: project skeleton, verbatim Design tokens, self-hosted fonts, unmodified Figma assets, data port, Session, overlay mechanism and the Playwright Fidelity check harness with the Login baseline.

## Stories

- Story 1.1: Project foundation on Figma's design system
- Story 1.2: Pixel-exact Login page with the Fidelity check
- Story 1.3: Sign in and reach the Dashboard
- Story 1.4: Clear messages when sign-in fails
- Story 1.5: Request a reset link (Forgot Password modal)

## Requirements & Constraints

- **Figma is the visual source of truth:** px, hex, fonts and copy are reproduced exactly; Figma wins on appearance, Jira on undrawn behaviour.
- **Fixed canvas:** Login is exactly 1366×768, `min-width: 1366px`, left-aligned; no media queries or `vw`/`vh`/`%`/`clamp()` sizing.
- **Verbatim copy**, including `·` (U+00B7), `’` (U+2019) and design typos.
- **Undesigned states** (focus, hover, error, loading, disabled, backdrop) use minimal token-only styles and never alter the at-rest render; hover on Login/modal is cursor-only.
- **Dummy auth (`users.json`) check order:** required fields → active lockout → offline → timeout → credentials → locked → inactive/no subscription → password expired → success. Status messages only after a correct password. Username trimmed + case-insensitive; password exact. Policy: 5 failures → 15-min lockout (survives reload), 15 s timeout, 800 ms latency, 480-min session TTL.
- **Forgot Password** shows the identical confirmation for any valid email.
- **Done:** FR consequences true; build + lint zero errors, no console output; Fidelity check passes on macOS Chromium (≤0.5% pixel diff with silo photo/avatar masked, `data-fid` elements ±1 px, exact colours/fonts/radii, copy exact).
- Login LCP ≤ 1.5 s, CLS 0. Accessible without visual change: real buttons/links, labelled inputs, `aria-live` banner.

## Technical Decisions

- **Structure:** replace starter `src/` with layers app → pages → features → ui → lib → data port → styles/assets. Features never import each other; `lib/` is pure except `session.js`. Pinned adds: react-router 8.5.1, @fontsource/roboto + inter 5.3.0, Vitest 5.1.0, Testing Library react 16.3.3 / dom 10.4.2, jsdom 30.1.3, @playwright/test 1.64.1, sharp 0.35.5; `engines.node >=22.22.0`.
- **Styling:** one `tokens.css` with every colour, font, shadow, radius, z-index and opacity copied verbatim (Figma names or `--raw-<hex>`; near-duplicates such as `#F3F4F6`/`#F3F4F4` stay separate). CSS Modules only; lint fails on colour/font literals outside `var(--…)`. Literal px geometry allowed. State styles in a trailing `/* states */` block via `:focus-visible`.
- **Fonts:** own `@font-face` with `font-display: block` over @fontsource WOFF2 (Roboto 400–800, Inter 400–700); no package CSS or CDN. SF Pro uses the system stack ending in Inter. Tests await all font weights before capture.
- **Assets:** Figma SVGs byte-identical (checksum test) as `<img>` with explicit size, never recoloured; only the chevron (12×16, `#006A36`) is hand-made. Silo photo as 2732 px WebP + JPEG, ≤ 600 KB.
- **Data port:** only `src/data/api.js` loads JSON (`?url` + `fetch`); latency via `VITE_DATA_LATENCY_MS` (300 dev, 0 test/prod); `?__fail=` rejects `{ code, message }` in dev/test only. Legal URLs and Coach number in `public/app-config.json` via `getConfig()`.
- **Session (localStorage, supersedes PRD sessionStorage):** `session.js` is the sole storage owner: `suretrack.session` `{ v:1, username, displayName, dashboardState, issuedAt, expiresAt }` (epoch ms, no password) and `suretrack.signin-attempts` `{ count, lockedUntil }`. Built only by `createSessionRecord()`; expiry checked only in `getSession(now)`; logout propagates via `storage` event within 1 s.
- **Routing:** `react-router@8.5.1` `BrowserRouter` (`react-router-dom` banned). All URLs from `src/lib/paths.js`, no `/` literals. `RequireSession` is the only guard, redirecting with state `{ from, reason: 'required'|'expired' }`. Never use `/api/*`, `/markdown*`, `/markdown.html`.
- **Overlays:** `OverlayProvider`/`useOverlay()` in `src/ui/overlay/`, portal to `#overlay-root`, one at a time, unmounted on close; `modal` kind has focus trap + backdrop. Fixed full-viewport layer; inner sizes literal px.
- **Copy & hooks:** text only from data JSON or `copy.js` (no JSX literals); `data-fid` from `fid.js` constants. Fidelity: `toHaveScreenshot` (`maxDiffPixelRatio 0.005`, `deviceScaleFactor 1`) against committed 1× Figma exports; `--update-snapshots` forbidden. CI: Ubuntu lint/build/Vitest; `macos-latest` Playwright.

## UX & Interaction Patterns

- **Login (`6026:60111`):** mirrored silo photo, green angled panel, leftover triangle kept, form column. Legal links open new tab (`noopener noreferrer`), input preserved.
- **Keyboard:** Username → Password → Login → Forgot → Privacy Policy → Terms of Service; Enter submits.
- **Feedback:** per-field required errors; loading state blocks repeat submits; one `aria-live` alert banner under the title for all errors and session expiry; wrong credentials keep username, clear and focus password.
- **Redirects:** success → `state.from` or `/dashboard` (replace history); signed-in user on `/login` → `/dashboard`; after expiry, return to the original page.
- **Forgot Password modal (`6026:62907`, 600×374):** invisible but working close X; help tooltip on hover/focus; Submit disabled until valid yet drawn unchanged (`not-allowed`); validate on blur; loading then confirmation. Cancel/Esc/backdrop/X discard input and refocus the Forgot link.

## Cross-Story Dependencies

- 1.1 precedes all (tokens, fonts, assets, `api.js`, `paths.js`, `copy.js`, `fid.js`, JSON fixtures, CI).
- 1.2 sets the Login baseline; 1.3 and 1.4 must keep it passing with no errors shown.
- 1.3 builds `session.js` + `RequireSession`; 1.4 adds lockout and expiry. `/dashboard` is a protected `Placeholder` until Epic 2; the Header Logout control arrives in Story 2.1.
- 1.5 creates `src/ui/overlay/`, reused by Epic 2 (profile menu) and Epic 3 (Notifications panel).

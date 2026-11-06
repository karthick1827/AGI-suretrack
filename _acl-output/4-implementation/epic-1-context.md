# Epic 1 Context: Secure sign-in and account recovery

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A signed-out farm customer opens SureTrack, signs in through a Login page that is a pixel-exact rebuild of the Figma frame, sees the exact message for every failure case, and can request a reset link from the Forgot Password modal. The epic also lays the foundation Epics 2–3 depend on: the project skeleton, verbatim Design tokens, self-hosted fonts, unmodified Figma assets, the data port, the Session module, the overlay mechanism and the Playwright Fidelity check harness, with the Login baseline.

## Stories

- Story 1.1: Project foundation on Figma's design system
- Story 1.2: Pixel-exact Login page with the Fidelity check
- Story 1.3: Sign in and reach the Dashboard
- Story 1.4: Clear messages when sign-in fails
- Story 1.5: Request a reset link (Forgot Password modal)

## Requirements & Constraints

- **Figma is the visual source of truth.** Values (px, hex, fonts, copy) are reproduced exactly; deviations only after a Figma revision. Figma wins on appearance; Jira wins on undrawn behaviour.
- **Fixed canvas:** Login is exactly 1366×768; `min-width: 1366px`, left-aligned. No media queries, no `vw`/`vh`/`%`/`clamp()` sizing of designed elements.
- **Copy is verbatim, character for character**, including `·` (U+00B7), `’` (U+2019) and design typos.
- **Undesigned states** (focus, hover, error, loading, disabled, backdrop) use minimal token-only styling and must never change the at-rest render; on Login and the modal, hover is cursor-only.
- **Dummy auth from `users.json`.** Fixed check order: required fields → active lockout → offline → timeout → credentials → locked → inactive/no subscription → password expired → success. Account-status messages appear only after a correct password. Username trimmed + case-insensitive, password exact. Policy: 5 failed attempts → 15-minute lockout (survives reload, button disabled), 15 s timeout, 800 ms simulated latency, 480-minute session TTL.
- **Forgot Password** always shows the same confirmation for any valid email (no account enumeration).
- **Done means:** FR consequences true, `npm run build` + `npm run lint` with zero errors, no console output, and the frame/region passes the Fidelity check: ≤0.5% pixel diff (silo photo + avatar masked), every `data-fid` element within ±1 px, exact computed colours/fonts/radii, copy audit exact.
- **Performance/browsers:** Login LCP ≤ 1.5 s, CLS 0; latest two Chrome/Edge/Safari/Firefox desktop; fidelity baseline is Chrome on macOS.
- **Accessibility without changing the look:** real buttons/links, labelled inputs, `aria-live` banner, modal focus trap + Esc.

## Technical Decisions

- **Stack:** existing React 19.3.1 + Vite 8.3.6 repo; replace starter `src/` with the layered tree (app → pages → features → ui → lib → data port → styles/assets). Features never import each other; `lib/` is pure except `session.js`. Pinned additions: react-router 8.5.1, @fontsource/roboto + inter 5.3.0, Vitest 5.1.0, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, jsdom 30.1.3, @playwright/test 1.64.1, sharp 0.35.5; `engines.node >=22.22.0`.
- **Styling:** one global `tokens.css` with every colour, font, shadow, radius, z-index and opacity copied verbatim (Figma variable names or `--raw-<hex>`; near-duplicates like `#F3F4F6`/`#F3F4F4` stay separate). CSS Modules only — no Tailwind, CSS-in-JS, UI kit or icon font. Lint fails on hex/`rgb()`/font-family literals outside `var(--…)`. Literal px geometry is allowed in modules. State styles go in a trailing `/* states */` block using `:focus-visible`.
- **Fonts:** own `@font-face` in `fonts.css` with `font-display: block` pointing at @fontsource WOFF2 files (Roboto 400–800, Inter 400–700); never import package CSS or any font CDN. SF Pro uses the system stack ending in Inter. Fidelity tests load every weight and await `document.fonts.ready` before capture.
- **Assets:** Figma SVGs copied byte-identical from `figma-assets/` to `src/assets/` (checksum test), rendered as `<img>` with explicit width/height, never inlined/recoloured. Only the chevron (12×16, `#006A36`) is hand-authored. Silo photo ships as 2732 px WebP + JPEG, ≤ 600 KB each.
- **Data port:** only `src/data/api.js` loads JSON (`?url` import + `fetch`); `getUsers()`, `getDashboard(state)`, `getNotifications()`, `getConfig()`. Latency from `VITE_DATA_LATENCY_MS` (300 dev, 0 test/prod); sign-in latency comes from the `users.json` policy. `?__fail=users|dashboard|notifications` rejects with `{ code, message }` in dev/test only. Legal URLs and Coach number live in `public/app-config.json`.
- **Session (supersedes PRD `sessionStorage`):** `src/lib/session.js` is the sole storage owner, using `localStorage` keys `suretrack.session` `{ v:1, username, displayName, dashboardState, issuedAt, expiresAt }` (epoch ms, never the password) and `suretrack.signin-attempts` `{ count, lockedUntil }`. Records built only by `createSessionRecord()`; expiry checked only in `getSession(now)`. Logout clears the key; other tabs react via the `storage` event within 1 s.
- **Routing (supersedes PRD route list):** `react-router@8.5.1` declarative `BrowserRouter`, imported only from `react-router` (`react-router-dom` banned). Every URL comes from `src/lib/paths.js` builders; no `/`-prefixed literals. `RequireSession` is the only guard and redirects to `/login` with state `{ from, reason: 'required'|'expired' }`. Never define `/api/*`, `/markdown*` or `/markdown.html` (Markdown Studio).
- **Overlays:** `OverlayProvider` + `useOverlay()` in `src/ui/overlay/`, mounted once in `app/`, portal into `#overlay-root`, one open at a time, unmounted on close. Kinds: `modal` (focus trap, backdrop, click-outside closes), `menu`, `panel`. Overlays sit on a fixed full-viewport layer; designed sizes inside stay literal px.
- **Copy & fidelity hooks:** all user-visible text from data JSON or `src/lib/copy.js` (runtime slots filled by copy helpers; no JSX text literals). Every Figma-mapped element carries `data-fid` from `src/lib/fid.js` constants. Playwright `toHaveScreenshot` (`maxDiffPixelRatio 0.005`, `threshold 0.1`, `deviceScaleFactor 1`) on macOS Chromium against committed 1× Figma exports in `tests/fidelity/__baselines__/`; `--update-snapshots` is forbidden.
- **CI:** Ubuntu job runs lint, build, Vitest; `macos-latest` runs Playwright behaviour + fidelity with latency 0.

## UX & Interaction Patterns

- **Login (Figma `6026:60111`):** white frame clipping two mirrored silo-photo layers; semi-transparent green angled panel; bottom-right leftover triangle kept as drawn; form column with logo, title, labels, transparent inputs, white Login button, Forgot link and legal sentence. Legal links open in a new tab (`noopener noreferrer`) and keep typed input.
- **Keyboard:** Username → Password → Login → Forgot link → Privacy Policy → Terms of Service; Enter submits.
- **Feedback:** required-field errors per field; Login shows a loading state and ignores repeat clicks; all sign-in errors and the session-expired notice use one alert banner under the title, announced via `aria-live`. On wrong credentials the username stays, password clears and refocuses.
- **Redirects:** success goes to `state.from` or `/dashboard` (replacing Login in history); a signed-in user opening `/login` goes to `/dashboard`; after expiry, sign-in returns to the original page.
- **Forgot Password modal (Figma `6026:62907`, 600×374):** close X kept invisible (opacity 0) but functional; help "?" tooltip on hover/focus; Submit disabled until the email is valid while still looking as drawn (cursor `not-allowed`); validation on blur; loading then identical confirmation. Cancel, Esc, backdrop click or X closes, discards input and returns focus to the Forgot link.

## Cross-Story Dependencies

- Story 1.1 is the prerequisite for everything (tokens, fonts, assets, `api.js`, `paths.js`, `copy.js`, `fid.js`, JSON fixtures, CI).
- Story 1.2 provides the Login baseline; Stories 1.3 and 1.4 must keep it passing with no banner/errors shown.
- Story 1.3 builds `session.js` and `RequireSession`, which 1.4 extends with lockout and expiry. Until Epic 2, `/dashboard` renders the protected `Placeholder`; the Header `Logout` control calling `session.signOut()` arrives in Story 2.1.
- Story 1.5 creates `src/ui/overlay/`, which Epic 2 (profile menu) and Epic 3 (Notifications panel) reuse.

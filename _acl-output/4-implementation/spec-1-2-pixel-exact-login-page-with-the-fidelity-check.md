---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-06T05:37:50.902Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 1.2 — Pixel-exact Login page with the Fidelity check'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-06'
baseline_commit: 'abc380359e9a600c19934bec1c3b01f3ad4761c7'
implementation_status: in-review
story_key: 1-2-pixel-exact-login-page-with-the-fidelity-check
jira: SCRUM-27 (AC1), SCRUM-31
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-1-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** there is no Login page, and nothing yet proves that a screen matches its Figma frame.

**Approach:**
- Build the static Login page from Figma frame `6026:60111` (1366×768), with every element at its exact PRD value (FR-11–FR-20) and tagged with `data-fid`.
- Add the Fidelity check harness (FR-10): Playwright screenshot diff against the 1× Figma baseline, plus a measurement audit and a copy audit.
- Make the legal links open the config URLs in a new tab (SCRUM-31).

Sign-in behaviour is not part of this story; it comes in Story 1.3.

## Boundaries & Constraints

**Always:**
- **Exact values:** every position, size, colour, font property, radius, border, opacity and string comes from PRD FR-12 to FR-20 (and design spec Part A §2/§4/§7) verbatim, including fractional px.
- **Styling:** colours and fonts only via `var(--…)`; CSS Modules; fixed 1366×768 canvas (AD-4).
- **Assets:** Figma SVGs from `src/assets/icons/` unmodified (`e34ba.svg` logo, `f4626.svg` panel, `321e0.svg` triangle). The photo is `login-bg.webp` with the JPEG fallback, in its two mirrored placements.
- **Copy and data:** strings only from `copy.js`; URLs only from `getConfig()`; Figma ids only from `fid.js`.
- **Undesigned states:** a trailing `/* states */` block only; `:focus-visible` only; at rest the page must be pixel-identical (AD-13).
- **Playwright:** pin `@playwright/test@1.64.1` and use Chromium only.

**Ask First:**
- Any value that cannot be read from the PRD or design spec.
- Changing a token in `tokens.css`.
- Raising the 0.5% diff threshold or masking anything beyond the silo photo.

**Never:**
- Sign-in logic, validation, session or banners (Stories 1.3/1.4); the Forgot Password modal (Story 1.5).
- `--update-snapshots`. Baselines come only from Figma exports.
- Redrawing icons or the panel; any responsive CSS.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Any route | Open `/`, `/dashboard` or `/xyz` | Redirect to `/login`; Login page shown | N/A |
| Legal link | Click `Privacy Policy` or `Terms of Service` | New tab opens the `app-config.json` URL with `rel="noopener noreferrer"`; typed field values stay | Config load fails: links render without `href` and log nothing |
| Keyboard | Tab to a legal link | Visible `:focus-visible` ring; no ring at rest | N/A |
| Fidelity | `npm run test:fidelity` on Chromium at 1366×768, DPR 1 | Pixel diff ≤ 0.5% with the photo masked; every `data-fid` box within ±1 px; exact computed colours/fonts/radii; copy exact | Failing diff writes `test-results/` artifacts |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:247-366`: FR-10 to FR-20 consequences. These are the authoritative px, hex and font values and node ids.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:117-195`: Login layout tables, including the photo placements, panel polygon and form column.
- `addendum.md:227-255` and `:309-333`: typography and verbatim copy.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-reference/login-6026-60111.png`: the 1366×768 baseline, copied to `tests/fidelity/__baselines__/login-6026-60111.png`.
- `src/app/App.jsx`: the catch-all route to replace with the `/login` route and a redirect.
- `src/lib/paths.js`, `copy.js`, `fid.js`, `src/data/api.js#getConfig`: reuse; add only the missing Login keys.
- `src/styles/tokens.css`: Login tokens already exist (Part A §1).

## Tasks & Acceptance

**Execution:**
- [x] `package.json`: add `@playwright/test@1.64.1` (dev) and the `test:fidelity` script.
- [x] `src/app/App.jsx`: `/login` renders `LoginPage`; every other app path redirects to `paths.login()` (FR-11).
- [x] `src/pages/Login/LoginPage.jsx` and `LoginPage.module.css`: the frame, the two mirrored photo layers, the green panel SVG, the 9×13 triangle and the form column, at exact FR-12–FR-15 geometry, with a `data-fid` on each.
- [x] `src/features/auth/LoginForm.jsx` and `LoginForm.module.css`: the `Login` title and labels (FR-16), inputs with a 1.5 px `#a4dfbb` border and 4 px radius on a transparent fill (FR-17), the white button with its `#004b27` label (FR-18), the Forgot link as a non-functional button (FR-19), and the legal text and links (FR-20, SCRUM-31). Submit is a no-op.
- [x] `playwright.config.js`: Chromium, viewport 1366×768, `deviceScaleFactor: 1`, `webServer: npm run dev`, `VITE_DATA_LATENCY_MS=0`.
- [x] `tests/fidelity/support/fidelity.js`: helpers to load all font weights, run the measurement audit over `data-fid` against an expected-values table, and run the copy audit.
- [x] `tests/fidelity/login.spec.js`: `toHaveScreenshot('login-6026-60111.png', { maxDiffPixelRatio: 0.005, threshold: 0.1, mask: [photo] })`, plus the measurement audit (±1 px) and copy audit for every FR-12–FR-20 element.
- [x] `tests/fidelity/expected/login.json`: the expected `{fid: {x, y, w, h, color, fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, radius}}` values, transcribed from PRD FR-12–FR-20.
- [x] `tests/unit/login.test.jsx`: the redirect, the legal links' `target`/`rel`/`href` from config, and that no user-visible text is written literally in JSX.
- [x] `.github/workflows/ci.yml`: a `macos-latest` job running `npx playwright install chromium` and `npm run test:fidelity`, uploading `test-results/` on failure.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test`, when run, then all pass with zero errors (CSS-literal gate included).
- Given the dev server, when `/login` is opened at 1366×768, then nothing loads from outside the app and the console shows no errors.
- Given `npm run test:fidelity` on Chromium at DPR 1, when it runs, then the screenshot, measurement and copy audits pass. A Windows local run is advisory; the `macos-latest` CI job is authoritative (AD-6/AD-15).

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`: expected exit code 0.
- `npx playwright install chromium && npm run test:fidelity`: expected all tests to pass, reporting the pixel-diff ratio.

**Manual checks:**
- Open `/login` beside `figma-reference/login-6026-60111.png` at 100% zoom: the panel edge, logo, inputs, button, links and legal text should line up.

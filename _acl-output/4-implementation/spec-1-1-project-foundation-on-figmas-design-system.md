---
status: In Review
spec_approved_by: Manager (via Markdown Studio)
spec_approved_at: 2026-11-06T04:59:33.288Z
title: 'Story 1.1 — Project foundation on Figma''s design system'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-06'
baseline_commit: '464457683d23546fbee2269fccc25012d6e93dc7'
implementation_status: review
story_key: 1-1-project-foundation-on-figmas-design-system
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-1-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `src/` is still the Vite starter. Before any SureTrack screen can be built pixel-exact, the project needs a skeleton where Figma's exact values, fonts, assets, copy and data come from single verified sources.

**Approach:** replace the starter with the spine's layered tree and add the pinned dependencies. Then create these sources of truth, each guarded by a test:
- `tokens.css`, holding every Figma value verbatim;
- `fonts.css`, with `font-display: block`;
- byte-identical Figma assets;
- the data port and its JSON contracts;
- the `paths`, `copy` and `fid` modules.

No user-visible screen ships in this story; `/` renders an empty app root.

## Boundaries & Constraints

**Always:**
- **Exact values:** copy Figma and PRD values verbatim; never round, merge or "fix" a value, including duplicate reds and greys.
- **Styling:** CSS Modules only. Hex, `rgb()` and font-family literals may appear only in `src/styles/tokens.css`.
- **Pinned versions:** react-router 8.5.1, @fontsource/roboto 5.3.0, @fontsource/inter 5.3.0, vitest 5.1.0, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, jsdom 30.1.3, sharp 0.35.5, plus `engines.node >=22.22.0`.
- **Data access:** only `src/data/api.js` touches `src/data/json/*`.
- **Markdown Studio:** keep `aclMarkdownSaverPlugin()` and everything above line 965 of `vite.config.js` unchanged.

**Ask First:**
- Adding any dependency not listed above.
- Changing `vite.config.js` beyond appending the Vitest `test` block.
- Changing any value copied from the PRD addendum §A/§B JSON.

**Never:**
- **Banned packages:** `react-router-dom`, Tailwind, CSS-in-JS, UI kits, icon fonts, chart libraries.
- **Font loading:** `@fontsource` package CSS imports, or any font URL served from a CDN.
- **Assets:** editing any Figma SVG.
- **App routes:** any route or file under `/api/*`, `/markdown*` or `/markdown.html`.
- **Out of scope here:** building the Login UI or the Fidelity harness (Story 1.2).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Load JSON | `getDashboard('small')` with `VITE_DATA_LATENCY_MS=0` | Resolves the exact `dashboard.small.json` object | N/A |
| Unknown state | `getDashboard('xyz')` | Rejects with `{ code: 'NOT_FOUND', message }` | Promise rejection, no throw |
| Forced failure | `?__fail=dashboard` in a dev or test build | `getDashboard()` rejects with `{ code: 'FORCED_FAIL', message }` | Ignored in production builds |
| Config | `getConfig()` | Resolves `public/app-config.json` (legal URLs, Coach number) | Rejects `{ code: 'LOAD_FAILED' }` on non-OK fetch |

</frozen-after-approval>

## Code Map

- `package.json`: add the pinned deps and `engines`, plus scripts `test` (`vitest run`) and `lint` (`oxlint && node scripts/check-css-literals.mjs`).
- `vite.config.js:965-976`: the existing React and React Compiler config. Append only `test: { environment: 'jsdom' }`.
- `index.html`: add `<div id="overlay-root"></div>` and set the title to `SureTrack`.
- `src/main.jsx`, `src/App.jsx`, `src/App.css`, `src/index.css`, `src/assets/{hero.png,react.svg,vite.svg}`: the starter files. Delete them, then recreate `main.jsx` and `App.jsx` under `src/app/`.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md` Part A §1 and Part B §1.1–1.5: the source of every token value (Figma variables plus the hard-coded palette).
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md` §A (users.json) and §B.3–B.7: the verbatim JSON contracts.
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md` §4: copy strings, FR-57/FR-75 routes and Figma node IDs.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-assets/{login,dashboard}/`: the SVGs to copy byte-identically. `981df.png` is the silo photo source (git-ignored, present locally).

## Tasks & Acceptance

**Execution:**
- [x] `package.json` and the lockfile: install the pinned deps; add `engines` and the scripts. This fixes versions per the spine.
- [x] `src/styles/tokens.css`: one custom property per Figma variable (`--<path-dashes>`) and per hard-coded colour (`--raw-<hex>`). Include separate tokens for `#C62828`, `#DC2626`, `#FF0000`, `#F3F4F6` and `#F3F4F4`; the shadows `0 2px 2px rgba(39,39,39,0.1)` and `0 12px 20px -2px rgba(39,39,39,0.15)`; the font stacks; and a z-index scale. This is the single token layer (AD-2).
- [x] `src/styles/fonts.css`: own `@font-face` rules for Roboto 400–800 and Inter 400–700 latin WOFF2 files from `@fontsource/*/files/`, with `font-display: block`. This fixes the package default of `swap` (AD-6).
- [x] `src/styles/reset.css`: a minimal reset; `#root { min-width: 1366px; }`.
- [x] `src/assets/icons/`: copy every figma-assets SVG byte-identically. Author `chevron-right.svg` (12×16, `#006A36`) as the only hand-made icon (AD-5).
- [x] `scripts/build-images.mjs`: use sharp to derive `src/assets/login-bg.webp` and `.jpg` (2732 px wide, each ≤ 600 KB) from `981df.png`, and copy `avatar3.png` to `src/assets/avatar.png`. Commit the outputs; the 17.6 MB source stays local.
- [x] `src/data/json/*.json` and `public/app-config.json`: copy the PRD addendum JSON verbatim. The config holds placeholder legal URLs (`https://example.com/privacy`, `https://example.com/terms`) and the Coach number.
- [x] `src/data/api.js`: `getUsers`, `getDashboard`, `getNotifications` and `getConfig`, using `?url` plus `fetch`, `VITE_DATA_LATENCY_MS` latency and the `__fail` seam (dev and test only) (AD-7).
- [x] `src/lib/paths.js`, `src/lib/copy.js`, `src/lib/fid.js`: route builders (FR-57/FR-75), every UI string verbatim (U+00B7, U+2019, typos kept) and Figma node-ID constants (AD-10, AD-15, AD-16).
- [x] `src/app/main.jsx` and `src/app/App.jsx`: import reset, fonts and tokens once; `BrowserRouter` with an empty route table placeholder; mount `#root`.
- [x] `scripts/check-css-literals.mjs`: fail if any `src/**/*.module.css` holds a hex, `rgb(a)` or font-family literal outside `var(--…)`.
- [x] `tests/unit/`: token-presence, asset-checksum, JSON-schema, api (the I/O matrix) and copy-encoding tests.
- [x] `.github/workflows/ci.yml`: an Ubuntu job running `npm ci`, `npm run lint`, `npm run build` and `npm test`.

**Acceptance Criteria:**
- Given a fresh clone, when `npm ci && npm run lint && npm run build && npm test` run, then all pass with zero errors and zero warnings.
- Given `package.json`, when inspected, then `react-router-dom` is absent and all pins match exactly.
- Given the running app, when the network panel is inspected, then only local WOFF2 files load and no `@fontsource` CSS is requested.
- Given `src/assets/icons/*.svg`, when checksummed against `figma-assets/`, then every file matches, except the hand-authored chevron.
- Given `npm run dev`, when `/markdown.html` is opened, then Markdown Studio still works.

## Verification

**Commands:**
- `npm run lint`: expected exit code 0, including the CSS-literal check.
- `npm run build`: expected `dist/` built with no warnings.
- `npm test`: expected all unit tests to pass.
- `node -e "require('./package.json').dependencies['react-router-dom'] && process.exit(1)"`: expected exit code 0.

## Suggested Review Order

**Design-token layer (exact Figma values)**

- Single token layer; every Figma variable and hard-coded colour copied verbatim, never merged.
  [`tokens.css:24`](../../src/styles/tokens.css#L24)
- The three reds stay separate tokens, as drawn in Figma (AD-2).
  [`tokens.css:171`](../../src/styles/tokens.css#L171)
- Own @font-face with font-display: block, so no fallback-font flash breaks pixel parity.
  [`fonts.css:17`](../../src/styles/fonts.css#L17)
- Globals imported once, in the documented order.
  [`main.jsx:4`](../../src/app/main.jsx#L4)

**Data port (only door to JSON)**

- `?url&no-inline` keeps every JSON a real, interceptable request (FR-96).
  [`api.js:18`](../../src/data/api.js#L18)
- Latency: 300 dev / 0 test / always 0 in production.
  [`api.js:38`](../../src/data/api.js#L38)
- One load path: forced-fail → NOT_FOUND → latency → fetch → shape check.
  [`api.js:90`](../../src/data/api.js#L90)
- Public API used by every later story.
  [`api.js:102`](../../src/data/api.js#L102)

**Shared modules (routes, copy, Figma IDs)**

- Every app URL built here; Markdown Studio prefixes reserved.
  [`paths.js:14`](../../src/lib/paths.js#L14)
- Route builders reject bad ids ('.', '..', empty).
  [`paths.js:39`](../../src/lib/paths.js#L39)
- Verbatim copy (U+00B7, U+2019, design typos kept).
  [`copy.js:20`](../../src/lib/copy.js#L20)
- fill() fails loudly on a missing slot instead of rendering 'undefined'.
  [`copy.js:108`](../../src/lib/copy.js#L108)
- Figma node-id constants for data-fid hooks.
  [`fid.js:17`](../../src/lib/fid.js#L17)

**Guards (lint gate, assets)**

- AD-2 gate: blocks colour/font literals in any src CSS outside styles/.
  [`check-css-literals.mjs:146`](../../scripts/check-css-literals.mjs#L146)
- Silo photo derivation: ≤600 KB, no upscaling, safe temp writes.
  [`build-images.mjs:37`](../../scripts/build-images.mjs#L37)

**Peripherals (app shell, config, CI, tests)**

- React Router 8 only; empty app root for now.
  [`App.jsx:1`](../../src/app/App.jsx#L1)
- Overlay root for AD-12 overlays.
  [`index.html:11`](../../index.html#L11)
- Lint now ignores Markdown Studio files to reach zero warnings (review this).
  [`.oxlintrc.json:4`](../../.oxlintrc.json#L4)
- Ubuntu CI: lint, build, test.
  [`ci.yml:13`](../../.github/workflows/ci.yml#L13)
- I/O-matrix and latency tests.
  [`api.test.js:1`](../../tests/unit/api.test.js#L1)

---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T11:00:02.010Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
---

# Review: Verification — ARCHITECTURE-SPINE.md (AGI SureTrack Farm Web)

**Reviewer lens:** Every committed decision must be web-researched or reality-checked (current versions, technology still exists and fits, live defaults of what the spine leans on), not asserted from training data.
**Date:** 2026-11-05
**Evidence base:** `npm view` against the public registry on 2026-11-05 (versions, `peerDependencies`, `engines`); `npm pack` of the exact versions to read the shipped files (react-router 8.5.1 `CHANGELOG.md` and bundled `docs/`, `@fontsource/roboto` 5.3.0 CSS, `playwright` 1.64.1 `types/test.d.ts`, `vitest` 5.1.0 types); the repo's `package.json`, `node_modules`, `vite.config.js`, `index.html`, `netlify.toml`, `vercel.json` and `@vitejs/plugin-react` README. No web search engine was used; the package-shipped docs and changelogs are the primary source for each library.

## Verdict

**Pass with fixes.** All 14 Stack versions are the current registry `latest` and mutually compatible on Node 22.23.4. Two decisions are not reality-checked and break when followed literally: the `font-display: block` claim (AD-6) and the unguarded React Router package choice (AD-10 / Stack). Several medium and low gaps follow.

## Confirmed (no action)

| Item | Spine | Registry today | Fit check |
| --- | --- | --- | --- |
| Node.js | 22.23.4 | local `node -v` = 22.23.4 | Meets every `engines` floor: react-router ≥22.22.0, jsdom ^22.22.2, vitest ^22.12.0, @rolldown/plugin-babel ≥22.12.0, vite ≥22.12.0 |
| react / react-dom | 19.3.1 | 19.3.1 | react-router 8 peer `>=19.2.7` ✓; @testing-library/react peer `^19` ✓ |
| vite | 8.3.6 | 8.3.6 (repo installed 8.3.5) | vitest peer `^8` ✓; plugin-react peer `^8` ✓ |
| @vitejs/plugin-react | 6.2.1 | 6.2.1 (installed) | exports `reactCompilerPreset` ✓ |
| babel-plugin-react-compiler | 1.0.0 | 1.0.0 | plugin-react peer `^1.0.0` ✓ |
| react-router | 8.5.1 | 8.5.1 (8.0.0 released 2026-06-17) | **Declarative mode still exists in v8**: `BrowserRouter`, `Routes`, `Route`, `Navigate`, `NavLink`, `useSearchParams` exported from `react-router`; bundled `docs/start/declarative/installation.md` shows `create-vite` + `npm i react-router` + `<BrowserRouter>` |
| @fontsource/roboto | 5.3.0 | 5.3.0 | Ships `400/500/600/700/800.css` and `files/roboto-latin-{600,800}-normal.woff2`; latin `unicode-range` covers U+00B7 and U+2019 (U+0000-00FF, U+2000-206F) |
| @fontsource/inter | 5.3.0 | 5.3.0 | Ships 100–900 |
| @playwright/test | 1.64.1 | 1.64.1 | `toHaveScreenshot` still accepts `maxDiffPixelRatio`, `threshold`, `animations`, `caret`, `scale`, `stylePath` |
| vitest | 5.1.0 | 5.1.0 | Peer `jsdom: "*"`; `BuiltinEnvironment = "node" \| "jsdom" \| "happy-dom" \| "edge-runtime"` — jsdom env still built in |
| @testing-library/react | 16.3.3 | 16.3.3 | React 19 peer ✓ (needs `@testing-library/dom`, see V-5) |
| jsdom | 30.1.3 | 30.1.3 | Node ^22.22.2 ✓ |
| sharp | 0.35.5 | 0.35.5 | Node ≥20.9 ✓ |
| oxlint | 1.91.0 | 1.91.0 (installed) | repo already has `.oxlintrc.json` |

## Findings

### V-1 [HIGH] AD-6 `font-display: block` is not what `@fontsource` ships

- **Evidence:** every `@fontsource/roboto@5.3.0/*.css` and `@fontsource/inter@5.3.0/*.css` file hard-codes `font-display: swap;` (checked `800.css`, `400.css`). Importing `@fontsource/roboto/800.css` as AD-6 implies gives `swap`, not `block`. The spine asserts a property the package does not have.
- **Also:** `document.fonts.ready` resolves when fonts *already requested* finish loading. A weight used only inside an unopened overlay (profile menu Roboto 500, panel title 600 in some states) is not requested at first paint, so `fonts.ready` does not guarantee it.
- **Fix (AD-6 text):**
  > **Bundled fonts:** `src/styles/fonts.css` declares its own `@font-face` rules with `font-display: block`, pointing at `@fontsource/roboto/files/roboto-latin-{400,500,600,700,800}-normal.woff2` and `@fontsource/inter/files/inter-latin-{400,500,600,700}-normal.woff2` (the package `exports` map allows `./files/*`). The packages' own `*.css` files are not imported. Fidelity tests call `await document.fonts.load('<weight> 16px Roboto')` for every weight in use, then `await document.fonts.ready`, before each capture.

### V-2 [HIGH] React Router v8 removed `react-router-dom`; the spine does not pin the package or import path

- **Evidence:** react-router 8.0.0 CHANGELOG: "Remove `react-router-dom` package … `RouterProvider`/`HydratedRouter` should be imported from `react-router/dom`; everything else from `react-router`." Yet `npm view react-router-dom version` still returns **7.18.5**. A builder following training data (`npm i react-router-dom`, `import { BrowserRouter } from 'react-router-dom'`) installs a v7 copy beside v8 — two routers, two contexts, `useNavigate` outside router errors.
- PRD addendum C.1 still says "react-router (v7)"; the spine's v8 choice is right but unenforced.
- **Fix (AD-10 Router line + Stack):**
  > **Router:** `react-router@8.5.1`, declarative mode (`<BrowserRouter>` + `<Routes>`); all imports from `react-router` only. `react-router-dom` and `react-router/dom` must not appear in `package.json` or any import. Data/framework mode APIs (`createBrowserRouter`, loaders, actions) are not used.
  - Add `"engines": { "node": ">=22.22.0" }` to `package.json` (react-router 8's own floor).

### V-3 [MEDIUM] Stack omits the packages the React Compiler wiring actually needs

- **Evidence:** repo `vite.config.js` wires the compiler as `react(), babel({ presets: [reactCompilerPreset()] })` with `import babel from '@rolldown/plugin-babel'`, matching the plugin-react 6.2.1 README ("Babel React Compiler … requires `@rolldown/plugin-babel`, `babel-plugin-react-compiler`, and `@babel/core`"). The spine Stack lists only `babel-plugin-react-compiler`.
- Installed: `@rolldown/plugin-babel` 0.2.4 (latest 0.3.0; plugin-react peer accepts `^0.1.7 || ^0.2.0 || ^0.3.0`), `@babel/core` 7.29.13.
- The README's alternative `react({ compiler: true })` uses `oxc-transform-react` and is marked "experimental" — should not be adopted.
- **Fix (Stack rows):** add `@rolldown/plugin-babel | 0.3.0` (or keep 0.2.4 as installed — both in range) and `@babel/core | 7.29.13`; add a line: "React Compiler is wired via Babel exactly as in the existing `vite.config.js`; the experimental `compiler: true` (oxc) option is not used."

### V-4 [MEDIUM] Playwright option set mixes assertion and context options; baseline path needs explicit config

- `deviceScaleFactor` is a `use`/browser-context option, not a `toHaveScreenshot` option; the spine lists it inside the assertion's parentheses. The assertion option for scale is `scale: 'css'`.
- Default snapshot names are `<name>-<project>-<platform>.png` beside the spec; the spine's `tests/fidelity/__baselines__/` holding Figma exports only works with an explicit `snapshotPathTemplate` (e.g. `'{testDir}/__baselines__/{arg}{ext}'`).
- `toHaveScreenshot` fails immediately on any dimension mismatch; Dashboard captures must use `fullPage: true` and Figma exports must equal 1366×1052 / 860 / 856 exactly (PRD C.4 already notes shadow overflow on the saved renders).
- **Unverified feasibility:** whether Figma's rasteriser and Chromium's text antialiasing can meet `maxDiffPixelRatio: 0.005` at `threshold: 0.1` has not been tried. Recommend a one-screen spike before the Fidelity story is sized.
- **Fix (AD-15 Tests line):**
  > Playwright config: `use: { browserName: 'chromium', viewport: { width: 1366, height: <frame height> }, deviceScaleFactor: 1 }`, `snapshotPathTemplate: '{testDir}/__baselines__/{arg}{ext}'`, `expect.toHaveScreenshot: { maxDiffPixelRatio: 0.005, threshold: 0.1, scale: 'css', animations: 'disabled', caret: 'hide' }`; Dashboard captures use `fullPage: true`.

### V-5 [MEDIUM] `@testing-library/dom` missing from the Stack

- `@testing-library/react@16.3.3` declares `@testing-library/dom ^10.0.0` as a **peer** (not a dependency). Current: 10.4.2.
- **Fix:** add Stack row `@testing-library/dom | 10.4.2`.

### V-6 [LOW] Vitest will load the Markdown Studio dev middleware

- Vitest reads `vite.config.js` by default, which registers `aclMarkdownSaverPlugin()` (`configureServer` with fs/child_process utilities). Harmless today but couples unit tests to Studio code.
- **Fix:** add `vitest.config.js` (or `test:` block with its own plugin list: `react()` only), `environment: 'jsdom'` only for `session` tests, `node` for `geometry`/`dashboardState`.

### V-7 [LOW] AD-5 asset source path does not exist

- There is no `figma-assets/` at the repo root. The exports are in `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-assets/` (e.g. `dashboard/alert_crit.svg`).
- **Fix (AD-5):** "SVGs come only from `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-assets/`, copied byte-identical to `src/assets/icons/`."

### V-8 [LOW] Existing `index.html` contradicts the Structural Seed and AD-12

- `index.html` loads `/src/main.jsx` and has no `#overlay-root`; the seed moves `main.jsx` to `src/app/`. Also `src/` still holds the Vite template (`App.css`, `index.css`, `assets/react.svg`, `vite.svg`, `hero.png`).
- **Fix:** add to the Structural Seed: "The foundation story updates `index.html` (`<script src="/src/app/main.jsx">`, `<div id="overlay-root"></div>` after `#root`) and deletes the template files."

### V-9 [LOW] Reserved-path list is incomplete against the real dev middleware

- `vite.config.js` middleware also answers `/markdownstudio(.html)`, `/acl-agents.json`, `/greenfield.svg`, `/brownfield.svg`, `/velocityone-studio-logo.png`, `/vo-icon.svg`; `public/` also serves `/favicon.svg`, `/icons.svg`, `/markdown/*`. `/markdownstudio` is covered by `/markdown*`; the rest are not.
- **Fix (AD-10 Reserved):** "…and must not add files to `public/` or define routes matching any path served by `public/` or the `acl-markdown-saver` middleware. App static assets are imported through `src/assets/` only."

### V-10 [LOW] Runtime platform caveats not stated

- The SF Pro stack resolves to SF only on macOS; on the team's Windows machines it falls back to Inter, so local fidelity runs will differ from CI. State that fidelity baselines are authoritative only on the macOS CI runner.
- Node 22 is in maintenance LTS (end of life April 2027, from release-schedule knowledge, not re-checked today). Fine for this release; flag for the deferred hosting decision.

## Summary

- **Critical:** 0
- **High:** 2 — V-1 (fonts.css own `@font-face` with `font-display: block` over `@fontsource/*/files/*`), V-2 (pin `react-router@8.5.1`, import only from `react-router`, ban `react-router-dom`)
- **Medium:** 3 — V-3, V-4, V-5
- **Low:** 5 — V-6 … V-10

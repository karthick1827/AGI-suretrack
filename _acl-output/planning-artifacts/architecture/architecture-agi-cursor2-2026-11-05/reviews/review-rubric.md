---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T11:00:05.540Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
---

# Spine Review — Rubric Walker (good-spine checklist)

- **Spine:** `../ARCHITECTURE-SPINE.md` (status In Review, not modified by this review)
- **Driving inputs:** approved `prd.md` + `addendum.md`, PRD `review-rubric.md`, PRD `reconcile-brief.md`
- **Repo read:** `package.json`, `vite.config.js` (head and tail), `index.html`, `src/`, `.oxlintrc.json`, `netlify.toml`, `vercel.json`, `DEPLOYMENT.md`, `.github/`, `node_modules` versions, brief `figma-assets/` and `figma-reference/`
- **Reviewer:** rubric walker, 2026-11-05

## Verdict

**Conditional pass.** The spine is lean and pins most of the right things: one token layer, CSS Modules, one data port, one geometry module, one Session module, and an explicit AD-14 that settles the PRD's known contradictions. Four places still let two builders diverge or make a requirement impossible to meet:
- The import-direction graph forbids the imports that AD-11 and the second diagram require.
- AD-9 gives the lockout counter (FR-30) no legal place to live.
- AD-4 bans the viewport-relative sizing the Notifications panel needs.
- The data port has no test seam, so the loading and error paths (FR-95, FR-96) cannot be tested.

The operational envelope is thin. There is no CI workflow or test script in the repo, Windows developers cannot produce macOS baselines, and deferring hosting leaves the SPA fallback and base path open.

**Counts:** Critical 0 · High 4 · Medium 13 · Low 9

---

## 1. Does it fix the real divergence points, and miss none?

### High

**H1. The import graph contradicts AD-11 and the second diagram; feature-to-feature imports are not covered.** *(Invariants & Rules mermaid block and caption; AD-11; Structural Seed second diagram)*
The caption says "Arrows are the only allowed import directions". The graph has `pages --> features` only, with no `pages --> lib`, `pages --> port` or `pages --> ui`. But:
- AD-11 says "the Dashboard page loads one state document and passes slices down";
- the second diagram draws `D --> S{dashboardState.js}`, `D --> API` and `L --> SE`;
- the Capability map puts `pages/Dashboard` together with `lib/dashboardState.js`.

A developer who follows the graph must move loading into a feature. A developer who follows AD-11 imports `api.js` from the page. The graph is also silent on feature → feature imports, which three flows need:
- the auth banner's `Reset your password` link opens the Forgot Password modal (FR-29 → FR-36);
- the shell bell opens `features/notifications` (FR-53 → FR-97);
- the profile menu Logout calls Session.

*Fix:* add the edges `pages --> lib`, `pages --> port` and `pages --> ui` to the first mermaid block, and add to the caption:
> "Features never import other features; cross-feature composition happens in `pages/` (Login composes `auth` + `forgot-password`) or in `features/shell` via props/render-slots (bell → `notifications`). `src/config.js` may be imported by `features/` and `lib/` only."

**H2. AD-9's storage monopoly and fixed Session shape give FR-30's lockout counter, and the remembered redirect, no home.** *(AD-9 Rule; FR-30, FR-11, FR-34; addendum A.4 rule 3)*
FR-30 requires a failed-attempt count and lockout end time that "survive page reload". That needs `localStorage`. AD-9 says `session.js` is "the only code that touches storage" and that it writes "exactly `{ username, displayName, dashboardState, issuedAt, expiresAt }`". So `features/auth` cannot persist the counter, and `session.js` cannot hold it without breaking "exactly". Two builders will each pick a different workaround: a second storage key in `features/auth`, or extra fields in the Session. The same gap exists for the remembered path that FR-34 needs after an expiry-driven redirect.
*Fix:* add to AD-9 Rule:
> "`session.js` also owns `suretrack.loginAttempts` = `{ count, lockedUntil }` (FR-30, per browser, survives reload) with `getAttempts()/recordFailure(policy)/resetAttempts()`; the remembered return path travels only in router location state (`state.from`) and is never stored."

**H3. AD-4 bans the viewport-relative sizing that the panels and the modal require.** *(AD-4 "Not allowed"; FR-36, FR-97, FR-101; AD-14 profile panel)*
AD-4 forbids "`vw`/`vh`/`%`-based sizing of designed elements". But:
- FR-97 makes the Notifications panel "height 100% of the viewport";
- FR-101 makes the list fill "the remaining panel height";
- FR-36 centres the modal in the viewport;
- AD-14's profile panel copies the full-height 290×768 Figma panel.

With a left-aligned fixed canvas (AD-4) and a `position: fixed; right: 0` panel (FR-97), the panel also detaches from the canvas on viewports wider than 1366 px. Two builders will diverge: one uses `height: 768px`, the other uses `100vh`, and the anchors differ too.
*Fix:* add to AD-4 Rule:
> "**Overlay exception:** overlays (AD-12) are viewport-positioned: modal centred with `position: fixed; inset: 0` + flex centring; Notifications and profile panels `position: fixed; top: 0; height: 100dvh` and right-anchored to the canvas edge (`left: 1076px` inside a fixed 1366 px overlay layer), never to the viewport edge. Area right of the canvas shows `--raw-f3f4f6` (Dashboard) / `#ffffff` (Login)."

**H4. The data port has no test seam, so FR-95 and FR-96 cannot be tested and latency per environment is undefined.** *(AD-7 Rule "300 ms in development and 0 ms in tests"; FR-95, FR-96, NFR-4)*
- **Imported JSON:** the JSON is imported (bundled), so the error/Retry path in FR-96 ("network error, non-2xx or invalid JSON … testable by intercepting the JSON request") has no request to intercept.
- **Latency switch:** "0 ms in tests" can be switched on `import.meta.env.MODE === 'test'` under Vitest only. Playwright behaviour and fidelity runs hit the dev server (300 ms) or `vite preview` (production mode, latency unspecified).
- **Loading state:** with 0 ms, the FR-95 loading placeholders cannot be observed.

Each test author will invent a different hook.
*Fix:* add to AD-7 Rule:
> "`api.js` reads one test seam: URL/query `?__latency=<ms>` and `?__fail=dashboard|notifications|users` honoured only when `import.meta.env.DEV || import.meta.env.MODE === 'test'`. Default latency: dev 300 ms, test 0 ms, production build 0 ms. Fidelity specs pass `__latency=0`; behaviour specs use `__latency=500` to see FR-95 and `__fail=dashboard` for FR-96. Rejections use `{ code: 'LOAD_FAILED' | 'INVALID_JSON', message }`."

Also see reconcile-prd H2 for the PRD side (addendum B `/data/*.json`).

### Medium

**M1. Login latency is owned twice (AD-7 and AD-14).** AD-7 gives every port Promise 300 ms in development. AD-14 says login uses `policy.simulatedLatencyMs` (800 ms). It is unclear whether `getUsers()` adds 300 + 800 ms, or where the per-account delay and the 15 s `requestTimeoutMs` (FR-31, A.4 rule 4) live. *Fix:* in AD-14 Latency, write:
> "`getUsers()` resolves with 0 ms latency; `features/auth` applies `account.simulatedLatencyMs ?? policy.simulatedLatencyMs` and the `policy.requestTimeoutMs` race; `features/forgot-password` applies `policy.simulatedLatencyMs`. AD-7's 300 ms applies to `getDashboard` and `getNotifications` only."

**M2. Session expiry has no owner.** FR-34 fires "when the user navigates or performs an action that loads data". In the graph `api.js` cannot see `lib/session.js`, and `RequireSession` sees only route changes. *Fix:* add to AD-9:
> "`RequireSession` checks `expiresAt` on every location change; `pages/Dashboard` calls `session.assertValid()` before each `getDashboard()`/`getNotifications()` and Retry; on expiry both call `session.expire(currentPath)` which clears the key and navigates to `/login` with `state.from` and `state.notice = 'expired'`."

**M3. The token naming convention collides.** Figma has button `md` = 10 and Dashboard `md` = 6 (FR-2; PRD review-rubric low). Under AD-2 both become `--md`. Rgba and 8-digit values (`#000000cc`, `rgba(0,0,0,0.8)`) have no `--raw-` spelling. *Fix:* in AD-2 and Consistency Conventions, write:
> "Collisions are prefixed by Figma collection: `--button-md`, `--dash-md`. Alpha colours: `--raw-<rrggbbaa>` lowercase (e.g. `--raw-000000cc`)."

**M4. The Nav tab active icons cannot be built under AD-5.** FR-52 shows Equipment or Alerts in the active style on their placeholder routes. Only the black `garage.svg` and `nav_danger.svg` were exported. AD-5 forbids recolouring and allows only two hand-authored exceptions. *Fix:* add to AD-5:
> "Active Nav tab variants (Figma `6229:37003`, `6223:34415`) are exported as `garage-active.svg`, `nav_danger-active.svg` before the shell story"

Also add the export to Deferred next to the Logout icon.

**M5. AD-5's list of hand-authored exceptions is incomplete.** The [ASSUMPTION] visuals also need hand-made vectors:
- the FR-23 and FR-47 spinners;
- the FR-99 toggle OFF state;
- the FR-42 tooltip.

As written, AD-5 forbids all of them. *Fix:* replace the Hand-authored bullet with:
> "Hand-authored SVG is allowed only for (a) right chevron, (b) Login/Submit spinner, (c) toggle OFF state, each in `src/assets/icons/authored/` using tokens; every other vector comes from `figma-assets/`."

**M6. Several Rules have no enforcement, which the checklist requires.**
- The import-direction graph has no lint rule.
- "Nothing imports `src/data/json/*` except `api.js`" (NFR-7, SM-4 proxy) has no lint rule.
- AD-16 "JSX contains no literal user-visible text" has no lint rule.
- NFR-8 `no-console` has no lint rule.

`.oxlintrc.json` today has only `rules-of-hooks` and `only-export-components`. *Fix:* add a Consistency Conventions row:
> "Enforcement | `.oxlintrc.json` adds `no-console: error`, `no-restricted-imports` patterns per layer (e.g. `**/data/json/*` allowed only in `src/data/api.js`; `**/pages/**` and `**/app/**` banned below `pages/`), and `react/jsx-no-literals` (or a Vitest grep test where oxlint lacks it); `npm run lint` runs in CI."

**M7. AD-13's verification ("identical with state styles removed") has no mechanism.** *Fix:* add to AD-13:
> "Fidelity specs run twice per frame: normally, and with `?__nostates=1`, which `src/app/main.jsx` honours in DEV by adding `data-nostates` to `<html>`; every `/* states */` block is wrapped in `:root:not([data-nostates]) …`. Both captures must equal the baseline."

The simpler alternative is to drop the clause and rely on the at-rest capture.

**M8. AD-6's `font-display: block` will not survive a plain `@fontsource` import.** The `@fontsource/*` per-weight CSS files declare `font-display: swap`. A builder who writes `import '@fontsource/roboto/600.css'` silently breaks AD-6. You also need to confirm that `@fontsource/roboto` 5.3.0 ships 600 and 800 as static files. Older Roboto packages shipped only 100/300/400/500/700/900, and a missing file leads to synthetic bold and a fidelity failure. *Fix:* add to AD-6:
> "`src/styles/fonts.css` declares its own `@font-face` blocks (`font-display: block`) whose `src` points at the `@fontsource` WOFF2 files; the package CSS files are never imported. A unit test asserts every weight file 400/500/600/700/800 (Roboto) and 400–700 (Inter) resolves."

If 600 and 800 are missing, use `@fontsource-variable/roboto`.

**M9. Repo ratification gaps (brownfield).**
- `index.html` loads `/src/main.jsx`, but the seed moves the entry to `src/app/main.jsx`.
- The template leftovers `src/App.jsx`, `App.css`, `index.css`, `assets/hero.png`, `react.svg` and `vite.svg` are not mentioned.
- `<title>agi-cursor2</title>` and `public/favicon.svg` are shared with Markdown Studio.
- `vite.config.js` uses `@rolldown/plugin-babel` with `reactCompilerPreset()`, which the Stack table omits.

*Fix:* add a Structural Seed note:
> "Story 0 moves the entry to `src/app/main.jsx` and updates `index.html` `<script src>`; deletes `src/App.jsx`, `App.css`, `index.css`, `src/assets/{hero.png,react.svg,vite.svg}`; sets `<title>AGI SureTrack Farm</title>` and adds `<div id="overlay-root">`; keeps `vite.config.js` plugins in order (`aclMarkdownSaverPlugin`, `react`, `babel(reactCompilerPreset)`) and appends nothing else."

Also add `@rolldown/plugin-babel 0.2.4` and `@babel/core 7.29.7` to the Stack table.

**M10. The CI side of the operational envelope is not decided.**
- **Scripts:** `package.json` has no `test`, `test:unit` or `test:e2e` script.
- **CI system:** `.github/` holds only `copilot-instructions.md`, and the spine names neither the CI system nor the workflow file.
- **Server under test:** the spine does not say which server Playwright runs against (dev vs `vite preview`).

*Fix:* replace the CI bullet with:
> "**CI:** GitHub Actions `.github/workflows/app-ci.yml` on `macos-14`, Node 22.23.4: `npm ci` → `npm run lint` → `npm run build` → `npm run test:unit` (Vitest) → `npm run test:e2e` (Playwright `webServer: vite preview --port 4173`, behaviour + fidelity). Scripts `test:unit`, `test:e2e`, `test:e2e:update` added to `package.json`."

**M11. Windows developers cannot run or refresh fidelity baselines.** The repo is developed on Windows, while AD-15 requires macOS Chromium. Local `toHaveScreenshot` runs will either fail or write `-win32` snapshots next to the darwin ones. *Fix:* add to AD-15:
> "`snapshotPathTemplate: 'tests/fidelity/__baselines__/{arg}{ext}'` (no platform suffix); fidelity project is skipped unless `process.platform === 'darwin'`; baselines are updated only from the CI macOS job (`test:e2e:update` via workflow_dispatch). Windows developers run behaviour tests locally."

**M12. The deferred hosting leaves open choices that units make now.** Routes need a host-side SPA fallback for deep links (`/dashboard?state=small` reload). `netlify.toml` already rewrites `/` to Studio and publishes `src/public`, a directory that does not exist. `vite build` copies `public/markdown.html` and the Studio assets into the app's `dist/`. *Fix:* keep hosting deferred, but add these constraints:
> "App base path is `/` (no router `basename`); any host must rewrite non-file paths except `/api/*` and `/markdown*` to `/index.html`; the app's `dist/` is not deployed by the existing `netlify.toml`/`vercel.json` (Studio-only) until the hosting decision."

**M13. AD-15's measurement table has no owner or source format.** "A table generated from the PRD" cannot be generated mechanically from prose. It also contains approximate or UNKNOWN values (FR-53 "about 16 px", FR-65/FR-83 "~46", FR-79 "≈118", FR-87 "≈42–45 UNKNOWN") that would be audited at ±1 px. *Fix:* add to AD-15:
> "The audit reads one checked-in `tests/fidelity/measurements.json` (`{ fid, x, y, w, h, tolerancePx }`), authored per story from its FR consequences; `≈`/UNKNOWN values are entered as `informative: true` and skipped; tolerance ±1 px for boxes, 0 for colours/radii/font properties, 0 for Runtime bars (AD-14)."

### Low

- **L1. AD-10 binds the wrong FRs.** It binds FR-29 (expired password) and FR-55 (title strip). The FRs that carry routes are FR-11, FR-52, FR-56, FR-64 and FR-72. *Fix:* "Binds: FR-11, FR-52, FR-56, FR-57, FR-64, FR-72, FR-75, FR-93".
- **L2. AD-10's reserved list is incomplete.** The Vite middleware also claims `/markdownstudio`, `/markdownstudio.html`, `/acl-agents.json`, `/greenfield.svg`, `/brownfield.svg`, `/velocityone-studio-logo.png` and `/vo-icon.svg`, and `public/` holds `favicon.svg` and `icons.svg`. *Fix:* "Reserved: `/api/*`, `/markdown*`, `/acl-agents.json`, and every file name already in `public/`; the app adds nothing to `public/`."
- **L3. Unknown in-app paths are not decided.** Examples are `/foo` and `/equipment/759/unknown`. *Fix:* in AD-10, add "Any other path → `<Navigate to="/" replace>` (then FR-56)".
- **L4. The Capability map has no row for the §7 NFRs.** NFR-4 (performance), NFR-6 (browsers) and NFR-8 (code health) have no home. *Fix:* add the row "Cross-cutting NFR-1…8 | `app/`, CI, `tests/` | AD-4, AD-6, AD-7, AD-13, AD-15, Conventions". The Notifications row should also cite AD-13 and AD-16.
- **L5. AD-5's wording contradicts itself.** The Logout icon is listed as a "hand-authored exception" that "must be exported from Figma". *Fix:* move the Logout icon out of the Hand-authored bullet into a "Pending Figma exports" bullet.
- **L6. The Stack table differs from the repo.**
  - Vite is listed as 8.3.6, but `package.json` declares `^8.3.5` and 8.3.5 is installed.
  - `react-router` 8.5.1 silently replaces addendum C.1's "v7".
  - `react-router`, Vitest, Playwright, `@testing-library/react`, jsdom, sharp and `@fontsource/*` are not installed yet.

  *Fix:* add "(to add)" against the uninstalled packages, align Vite with the lockfile, and note that the 8.x choice supersedes C.1's "v7".
- **L7. The `figma-assets/` path is abbreviated.** The real source is `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-assets/`. *Fix:* use the full path in AD-5, and name the build-time `sharp` script, for example `tools/app/convert-silo.mjs`. Do not use `tools/`, which belongs to Studio. Use `scripts/convert-silo.mjs` instead.
- **L8. The storage-event listener does not filter by key.** Markdown Studio writes `localStorage` on the same origin (`__acl_atlassian_config__`). *Fix:* in AD-9, add "the `storage` listener acts only when `event.key === 'suretrack.session' && event.newValue === null`".
- **L9. AD-1 has no enforcement point.** "A PR must cite the revised Figma node" has nothing behind it. *Fix:* add a `.github/pull_request_template.md` checkbox, or drop the PR clause.

---

## 2. Is every AD Rule enforceable, and does it prevent the stated divergence?

| AD | Enforceable? | Prevents its divergence? | Note |
|---|---|---|---|
| AD-1 | Partly | Yes | L9 |
| AD-2 | Yes (colour audit + grep) | Partly | M3 naming collisions |
| AD-3 | Yes | Yes | — |
| AD-4 | Yes | Over-constrains | H3 |
| AD-5 | Yes | Partly | M4, M5, L5 |
| AD-6 | Yes | Silently breakable | M8 |
| AD-7 | Partly | Partly | H4, M1 |
| AD-8 | Yes (unit tests on B.8) | Yes | Good |
| AD-9 | Yes | Leaves FR-30 homeless | H2, M2, L8 |
| AD-10 | Yes | Mostly | L1–L3 |
| AD-11 | Yes | Yes, but contradicts the import graph | H1 |
| AD-12 | Yes | Mostly | See reconcile-prd M3 (bell toggle and panel focus trap) |
| AD-13 | No mechanism | Intent right | M7 |
| AD-14 | Yes | Yes for its 6 items | Several open PRD conflicts not covered (reconcile-prd M3, M9) |
| AD-15 | Partly | Partly | M11, M13 |
| AD-16 | Needs lint | Yes | M6 |

## 3. Could anything under Deferred let two units diverge?

- **Production hosting** → yes (M12): base path and SPA fallback.
- **Logout icon asset** → it is an export dependency, not a divergence. The active Nav icons belong in the same list (M4).
- **The other deferred items** do not let units diverge: Real API, Responsive, Chart tooltips, PRD follow-up and Observability.

## 4. Ratifies the existing repo?

Mostly yes: React 19.3.1, Vite 8, plugin-react 6.2.1, React Compiler, oxlint and Node 22.23.4 match what is installed, and the reserved Studio paths are correctly identified. The gaps are M9 (entry path, template leftovers, rolldown babel), L2 (reserved paths) and L6 (versions).

## 5. Capability map vs PRD §4 headings

| PRD §4 heading | FR range | Spine row | Status |
|---|---|---|---|
| 4.1 Design Foundation | FR-1–FR-10 | Design Foundation | ✔ |
| 4.2 Login Page | FR-11–FR-35 | Login page | ✔ |
| 4.3 Forgot Password Modal | FR-36–FR-49 | Forgot Password modal | ✔ |
| 4.4 App Shell & Header | FR-50–FR-58 | App shell and Header | ✔ |
| 4.5 KPI Strip | FR-59–FR-64 | KPI strip | ✔ |
| 4.6 Equipment Card | FR-65–FR-72 | Equipment card | ✔ (FR-65 card shell is shared; `ui/CardShell` is not listed in "Lives in") |
| 4.7 Recent Alerts Card | FR-73–FR-77 | Recent Alerts card | ✔ |
| 4.8 Fan Activity Card | FR-78–FR-82 | Fan activity card | ✔ |
| 4.9 + 4.10 Grain / Liquid | FR-83–FR-92 | Grain and Liquid On Hand | ✔ (merged) |
| 4.11 Dashboard States | FR-93–FR-96 | Dashboard states and loading | ✔ |
| 4.12 Notifications Panel | FR-97–FR-101 | Notifications panel | ✔ |
| §8 Fidelity check | — | Fidelity check | ✔ |
| §7 NFR-1…8 | — | none | ✘ (L4) |

FR-1…FR-101 are fully covered, with no gaps or overlaps.

## 6. Dimensions owned at feature altitude

| Dimension | State |
|---|---|
| Layering / dependency rule | Decided; contradictory (H1) |
| Data contracts and access | Decided; test seam missing (H4) |
| State and Session | Decided; FR-30 gap (H2), expiry owner (M2) |
| Routing | Decided (L1–L3) |
| Styling, tokens, fonts, assets | Decided (M3, M4, M5, M8) |
| Overlays and focus | Decided (H3) |
| Error handling | Decided (`{code,message}`) |
| Testing strategy | Decided; ownership, platform and seam gaps (M11, M13, H4) |
| Lint and enforcement | Not decided (M6) |
| Environments: local | Decided |
| Environments: CI | Named, not specified (M10) |
| Environments: production / deploy | Deferred, with an unbounded constraint (M12) |
| Observability | Deferred (fine) |
| Security (password never stored) | Decided (AD-9) |
| Performance budget (NFR-4, NFR-3) | Not decided (see reconcile-prd M5) |
| Browser matrix (NFR-6) | Not decided (see reconcile-prd M6) |

## 7. Mermaid syntax check

Both blocks were checked by hand against the flowchart grammar. **No syntax errors were found.**
- **Block 1** (`flowchart TD`): the bracket labels use `:` and `·` without parentheses or quotes. That is valid. Every node ID is unique, and no ID is a reserved word.
- **Block 2** (`flowchart LR`) uses:
  - edge labels `|/login|`, `|/dashboard|` and `|other app routes|`;
  - a decision node `S{…}` and a cylinder `J[(…)]`;
  - a bidirectional labelled edge `SE <-->|storage event| T`, which needs Mermaid ≥ 9.x;
  - a quoted subgraph title `studio["…"]` and quoted labels containing `/` and `*`.

  All of these are valid. The `studio` subgraph nodes have no edges, which is allowed. To check how they render, preview them in Markdown Studio.

There is a semantic issue, not a syntax one: Block 1 and Block 2 disagree on allowed edges (H1).

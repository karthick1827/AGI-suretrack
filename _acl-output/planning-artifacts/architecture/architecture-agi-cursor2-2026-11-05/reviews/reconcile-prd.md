---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T11:00:12.080Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
---

# Input Reconciliation: Approved PRD → Architecture Spine

- **Spine under check:** `../ARCHITECTURE-SPINE.md` (not modified)
- **Inputs:**
  - `prd.md` (Approved): FR-1…FR-101, §7 NFR-1…8, §8 Fidelity check;
  - `addendum.md`: A (`users.json`), B (state files and notifications), C (implementation notes);
  - the PRD's `review-rubric.md` and `reconcile-brief.md`.
- **Method:**
  - Walked every PRD section, NFR, §8 check and addendum contract.
  - Hunted "quiet" requirements: at-rest look, verbatim copy, 0 / ±1 px tolerances, cross-tab Logout within 1 s, Back after logout, and the runtime config.
  - Recorded each item as **landed**, **superseded (declared)**, **MISSING** or **CONTRADICTED (undeclared)**.
- **Not flagged:** the spine declares these overrides. They are correct, and they are listed in Deferred → "PRD follow-up":
  - AD-9 supersedes C.2 `sessionStorage`;
  - AD-10 supersedes the C.1 routes;
  - AD-14 settles tooltips, Roboto 400–800, Runtime 0 px, the profile panel, dryer alerts and login latency.

## Summary verdict

**Pass with fixes.** Most of the build contract lands:
- Figma precedence (AD-1);
- tokens verbatim with no rounding (AD-2);
- fractional px kept (AD-2);
- verbatim readings and copy (AD-7, AD-16);
- the Health, Grain and Liquid formulas with B.8 unit tests (AD-8);
- `barPx` at 0 px (AD-14);
- the cross-tab Logout ≤ 1 s (AD-9);
- the at-rest-look rule (AD-13);
- the §8 tool settings (AD-15).

The rest falls into three groups:
- **Four undeclared contradictions:** the runtime legal-URL config, the static `/data/*.json` location with the FR-96 failure path, the FR-30 reload-surviving counter, and viewport-relative overlays.
- **Unlanded quiet requirements:** Back/bfcache after logout, the session-expiry trigger, the performance and size budgets, the browser matrix, the colour audit, and the §8 tolerances.
- **Unresolved PRD conflicts:** a handful that the PRD review raised and AD-14 does not settle.

**Counts (trace table, 41 rows):** landed 19 · superseded (declared) 5 · partly 5 · MISSING 8 · CONTRADICTED (undeclared) 4. These are **27 findings** to fix: High 4 · Medium 13 · Low 10.

---

## Findings

### High: contradicted without a declared supersede

**H1. FR-20 / addendum A.4 rule 7 versus the Consistency Conventions "Config" row.**
- **The PRD:** the legal URLs "are read at runtime from a configuration file so they can change without a code release", in "a separate runtime configuration file".
- **The spine:** puts them in `src/config.js`, which is bundled. Changing a URL then needs a rebuild and release, which breaks SCRUM-31 AC4.

*Fix:* replace the Config row with:
> "Legal URLs and Coach number live in `public/app-config.json` (served at `/app-config.json`, not a reserved Studio path), fetched once by `api.js` `getConfig()` with placeholders `https://example.com/privacy-policy`, `https://example.com/terms-of-service`; `src/config.js` holds only build-time constants."

Alternatively, add to AD-14:
> "FR-20's runtime-config consequence is superseded: URLs are build-time in `src/config.js`; AGI accepts a release per URL change."

Then add it to the PRD follow-up list.

**H2. Addendum B "Location" and FR-96 versus AD-7.**
- **The PRD:** addendum B serves the files as static `/data/dashboard.*.json` and `/data/notifications.json`. FR-96 defines failure as "network error, non-2xx or invalid JSON … testable by intercepting the JSON request".
- **The spine:** AD-7 has `api.js` *import* the JSON from `src/data/json/`, which follows C.2. There is no request, so non-2xx and invalid JSON cannot happen and cannot be intercepted.

The spine picks C.2 over B without saying so, and it leaves FR-96 with no way to be verified.

*Fix:* add to AD-7:
> "Supersedes addendum B 'Location': state files are bundled imports, not `/data/` URLs. FR-96 failures are simulated through the `api.js` test seam (`?__fail=dashboard` in DEV/test → reject `{ code: 'LOAD_FAILED' }`; `?__fail=dashboard:json` → `{ code: 'INVALID_JSON' }`); behaviour specs use the seam instead of request interception."

Add FR-96's "intercept" wording to the PRD follow-up. See review-rubric H4 for the seam itself.

**H3. FR-30 and addendum A.4 rule 3 versus AD-9.**
- **The PRD:** the wrong-credential count and lockout are "kept per browser … and survive page reload". During a lockout, "reloading the page keeps the button disabled and the banner shown".
- **The spine:** AD-9 makes `session.js` the only storage writer, with exactly five Session fields.

The lockout state can then live only in memory, which fails FR-30 on reload, or in an undeclared second key, which breaks AD-9.

*Fix:* add to AD-9:
> "`session.js` also persists `localStorage['suretrack.loginAttempts'] = { count, lockedUntil }` (FR-30); it survives reload and logout, is reset on success or lockout end, and never contains the username or password."

**H4. FR-36, FR-97 and FR-101 versus AD-4 "Not allowed: `vw`/`vh`/`%`-based sizing".**
- **The PRD:**
  - FR-97: panel "height 100% of the viewport";
  - FR-101: the list "fills the remaining panel height";
  - FR-36: modal "centred horizontally and vertically in the viewport".
- **The spine:** bans that sizing for designed elements. AD-14's profile panel inherits the same need.

*Fix:* add to AD-4:
> "Exception: AD-12 overlays are viewport-positioned (`position: fixed`; panels `height: 100dvh`, list `flex: 1`; modal centred via flex on a fixed full-viewport layer), anchored to the 1366 px canvas's right edge."

### Medium: missing

**M1. FR-35: Back after logout must not show data, "including pages restored from the browser's back-forward cache".** Nothing in the spine covers this. React state survives a bfcache restore. *Fix:* add to AD-9:
> "`src/app/main.jsx` listens for `pageshow` with `event.persisted` and, if `session.get()` is null, calls `location.replace('/login')`; Logout navigates with `replace: true` and clears in-memory Dashboard data."

**M2. FR-34 session expiry trigger.** The PRD says expiry is detected "when the user navigates or performs an action that loads data". It also requires the remembered page and the exact banner `Your session has expired. Please sign in again.` The spine names no owner, and the import graph stops `api.js` from seeing `session.js`. *Fix:* follow review-rubric M2:
> "`RequireSession` checks `expiresAt` on each location change; pages call `session.assertValid()` before each port call; on expiry → `/login` with `state.from` and `state.notice='expired'`."

**M3. FR-53's last consequence versus FR-97 and NFR-5 is unresolved.** This was a PRD review medium. The panel covers the bell (x 1076–1366), and NFR-5 traps focus in the panel. "Activating [the bell] while the panel is open closes the panel" is therefore unreachable. AD-12 traps focus for every overlay, which makes the panel modal for focus while FR-97 keeps the page scrollable and ignores outside clicks. *Fix:* add to AD-14:
> "**Bell toggle:** FR-53's 'activating the bell while open closes the panel' is withdrawn (the panel covers the bell); the panel closes by ✕ or Esc only. The panel traps focus (NFR-5) but not scroll or pointer."

Then add it to the follow-up list.

**M4. FR-1's last consequence (colour audit) has no test home.** The consequence reads: "A colour-audit test finds no colour value in the rendered styles … that is not one of the tokens". AD-15 lists the screenshot and measurement audits only. *Fix:* add to AD-15:
> "A colour audit walks every element's computed `color`, `background-color`, `border-*-color`, `outline-color`, `fill`, `stroke` and checks membership in the resolved values of `tokens.css` (silo photo and avatar excluded)."

**M5. NFR-4 and NFR-3 budgets did not land.**
- **NFR-4:** Login LCP ≤ 1.5 s, Dashboard renders from JSON in ≤ 300 ms, CLS = 0.
- **NFR-3:** silo photo ≤ 600 KB.

There is also a conflict: AD-7's 300 ms development latency means the Dashboard cannot render in ≤ 300 ms in development. *Fix:* add an AD-15 bullet:
> "Budgets: a Playwright spec on the preview build (latency 0) asserts Login LCP ≤ 1500 ms, Dashboard content visible ≤ 300 ms after navigation, `CLS === 0` via `PerformanceObserver`; a unit test asserts `login-bg.webp` ≤ 600 KB."

**M6. NFR-6 browser matrix.** The PRD supports the latest two versions of Chrome, Edge, Safari and Firefox. The spine's CI runs Chromium only, and nothing says which tests run elsewhere. The PRD review-rubric suggests that behaviour tests run on all supported browsers, while the Fidelity check runs on Chrome/macOS only. *Fix:* add to the Environments CI bullet:
> "Playwright projects: `fidelity` (Chromium, darwin only); `behaviour` on Chromium, Firefox, WebKit (Safari proxy) and `channel: 'msedge'` where available."

**M7. §8 check 2 tolerances are not carried into AD-15.**
- **The PRD rule:** boxes within ±1 px; colours, radii, borders and font properties exact; Health and Fill segments within ±1 px of their formula (§8 check 4); Runtime bars at 0 px (AD-14).
- **The gap:** AD-15 names the measurement audit but gives no tolerance values.
- **Approximate values:** the PRD's own "≈"/UNKNOWN figures (FR-53, FR-65, FR-79, FR-83, FR-87) would fail a strict ±1 px audit.

*Fix:* in AD-15, add:
> "Measurement tolerances: box ±1 px; colour, radius, border width, font family/weight/size/line-height/letter-spacing exact; Health/Fill segments ±1 px; Runtime bars 0 px. Values marked ≈ or UNKNOWN in the PRD are informative and excluded."

**M8. FR-95: the loading placeholders must be observable.** With AD-7's 0 ms test latency, no behaviour test can see the FR-95 placeholders or the "no element moves" rule. *Fix:* use the test seam from review-rubric H4: `?__latency=500` in behaviour specs.

**M9. FR-46 versus FR-49: disabled Submit focusability is unresolved.** This was a PRD review low, but one with divergence risk.
- **FR-49:** the tab order includes Submit.
- **FR-46:** Submit is disabled while the email is invalid. A native `disabled` button is not focusable.

One builder uses `disabled` and another uses `aria-disabled`, so the tab-order tests diverge. *Fix:* add to AD-14:
> "Disabled controls that stay in the FR-49/FR-21 tab order use `aria-disabled="true"` + a click guard, not the `disabled` attribute; FR-30's lockout button uses native `disabled` (FR-30 says 'not focusable')."

**M10. FR-31 and addendum A.4 rule 4: per-account latency and the timeout race have no owner.** The PRD defines the account's `simulatedLatencyMs` and `policy.requestTimeoutMs` (15 000 ms; the `slow` account). AD-14 mentions only the 800 ms policy, and AD-7 adds its own 300 ms. *Fix:* in AD-14's Latency bullet, write:
> "`getUsers()` has no added latency; `features/auth` waits `account.simulatedLatencyMs ?? policy.simulatedLatencyMs`, raced against `policy.requestTimeoutMs`; `features/forgot-password` waits `policy.simulatedLatencyMs` (FR-47)."

**M11. FR-2 token name collision.** Button `md` is 10 and Dashboard `md` is 6. AD-2's rule of "named after the Figma variable" produces `--md` twice. *Fix:* follow review-rubric M3 and prefix by collection: `--button-md`, `--dash-md`.

**M12. FR-52: the active-tab icons on `/equipment` and `/alerts` cannot be built.** FR-52 requires the Header variants `6229:37003` and `6223:34415`. Only the inactive black icons were exported, and AD-5 forbids recolouring. *Fix:* add the two active-icon exports to AD-5 and Deferred, as was done for the Logout icon.

**M13. NFR-2 "`font-display: block` so the first paint never shows a fallback font" can silently fail.** AD-6 states the rule, but a builder importing the `@fontsource` CSS gets `font-display: swap`. *Fix:* follow review-rubric M8: write custom `@font-face` rules in `fonts.css` and never import the package CSS.

### Low

- **L1. FR-47 confirmation copy.** The PRD keeps the straight apostrophe in `we've` from SCRUM-29, and flags it in its Notes. AD-16's example list mentions only U+2019, which a builder could read as "always typographic". *Fix:* add to AD-16: "Copy is copied per string; `we've` in FR-47 keeps U+0027 until AGI confirms."
- **L2. FR-25 "Login page is replaced in history"** is missing. *Fix:* add to AD-10: "Post-sign-in and Logout navigations use `replace: true`."
- **L3. FR-11 "only same-origin, in-app paths are remembered"** is missing. This is a small open-redirect guard that two builders would write differently. *Fix:* add to AD-10: "Remembered `from` is accepted only if it starts with `/` and not `//`, and is not `/login`."
- **L4. The §4.4 conventions put `font-variation-settings: "wdth" 100` on the SF stack.** AD-6 omits it. FR-4 calls it "not required". *Fix:* state in AD-6 that it is omitted.
- **L5. FR-12 offers two compositions** (two mirrored layers, or one composited @2x background). AD-5 implies derivatives but does not choose. *Fix:* "Login background = two mirrored `<img>` layers of `login-bg.webp/.jpg` per FR-12; no composited export."
- **L6. FR-10 versus §8 masks.** FR-10 masks only the silo, while §8 masks the silo and the avatar. AD-15 follows §8 without saying so. *Fix:* add "FR-10 mask list superseded by §8" to the PRD follow-up.
- **L7. The PRD follow-up list in Deferred omits several reconcile-brief gaps:**
  - Gap 11: SF Pro font tokens `font/weight/medium` 510 / `semibold` 590;
  - Gap 12: header divider visibility;
  - Gap 13: the duplicate UJ tags;
  - PRD review findings that AD-14 settled: FR-53 (M3) and FR-46 (M9).

  *Fix:* append them to the Deferred "PRD follow-up update" bullet.
- **L8. FR-52's Dashboard tab drops `?state=`** (PRD review low). *Fix:* add to AD-11: "Nav and placeholder links to `/dashboard` carry no `?state`; the resolver falls back to the Session's state."
- **L9. Accessible names are user-facing text, but AD-16 does not say they are copy.** Examples: `Notifications`, `Account menu`, `Close`, `Email help`, `Unread: <message>`. *Fix:* in AD-16, add "Accessible names and `aria-*` text are copy and live in `copy.js`."
- **L10. AD-14's profile panel has no Reference render.** `figma-reference/` holds no `6026:52937` export, so AD-15 cannot cover it. *Fix:* add "export `profile-6026-52937.png` baseline" to Deferred next to the Logout icon.

---

## Trace table: quiet requirements

| PRD requirement | Spine location | Status |
|---|---|---|
| Never change the at-rest look (§4 conventions, FR-9, FR-58, NFR-5) | AD-13 | landed (enforcement: review-rubric M7) |
| Verbatim copy: U+00B7, U+2019, typos (FR-8, FR-94, §8.3) | AD-16, AD-7 | landed (L1, L9) |
| Readings never recomputed (FR-94, §5) | AD-7 | landed |
| Fractional px kept, ±1 px measurement (FR-8, §8.2) | AD-2 Geometry; AD-15 | partly (M7) |
| Runtime bars 0 px (FR-80, B.8) | AD-14, AD-8 | superseded §8.4 (declared) |
| Health / Fill ±1 px of formula (§8.4) | AD-8 | landed (tolerance: M7) |
| Pixel diff 0.5%, threshold 0.1, DSF 1, macOS, masks (§8.1) | AD-15 | landed |
| Re-exported 1× baselines without shadow overflow (§8.1, C.4) | AD-15 | landed |
| Logout reaches every tab ≤ 1 s (FR-35) | AD-9 | landed |
| Back / bfcache after logout (FR-35) | — | MISSING (M1) |
| Session TTL / expiry banner (FR-34) | AD-9 fields | partly (M2) |
| Password never stored, in URL or in console (FR-24) | AD-9, Conventions | landed |
| Lockout survives reload (FR-30) | — | CONTRADICTED (H3) |
| Legal URLs change without a release (FR-20) | Conventions "Config" | CONTRADICTED (H1) |
| Failure path non-2xx / invalid JSON (FR-96) | AD-7 | CONTRADICTED (H2) |
| Panel full viewport height, modal centred in viewport (FR-36, FR-97, FR-101) | AD-4 | CONTRADICTED (H4) |
| Fonts self-hosted, no CDN, block display (NFR-1 §4.1, NFR-2) | AD-6 | landed (M13) |
| Roboto 700/800 (NFR-2 vs FR-4) | AD-14 | superseded (declared) |
| SVGs unmodified; chevron redrawn (FR-6, NFR-3) | AD-5 | landed (M12) |
| Silo ≤ 600 KB; occluded layers not shipped (NFR-3, FR-7) | AD-5 | partly (M5) |
| 1366 canvas, heights 1052/860/856 (NFR-1, FR-50) | AD-4 | landed |
| Wider viewport: left aligned, no stretch (NFR-1) | AD-4 | landed |
| Performance LCP / 300 ms / CLS 0 (NFR-4) | — | MISSING (M5) |
| Browser matrix (NFR-6) | — | MISSING (M6) |
| Data isolation via one module (NFR-7, SM-4) | AD-7 | landed (lint enforcement: review-rubric M6) |
| Build / lint clean, no console (NFR-8) | Conventions, CI | landed (lint rule: review-rubric M6) |
| Colour audit (FR-1) | — | MISSING (M4) |
| Session contract A.4 rule 5 (localStorage, 5 fields) | AD-9 | landed (supersedes C.2, declared) |
| Routes FR-57 / FR-75 | AD-10 | landed (supersedes C.1, declared) |
| State resolution `?state` → account → `full` (FR-93, C.2) | AD-11 | landed |
| `barPx`, `segmentPx`, `segmentTopPx`, `pageBottomSpacePx` (B.2) | AD-8, AD-4 | landed |
| Tooltips (FR-86, FR-90 vs §6.2) | AD-14 | superseded (declared) |
| Hover scope (FR-9 vs FR-58) | AD-13 | superseded (declared) |
| Profile menu (FR-54) | AD-14 | superseded (declared) |
| Dryer alerts (SCRUM-38 AC6, reconcile-brief Gap 7) | AD-14 | landed |
| Bell toggle vs panel (FR-53 / FR-97) | — | MISSING resolution (M3) |
| Disabled focusability (FR-46 / FR-49) | — | MISSING resolution (M9) |
| Timeout and per-account latency (FR-31, A.4 rule 4) | AD-14 (partial) | partly (M10) |
| Loading placeholders observable (FR-95) | AD-7 | partly (M8) |
| History replace after sign-in (FR-25) | — | MISSING (L2) |
| Same-origin remembered path (FR-11) | — | MISSING (L3) |

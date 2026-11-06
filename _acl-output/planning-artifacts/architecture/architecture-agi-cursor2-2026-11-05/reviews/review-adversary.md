---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T11:00:08.742Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
---

# Review: Adversary — ARCHITECTURE-SPINE.md (AGI SureTrack Farm Web)

**Reviewer lens:** Construct two units one level down that each obey every AD to the letter yet still build incompatibly — clashing shared-data shapes, two owners of one entity, conflicting state-mutation paths. Every pair is a hole to close with a new or tightened AD.
**Date:** 2026-11-05
**Units considered:** Foundation (tokens/fonts/app), Login, Forgot-password, Session/guard, Header/shell, Placeholder, KPI strip, Equipment card, Recent Alerts card, Fan activity card, Grain card, Liquid card, Dashboard page (state/loading/error), Notifications panel, Data/JSON, Behaviour tests, Fidelity tests.
**Inputs read:** the spine; PRD FR-23…FR-35, FR-53…FR-58, FR-75…FR-77, FR-93…FR-101; PRD addendum §A, §B, §C.

## Verdict

**Fail — 1 critical and 6 high holes.** The spine is strong on visual fidelity, but it leaves shared runtime entities without a single owner: route helpers, the overlay registry, session/lockout storage, the Header's data, the card contract, and the JSON transport. Two of these (H-1, H-2) make the spine contradict itself. Each hole below names the colliding pair and the exact AD text to add.

---

### H-1 [CRITICAL] Route helpers live in `app/`, which nothing below may import

- **Pair:** *Recent Alerts card story* vs *Equipment/KPI card story*.
  - AD-10: "links are built with route helpers from `routes.jsx`, never string-concatenated in components." `routes.jsx` is in `src/app/`.
  - Layering rule: "Nothing imports `pages/` or `app/` from below."
  - Unit A obeys AD-10 and imports `equipmentActionPath()` from `app/routes.jsx` (breaks layering, and creates the cycle `app/routes.jsx → pages → features → app/routes.jsx`). Unit B obeys layering and writes `` `/equipment/${deviceId}/${actionKey}` `` (breaks AD-10). Every link-bearing card must break one rule, and different builders will break different ones.
- **Fix — tighten AD-10 Navigation:**
  > **Path helpers:** `src/lib/paths.js` (pure, no React, no router import) is the single source of every app URL: `PATHS` constants and builders `loginPath({ from })`, `dashboardPath({ state })`, `equipmentPath({ type, status })`, `equipmentDevicePath(deviceId)`, `equipmentActionPath(deviceId, actionKey)`, `alertsPath()`. `src/app/routes.jsx` builds the route table from `PATHS`; features and pages import builders from `lib/paths.js` only. No component writes a `/`-prefixed string literal.

### H-2 [HIGH] "Only one overlay open" has no owner under "React local state per feature"

- **Pair:** *Header/shell (profile menu) story* vs *Notifications panel story*.
  - Conventions: "React local state per feature; no global store library." So ProfileMenu keeps `menuOpen` in `features/shell`, NotificationsPanel keeps `panelOpen` in `features/notifications`. Both portal into `#overlay-root` per AD-12.
  - Panel does not close on outside click (FR-97), so clicking the avatar while the panel is open opens the menu too: two overlays open, Esc closes which one? AD-12 "only one is open at a time" is unenforceable without shared state, and the obvious place (`app/OverlayRoot.jsx`, per the seed) is unimportable from `features/` (H-1's rule).
  - Focus trap clash: AD-12 traps focus in every overlay, but FR-53 says activating the bell while the panel is open closes it. A keyboard user trapped in the non-modal panel cannot reach the bell; the Notifications builder drops the trap to satisfy FR-53, the shell builder keeps it — two behaviours for "one mechanism".
- **Fix — replace AD-12 Rendering/Behaviour:**
  > **Owner:** `src/ui/overlay/` exports `OverlayProvider`, `useOverlay()` → `{ openId, open(id, triggerEl), close() }` and `<Overlay id kind="modal|menu|panel">`. `OverlayProvider` is mounted once in `src/app/App.jsx`; it is the only holder of open/closed state. `open()` closes any other overlay first, without returning focus to that overlay's trigger. Features never keep their own open boolean.
  > **Ids:** `forgot-password`, `profile-menu`, `notifications` (constants in `ui/overlay/ids.js`).
  > **Kinds:** `modal` — scrim, focus trapped, click-outside closes (Forgot Password). `menu` — no trap, click-outside and Esc close (profile menu). `panel` — no trap, no scrim, click-outside does not close, Esc and ✕ close, trigger toggles (Notifications). All kinds return focus to the trigger on close.
  > `#overlay-root` is a static `<div>` in `index.html`.

### H-3 [HIGH] Storage beyond the session (lockout counter, return-to URL, expiry reason) has no owner

- **Pair:** *Login story* (`features/auth` lockout hook, per the seed) vs *Session/guard story*.
  - AD-9: "`session.js` is the only code that touches storage" and it writes exactly one key. FR-30 needs a failure count and lockout end that survive reload, "per browser". The Login builder either writes `localStorage['suretrack.attempts']` from the hook (breaks AD-9) or keeps it in React state (breaks FR-30). The Session builder, not knowing about it, writes a `storage` listener that reacts to *any* key change and logs every tab out when another tab records a failed attempt.
  - FR-34/FR-56 "remember the requested page" and "Your session has expired" banner: Guard builder passes `?redirect=` and `?reason=expired` in the query; Login builder reads `location.state.from`. Both are reasonable; they do not meet.
  - Expiry check location: Data story makes `api.js` reject `{ code: 'SESSION_EXPIRED' }`; Guard story checks `expiresAt` in `RequireSession`. The port cannot import `lib/session.js` (arrows: port → adapter only), so the first is a layering break, but nothing says so.
- **Fix — extend AD-9:**
  > **Keys (exhaustive):** `session.js` owns `suretrack.session` and `suretrack.signin-attempts` (`{ count: int, lockedUntil: epochMs | null }`, FR-30). Its API: `getSession(now)`, `startSession(account, policy, now)`, `endSession()`, `getAttempts(now)`, `recordFailure(policy, now)`, `resetAttempts()`, `onSessionEnded(cb)`. No other module calls `localStorage`/`sessionStorage`.
  > **Cross-tab:** the `storage` listener reacts only to `suretrack.session` becoming `null`.
  > **Expiry:** checked only by `getSession(now)`, which returns `null` and removes the key when `now ≥ expiresAt`. `api.js` knows nothing of sessions.
  > **Redirect contract:** `RequireSession` redirects with `<Navigate to="/login" replace state={{ from: pathname + search, reason: 'required' | 'expired' }} />`; Login reads only `location.state` and, on success, navigates to `state.from ?? dashboardPath()`; the expiry banner shows only when `reason === 'expired'`.

### H-4 [HIGH] Session record field types unspecified; tests seed it independently

- **Pair:** *Session story* vs *Fidelity/Behaviour test story*.
  - AD-9 fixes the field *names* `{ username, displayName, dashboardState, issuedAt, expiresAt }` but not types. Session story writes `issuedAt: Date.now()` (number); Fidelity story (PRD C.4 "seeded Session") seeds via `addInitScript` with ISO strings. `Date.now() >= "2026-11-05T…"` is `false` → never expires in tests but the guard's `typeof` check in another branch treats it as corrupt → redirect to `/login` → every fidelity capture is the Login page.
- **Fix — append to AD-9:**
  > **Record:** `{ v: 1, username: string, displayName: string, dashboardState: 'full'|'small'|'allgood', issuedAt: int epoch ms, expiresAt: int epoch ms }`. A record failing this shape is treated as absent and removed. `session.js` exports `createSessionRecord(account, policy, now)`; test fixtures (`tests/fixtures/session.js`) import it to seed storage and never hand-write the record.

### H-5 [HIGH] Header data has two possible owners; Placeholder pages cannot get it

- **Pair:** *Header/shell story* vs *Placeholder story* (and *Dashboard page story*).
  - AD-11: "The Dashboard page loads one state document and passes slices down." The Header needs `header.bellBadge` (FR-53) and the dashboard JSON also carries `header.tabs`, `header.activeTab`, `pageTitle`.
  - Placeholder pages render the same Header (FR-57) with a different active tab and title, but load no state doc. Placeholder builder calls `getDashboard(resolveState())` to get the badge (AD-11 only forbids *cards* fetching). Shell builder instead mounts Header once as an app-level layout route (`<Outlet>`), which can't receive the Dashboard page's doc (app sits above pages). Dashboard builder renders Header inside its page with `badge` from the doc. Result: either two Headers, a badge that differs between routes, or a badge that flashes.
  - Strings: AD-16 allows "data JSON **or** `copy.js`". Dashboard builder renders tabs from `doc.header.tabs`; Placeholder builder renders them from `copy.js` `NAV_TABS`. Two sources for one label.
- **Fix — new AD-17 "Shell ownership":**
  > The Header and page-title strip are rendered by each page (Dashboard, Placeholder), not by a layout route. `Header` props: `{ activeTab: 'dashboard'|'equipment'|'alerts', badge: string | null }`. Tab labels, tab targets and page titles come only from `copy.js`/`lib/paths.js`; the JSON fields `header.tabs`, `header.activeTab` and `pageTitle` are not read (a unit test asserts they equal `copy.js`). `badge` is `String(doc.header.bellBadge)` on the Dashboard once loaded, `null` while loading or on error (FR-95/96). Placeholder pages pass `badge = null` [or: call `getDashboard(resolveDashboardState())` once in the Placeholder page — pick one and add to the PRD follow-up].

### H-6 [HIGH] No card contract for loading, error and Retry; per-state shell sizes have no home

- **Pair:** *Equipment card story* vs *Grain card story* (vs *Dashboard page story*).
  - FR-95: while loading, every card shell renders "at the final size for the requested Dashboard state". FR-96: each card shows its own error + `Retry`, and any Retry re-requests the whole file. AD-11 forbids cards from fetching.
  - Equipment builder: card takes `data` and renders a placeholder when `data` is `undefined`, sizing itself from its rows (unknown while loading — 5 rows Full, 2 Small, 1 All-good). Grain builder: card takes `{ status, data, onRetry }` and a fixed height. Dashboard builder must now drive two prop shapes; Equipment jumps in height when data arrives (FR-95 "no element moves" fails); page height (AD-4 `pageBottomSpacePx`) is unknown until load.
- **Fix — new AD-18 "Dashboard section contract":**
  > Every Dashboard section (`KpiStrip`, each card) has the props `{ status: 'loading' | 'error' | 'ready', data, onRetry }`, where `data` is the section's slice (`doc.kpi`, `doc.equipmentCard`, `doc.recentAlerts`, `doc.fanActivity`, `doc.grain`, `doc.liquid`) and is `undefined` unless `status === 'ready'`. The Dashboard page owns the single `getDashboard()` call, the status, and `onRetry` (re-runs that call; all sections go to `loading`).
  > `src/lib/dashboardLayout.js` exports `FRAME[state]` = `{ pageHeightPx, sections: { kpi: { x, y, w, h }, equipment: {…}, … } }` copied from the PRD per state. Section shells take their size from it in every status, so loading/error/ready never shift layout. `ui/CardShell` renders the FR-95 placeholder block and the FR-96 error block from `status`; cards render only the `ready` body.

### H-7 [HIGH] JSON is bundled by import, but FR-96 and its tests need a real request

- **Pair:** *Data/JSON story* vs *Behaviour/Fidelity test story*.
  - AD-7: "only `src/data/api.js` imports the JSON." Data builder writes `import full from './json/dashboard.full.json'` — the data is in the JS bundle; there is no network request and nothing can fail with "network error, non-2xx or invalid JSON" (FR-96).
  - Test builder follows FR-96 "testable by intercepting the JSON request" and addendum §B "served as static files at `/data/…`", writing `page.route('**/dashboard.*.json', r => r.fulfill({ status: 500 }))`. It never matches; the error path is untested, or the test builder adds a JSON copy under `public/data/` — which collides with Markdown Studio's `public/` and gives a second copy of the data.
  - Latency: "300 ms in development and 0 ms in tests" — Playwright drives the dev server, so `import.meta.env.MODE` is `development` in E2E; Vitest-only `MODE === 'test'` never applies to fidelity runs.
- **Fix — replace AD-7 Data access:**
  > **Transport:** `api.js` references each file with `import url from './json/<name>.json?url'` and loads it with `fetch(url)`; a non-2xx status, network failure or `JSON.parse` failure rejects with `{ code: 'LOAD_FAILED', message }`. Tests inject failures with `page.route('**/dashboard.*.json*', …)`. No JSON is placed in `public/`.
  > **Latency:** `api.js` waits `Number(import.meta.env.VITE_DATA_LATENCY_MS ?? 300)` ms before resolving. The Playwright `webServer` sets `VITE_DATA_LATENCY_MS=0`; Vitest sets it to 0. Behaviour tests that need to see placeholders delay the route instead.
  > `getUsers()` adds no latency; the sign-in latency/timeout is applied only by the auth flow (see M-1).

---

### M-1 [MEDIUM] Sign-in check and latency have two possible homes; Forgot-password latency unowned

- **Pair:** *Login story* vs *Forgot-password story*.
  - AD-14: "login uses the 800 ms from the `users.json` policy; dashboard data latency follows AD-7". `getUsers()` is a data-port call, so it also gets AD-7's 300 ms → sign-in waits 1100 ms in dev. FR-47 says the Forgot-password confirmation also uses `policy.simulatedLatencyMs`; Forgot-password builder hard-codes 800 (AD-14 doesn't cover it), or calls `getUsers()` and gets 1100.
  - The FR-24 check order (A.4 rule 2) can land in `features/auth` hook or a pure lib module; the slow/timeout account (16000 ms vs 15000 ms timeout) needs a fake clock either way.
- **Fix — AD-14 Latency, replace:**
  > `src/lib/auth.js` exports pure `checkSignIn({ username, password }, usersDoc, attempts, now, online)` → `{ outcome, account?, lockedUntil? }` implementing addendum A.4 order. `features/auth/useSignIn` applies the delay `account.simulatedLatencyMs ?? policy.simulatedLatencyMs` and the `policy.requestTimeoutMs` race. `features/forgot-password` applies `policy.simulatedLatencyMs` from the same `getUsers()` result. No feature hard-codes a latency.

### M-2 [MEDIUM] UI primitives vs features: who calls `geometry.js`?

- **Pair:** *Grain card story* vs *Fill bar primitive story* (same for Equipment/HealthBar, Fan activity/RuntimeChart).
  - The arrow `ui → lib` lets `ui/FillBar` call `grainSegments()` itself given `items`; the card builder calls `grainSegments()` and passes px. Both obey AD-8 ("geometry from one module"). Props clash: `items` (Grain JSON shape, with `segmentPx`/`segmentTopPx`) vs `segments` (px). Liquid items have no `segmentPx`, so a FillBar that reads item shape must know which card it is in.
- **Fix — tighten AD-8 Rendering:**
  > Features call `geometry.js`; `ui/HealthBar`, `ui/RuntimeChart` and `ui/FillBar` receive only computed px arrays (`[{ leftPx, widthPx, topPx, heightPx, colorVar | color, fid }]`) plus the track size, and never import `geometry.js` or know a JSON shape. Remove the `ui → lib` arrow except for `copy.js`.

### M-3 [MEDIUM] AD-7 "never format or compute" contradicts required derived strings

- **Pair:** *Fan activity card story* vs *Equipment card story*.
  - Addendum B.2: Runtime value label = `String(hours) + "h"`; Recent Alerts meta line = `<deviceId> | <location>`; Equipment captions "digit runs rendered bold" (FR-71); notification accessible name `Unread: <message>`; integer display fields rendered from numbers. AD-7 says components "never format, compute". The Fan builder omits value labels (no display string in the JSON) to obey AD-7; the Equipment builder writes an inline regex to bold digits. Each card invents its own helper.
- **Fix — append to AD-7 Display strings:**
  > **Exhaustive exceptions**, implemented only in `src/lib/copy.js`: `intLabel(n)` = `String(n)` for integer display fields; `hoursLabel(hours)` = `` `${hours}h` ``; `alertMeta(deviceId, location)` = `` `${deviceId} | ${location}` ``; `splitDigitRuns(caption)` → `[{ text, bold }]`; `unreadName(message)`; `formatTryAgain(date, now)` (FR-27/FR-30 `h:mm A` or `MMM D, YYYY h:mm A`). Any other derived display text requires a PRD change.

### M-4 [MEDIUM] Two route guards, but AD-9 allows only one

- **Pair:** *Login story* vs *app/routing story*.
  - FR-33 (signed-in user opening `/login` → `/dashboard`) and FR-56 (`/` → dashboard or login) are guards too. AD-9: "`RequireSession` … is the only route guard." Login builder puts `<Navigate>` inside the Login page; app builder adds `RedirectIfSignedIn`. Both differ on whether the Login form flashes (FR-33 says it must not render).
- **Fix — AD-9 Route guard, replace:**
  > `src/app/RequireSession.jsx` exports `<SessionGate require="signedIn" | "signedOut">`, the only guard. `/login` is wrapped in `signedOut` (redirects to `state.from ?? dashboardPath()` before rendering); every other app route in `signedIn`. `/` is `<Navigate to={getSession() ? dashboardPath() : '/login'} replace />` in `routes.jsx`. After logout, a `pageshow` handler with `event.persisted` re-runs the gate (FR-35 back-forward cache).

### M-5 [MEDIUM] `data-fid` ownership in shared primitives

- **Pair:** *CardShell/EmptyState primitive story* vs *Recent Alerts / Liquid card stories*.
  - The same primitive maps to different Figma node IDs per frame (Full `6215:…`, Small `6864:…`, All-good `6879:…`) and per card. Primitive builder hard-codes the Full-frame ID; card builder passes one. The measurement audit (AD-15) keys its table by node ID per state and finds the wrong one.
- **Fix — append to AD-15 Tagging:**
  > Node IDs live only in `src/lib/fid.js` as `FID[state][elementKey]`, generated from the PRD consequences; the same file generates the audit table. `ui/` primitives accept a `fid` prop and never contain a node ID literal.

### M-6 [MEDIUM] Query-state survival across Header and card links

- **Pair:** *KPI strip story* vs *Header/shell story*.
  - From `/dashboard?state=small` a tester clicks `Equipment` (placeholder) then the `Dashboard` nav tab. Header builder links to `/dashboard` (state falls back to session default → frame changes); KPI builder preserves `?state`. FR-57 only covers Browser Back.
- **Fix — add to AD-11:**
  > `?state` is carried only by Browser history. Every in-app link to the Dashboard is `dashboardPath()` with no `state`, and no other link carries `state`.

### L-1 [LOW] Token naming collisions

- Two foundation-adjacent stories add `--raw-F3F4F6` and `--raw-f3f4f6`, or encode `rgba(175,195,188,0.4)` differently.
- **Fix — AD-2 Tokens:** "`--raw-` names use lowercase 6- or 8-digit hex (`--raw-afc3bc66` for alpha); `tokens.css` is owned by the Design Foundation story and later stories add tokens only in that file, in the section for their feature."

### L-2 [LOW] Notifications data load and failure behaviour unowned

- Panel builder fetches `getNotifications()` on every open; another caches at Dashboard load. Loading/error UI for the panel is undefined.
- **Fix — add to AD-11:** "`features/notifications` calls `getNotifications()` on first open and keeps the result for the page lifetime; while pending the list area is empty; on rejection it shows the FR-96 error block with Retry inside the list area."

### L-3 [LOW] Filter state reset owner

- FR-97: each opening starts with Unread Only ON and `All`. If H-2's provider unmounts the panel on close, local state resets; if the panel stays mounted and hidden, it doesn't.
- **Fix — AD-12:** "Overlays unmount on close; no overlay state survives a close."

## Summary

- **Critical:** 1 — H-1 (route helpers to `src/lib/paths.js`)
- **High:** 6 — H-2 (overlay registry in `ui/overlay`), H-3 (session.js owns attempts key + redirect contract), H-4 (typed session record + shared fixture), H-5 (new AD-17 shell ownership), H-6 (new AD-18 section contract + `dashboardLayout.js`), H-7 (fetch via `?url`, env-driven latency)
- **Medium:** 6 — M-1 … M-6
- **Low:** 3 — L-1 … L-3

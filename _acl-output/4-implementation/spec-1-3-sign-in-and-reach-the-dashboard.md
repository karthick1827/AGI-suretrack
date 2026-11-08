---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-08T19:10:41.479Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
spec_approved_by: Manager (via Markdown Studio)
spec_approved_at: 2026-11-06T06:28:22.437Z
title: 'Story 1.3 — Sign in and reach the Dashboard'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-06'
baseline_commit: '51514cfdc6574f1f670090dbc75c0f3059c027fa'
implementation_status: done
story_key: 1-3-sign-in-and-reach-the-dashboard
jira: SCRUM-27
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-1-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** the Login page from Story 1.2 is static. Customers can't sign in, nothing protects signed-in routes, and there is no Session.

**Approach:**
- Add the single Session module (AD-9) and a `RequireSession` route guard.
- Wire the Login form for keyboard order, required-field validation, a loading state with a double-submit guard, and dummy authentication through `api.getUsers()` and the `users.json` policy.
- On success, write the Session and redirect to `state.from`, or to `/dashboard` (a protected Placeholder until Epic 2).
- `/login` with a Session goes to `/dashboard`. `session.signOut()` clears every tab within 1 s.

Failure messages (wrong credentials, locked, expired and so on) come in Story 1.4.

## Boundaries & Constraints

**Always:**
- **Requirements:** PRD FR-21 to FR-25, FR-33 and FR-35 consequences, verbatim.
- **Storage:** `src/lib/session.js` is the only storage owner. It writes `localStorage['suretrack.session']` = `{ v: 1, username, displayName, dashboardState, issuedAt, expiresAt }` in epoch ms, never the password. Records are built only by `createSessionRecord()`. Expiry is checked in `getSession(now)`.
- **Redirects:** the router state is `{ from, reason: 'required' | 'expired' }`. URLs come only from `paths.js`.
- **Sign-in check:** the username is trimmed and case-insensitive; the password must match exactly. Latency is the 800 ms `users.json` policy, applied in `api.js` (AD-14).
- **Copy:** from `copy.js`. Undesigned error and loading styles live in the `/* states */` block and use tokens only. The at-rest Login page must still pass the Story 1.2 Fidelity check unchanged.

**Ask First:** a new dependency; any change to `tokens.css`, `fonts.css` or the 1.2 Fidelity baseline; any copy not found in the PRD.

**Never:** banners for wrong credentials, lockout, offline or expiry (Story 1.4); the Header or Logout button (Story 2.1); storing the password; `react-router-dom`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid sign-in | `demo` / `Demo@123`, then Enter or Login | Loading for 800 ms; Session written; navigate to `state.from` or `/dashboard`, replacing `/login` in history | N/A |
| Case and spaces | `  DEMO ` / `Demo@123` | Signs in as `demo` | N/A |
| Empty field | Username or Password empty, then submit | No `getUsers` call; field shows `Username is required` / `Password is required` (FR-22) | Focus moves to the first empty field |
| Double submit | Click Login twice during loading | Only one sign-in attempt | Button inert while loading |
| Guarded route, signed out | Open `/dashboard` | Redirect to `/login` with state `{ from: '/dashboard', reason: 'required' }` | N/A |
| Signed-in visit to `/login` | Valid Session | Redirect to `/dashboard` (FR-33) | N/A |
| Cross-tab sign-out | Two tabs signed in; `signOut()` in one | Both tabs show `/login` within 1 s; Back doesn't show `/dashboard` | N/A |
| Corrupt or expired storage | Bad JSON, wrong `v`, or `expiresAt` in the past | `getSession(now)` returns null and clears the key | Never throws |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:367-412`: FR-21 to FR-25 consequences (tab order, validation copy and style, loading, auth rules, redirect).
- `prd.md:478-526`: FR-33 and FR-35.
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md:10-260` (§A): the `users.json` field contract, the policy (latency 800 ms, `sessionTtlMinutes`) and rule 5 (the Session fields).
- `src/features/auth/LoginForm.jsx`: the existing static form. Wire submit here, without changing at-rest markup or geometry.
- `src/data/api.js`: `getUsers()` exists. Add the sign-in latency from the policy here only.
- `src/app/App.jsx`: add `RequireSession`, the `/dashboard` route (rendering `Placeholder`) and the `/login` signed-in redirect.
- `src/lib/paths.js`, `copy.js`, `fid.js`: reuse.
- `tests/fidelity/login.spec.js`: must keep passing unchanged.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/session.js`: `createSessionRecord`, `getSession(now)`, `signIn`, `signOut` and a `subscribe` for cross-tab sync via the `storage` event plus the `suretrack.signout` key.
- [x] `src/app/RequireSession.jsx`: redirects to `paths.login()` with `{ from, reason }`.
- [x] `src/pages/Placeholder/Placeholder.jsx` and `.module.css`: a minimal "Coming soon" placeholder using copy from `copy.js`.
- [x] `src/app/App.jsx`: routes for `/login` (redirects when signed in) and the protected `/dashboard` and other app paths; subscribe to sign-out.
- [x] `src/features/auth/useSignIn.js`: validation, the loading guard, the `getUsers` match and the Session write. Unknown-user and wrong-password outcomes return an `{ outcome }` code with no UI (Story 1.4).
- [x] `src/features/auth/LoginForm.jsx` and `.module.css`: wire submit, field error text, `aria-invalid` and the loading state in the `/* states */` block.
- [x] `tests/unit/session.test.js` and `signin.test.jsx`: every I/O-matrix row.
- [x] `tests/fidelity/signin.spec.js`: Playwright checks for the valid sign-in redirect, tab order and cross-tab sign-out.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then all pass. The Story 1.2 screenshot still passes at ≤ 0.5%.
- Given a signed-in user, when `localStorage` is inspected, then no password is stored anywhere.

## Spec Change Log

- 2026-11-09 — Review loop 1 (patches only, no spec defects): sign-in hardening (policy/TTL validation, storage-write check, unknown status denied, unmount guard, try/finally), pure session reads with purge in an effect, session bounds (60 s skew, 480-min max TTL), SessionSync rework (subscribe once; session loss keeps `{from, reason}`; cross-tab sign-in; expiry timer + visibility/focus; bfcache), hash kept in `from`, segment-aware `returnPath`, single polite live region. KEEP: session.js as sole storage owner, Login at-rest render unchanged.

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected exit code 0.

## Implementation Review (Story 1.3)

**Result:**
- **Commits:** `51514cf` to `1b71bbf` on `feature/1-3-sign-in`.
- **Lint and build:** `npm run lint` passes with 0 issues and `npm run build` succeeds.
- **Unit tests:** `npm test` passes **506/506**.
- **Fidelity check:** `npm run test:fidelity` passes **13/13**. The Login screenshot still differs from Figma by **≤ 0.436%**, and the Story 1.2 test and baseline are untouched.

### Acceptance Criteria Checklist

- [x] **Tab order and Enter (FR-21):** Username → Password → Login → Forgot → Privacy → Terms, and Enter submits.
- [x] **Empty fields (FR-22):** no request is sent; `Username is required` or `Password is required` shows, and focus moves to the first empty field. The message spacing is checked.
- [x] **Loading (FR-23):** loading lasts 800 ms and a double submit is ignored.
- [x] **Dummy sign-in (FR-24):** checks `users.json` with the username trimmed and case-insensitive and the password exact. Only `active` accounts can sign in.
- [x] **Successful sign-in (FR-25):** `suretrack.session` is written as v1 in epoch ms, with no password. The user goes to `state.from` or `/dashboard`, and `/login` is replaced in history.
- [x] **Already signed in (FR-33):** a signed-in user who opens `/login` goes to `/dashboard`, including when the sign-in happened in another tab.
- [x] **Sign-out (FR-35):** `signOut()` sends every tab to `/login` within 1 s, and Back doesn't show signed-in content (bfcache included).
- [x] **Guarded routes:** they redirect to `/login` with `{ from (incl. hash), reason }`. Expiry while a page is open redirects with `reason: 'expired'`.
- [x] **Bad stored records:** corrupt, expired or out-of-range records are ignored and purged without errors.

### Review Findings

- **Patched (16):** listed in the Spec Change Log above.
- **Deferred (3):** in [deferred-work.md](deferred-work.md).
  - The cross-tab test should use the real Logout button, which comes in Story 2.1.
  - The architecture spine's AD-9 needs to list the `suretrack.signout` key.
  - The FR-21 Username autofocus conflicts with Figma's at-rest look.
- **Rejected:**
  - **Account status order:** status is checked only after a correct password, as the PRD requires. Story 1.4 shows one generic message for wrong credentials.
  - **Fixed-width placeholder:** 1366 px is required by AD-4.

### Note for Story 2.1

A same-tab Logout currently returns to `/login` with `from` set, so signing in again goes back to the page the user left. FR-35 implies an empty return path. Story 2.1 should decide this.

## Suggested Review Order

**Session (sole storage owner)**

- v1 record, pure reads, bounds checks, signIn write check, cross-tab subscribe.
  [`session.js:1`](../../src/lib/session.js#L1)

**Sign-in flow**

- Validation, 800 ms guard, users.json match, status rules, safe return path.
  [`useSignIn.js:1`](../../src/features/auth/useSignIn.js#L1)
- Form wiring, live region, error/loading states (at-rest markup unchanged).
  [`LoginForm.jsx:1`](../../src/features/auth/LoginForm.jsx#L1)

**Routing**

- Guard with `{ from, reason }`.
  [`RequireSession.jsx:1`](../../src/app/RequireSession.jsx#L1)
- Routes + SessionSync (loss, cross-tab sign-in, expiry, bfcache).
  [`App.jsx:1`](../../src/app/App.jsx#L1)

**Tests**

- I/O matrix, sync, expiry, bfcache.
  [`signin.test.jsx:1`](../../tests/unit/signin.test.jsx#L1)
- Browser checks: redirect, tab order, error layout, cross-tab sign-out.
  [`signin.spec.js:1`](../../tests/fidelity/signin.spec.js#L1)

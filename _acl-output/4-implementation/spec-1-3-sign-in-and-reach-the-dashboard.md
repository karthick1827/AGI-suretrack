---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-06T06:28:22.437Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 1.3 — Sign in and reach the Dashboard'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-06'
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
- [ ] `src/lib/session.js`: `createSessionRecord`, `getSession(now)`, `signIn`, `signOut` and a `subscribe` for cross-tab sync via the `storage` event plus the `suretrack.signout` key.
- [ ] `src/app/RequireSession.jsx`: redirects to `paths.login()` with `{ from, reason }`.
- [ ] `src/pages/Placeholder/Placeholder.jsx` and `.module.css`: a minimal "Coming soon" placeholder using copy from `copy.js`.
- [ ] `src/app/App.jsx`: routes for `/login` (redirects when signed in) and the protected `/dashboard` and other app paths; subscribe to sign-out.
- [ ] `src/features/auth/useSignIn.js`: validation, the loading guard, the `getUsers` match and the Session write. Unknown-user and wrong-password outcomes return an `{ outcome }` code with no UI (Story 1.4).
- [ ] `src/features/auth/LoginForm.jsx` and `.module.css`: wire submit, field error text, `aria-invalid` and the loading state in the `/* states */` block.
- [ ] `tests/unit/session.test.js` and `signin.test.jsx`: every I/O-matrix row.
- [ ] `tests/fidelity/signin.spec.js`: Playwright checks for the valid sign-in redirect, tab order and cross-tab sign-out.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then all pass. The Story 1.2 screenshot still passes at ≤ 0.5%.
- Given a signed-in user, when `localStorage` is inspected, then no password is stored anywhere.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected exit code 0.

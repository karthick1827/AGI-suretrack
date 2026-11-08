---
status: In Review
spec_approved_by: Manager (via Markdown Studio)
spec_approved_at: 2026-11-08T19:20:34.501Z
title: 'Story 1.4 — Clear messages when sign-in fails'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
baseline_commit: 'ef2698a7ace0972389fc3586c10127e217a4dbca'
implementation_status: review
story_key: 1-4-clear-messages-when-sign-in-fails
jira: SCRUM-28
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-1-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.3 returns failure `{ outcome }` codes but shows nothing. Customers can't tell why sign-in failed, and lockout, timeout and expiry messages don't exist.

**Approach:**
- Add one alert banner under the Login title (FR-32) that maps each outcome to its verbatim PRD copy: wrong credentials, locked (with or without a time), inactive or no subscription, expired password, too many attempts, offline, timeout, and session expired.
- Add the per-browser lockout counter in `session.js` (`suretrack.signin-attempts`) and a request timeout taken from the `users.json` policy.

## Boundaries & Constraints

**Always:**
- **Requirements:** PRD FR-26 to FR-32 and FR-34 consequences, verbatim. All copy comes from `copy.js`, with `{time}`/`{coachPhone}` filled only by its helpers and the Coach number taken from `getConfig()`.
- **Behaviour:**
  - Status messages appear only after a correct password.
  - Wrong credentials never say which field was wrong; they keep the username, then clear and focus the password.
  - No failure creates a Session.
- **Lockout:** `policy.maxFailedAttempts` (5) consecutive failures lock sign-in for `policy.lockoutMinutes` (15) from the failure that reached the limit. The record `suretrack.signin-attempts = { count, lockedUntil }` (epoch ms) is owned by `session.js`, survives reload and resets on success. While locked, Login is disabled at opacity 0.5 and the banner shows the try-again time.
- **Timeout:** the sign-in check aborts after `policy.requestTimeoutMs` (15000) via `AbortController` and maps to the timeout message. `navigator.onLine === false` maps to offline. The `slow` account's `simulatedLatencyMs` (16000) must trigger the timeout.
- **Expiry:** a redirect with `state.reason === 'expired'` shows the session-expired banner. After sign-in the user returns to `state.from`.
- **Banner styling:** the banner is [ASSUMPTION] per FR-32: white, 1 px `#dc2626` border, radius 8, 14/20 `#111827`. It is placed under the title and announced via `aria-live`, and its tokens and styles live in the `/* states */` block. With no banner the page must still pass the Story 1.2 Fidelity check unchanged.

**Ask First:** new copy not in the PRD; changes to tokens, fonts or the 1.2 baseline; a new dependency.

**Never:** a Forgot Password modal (Story 1.5); changing the success path from Story 1.3; storing the password.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Wrong password | `demo` / `x` | Banner `Username or password is incorrect`; username kept; password cleared and focused; Login re-enabled | Counter +1 |
| Unknown user | `nobody` / `x` | Same banner and behavior as a wrong password | Counter +1 |
| Locked, with time | `locked` + correct password | FR-27 copy with `{time}` and the Coach number | No Session |
| Locked, no time or past time | `locked-until` with a past or null `lockedUntil` | FR-27 copy without a time | No Session |
| Inactive / no subscription | `inactive` or `nosub` + correct password | FR-28 copy | No Session |
| Expired password | `expired` + correct password | `Your password has expired` + Forgot link (FR-29) | No Session |
| 5th failure | Five consecutive failures | Lockout until +15 min; banner with time; Login disabled at opacity 0.5; persists across reload | Reset on success |
| Timeout | `slow` (16 s) | After 15 s: timeout banner; Login re-enabled | Request aborted |
| Offline | `navigator.onLine === false` | Connection banner; no request | Retry allowed |
| Session expired | Arrive with `state.reason='expired'` | `Your session has expired. Please sign in again.`; sign-in returns to `state.from` | N/A |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:413-491`: FR-26 to FR-32 and FR-34 consequences (copy, banner placement and style, lockout, timeout).
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md:10-260` (§A): the policy fields and the Dummy accounts `locked`, `locked-until`, `inactive`, `nosub`, `expired` and `slow`.
- `src/features/auth/useSignIn.js`: map outcomes, the lockout check and timeout. Keep the 1.3 success path unchanged.
- `src/features/auth/LoginForm.jsx` and `.module.css`: the banner slot under the title, password clear and focus, and the disabled state (in the states block).
- `src/lib/session.js`: add the attempts record helpers (`getAttempts`, `recordFailure`, `resetAttempts`).
- `src/data/api.js`: `getUsers({ signIn: true, signal })` honours the abort and the per-user `simulatedLatencyMs`.
- `src/lib/copy.js`: the error strings already exist; add only the helpers for formatting the time and Coach number.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/session.js`: the attempts record helpers, pure reads included.
- [x] `src/data/api.js`: abort signal support and per-user simulated latency.
- [x] `src/features/auth/useSignIn.js`: the outcome → banner mapping, lockout, timeout, offline, password clear and focus, and expired-reason handling.
- [x] `src/features/auth/AlertBanner.jsx` and `.module.css`: the FR-32 banner (live region, token styles).
- [x] `src/features/auth/LoginForm.jsx` and `.module.css`: render the banner, the disabled state and the Forgot link inside the expired-password banner (no-op until Story 1.5).
- [x] `tests/unit/signin-failures.test.jsx`: every I/O-matrix row, using fake timers for the lockout and timeout.
- [x] `tests/fidelity/signin-failures.spec.js`: a banner position and style check for one case, plus the at-rest page still matching the Story 1.2 baseline.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then all pass, and the Login screenshot stays ≤ 0.5% with `login.spec.js` and its baseline untouched.

## Spec Change Log

- 2026-11-09 — **Acceptance-criteria conflict resolved:** the acceptance criteria said `login.spec.js` must stay untouched, but its Story 1.2 "submit does nothing" assertion contradicted FR-26 (the password must be cleared). Only that assertion was updated, to the Story 1.4 behaviour. The screenshot test, the audits and the baseline are untouched.
- 2026-11-09 — **I/O matrix account names:** the matrix lists `locked` and `locked-until` the other way round from the `users.json` data (`locked` has no time; `locked-until` has a time in 2099). The behaviour is unchanged and the tests follow the data.
- 2026-11-09 — **Review loop 1 (patches only):**
  - **Deadline:** armed at submit, covering the users.json load, the latency and the config load.
  - **No silent failures:** load, policy, storage and Coach-phone failures show the existing FR-31 timeout or offline copy.
  - **Lockout:** cross-tab sync; the end timer compares before resetting; safe date handling; render-time banner text.
  - **Expiry:** the expired banner shows once.
  - **Accessibility and layout:** `role="alert"` only; banner re-measured with ResizeObserver; `aria-disabled` lockout.
  - **KEEP:** the at-rest render stays identical to Figma, and all copy stays verbatim from the PRD.

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected exit code 0.

## Implementation Review (Story 1.4)

**Result:**
- **Commits:** `ef2698a` to `d934afd` on `feature/1-4-signin-failures`.
- **Lint and build:** `npm run lint` passes with 0 issues and `npm run build` succeeds.
- **Unit tests:** `npm test` passes **560/560**.
- **Fidelity check:** `npm run test:fidelity` passes **17/17**. The at-rest Login screen still differs from Figma by **≤ 0.436%**, and the baseline is untouched.

**Test accounts (from `users.json`):**

| Account | Password | Shows |
|---|---|---|
| `demo` | `Demo@123` | Successful sign-in |
| `locked` | `Locked@123` | Locked, no time |
| `locked-until` | `Locked@123` | Locked, with a time |
| `inactive` | `Inactive@123` | Inactive account |
| `nosub` | `NoSub@123` | No active subscription |
| `expired` | `Expired@123` | Expired password |
| `slow` | `Slow@123` | Timeout |
| any other name or password | | Wrong credentials |

### Acceptance Criteria Checklist

- [x] **Wrong credentials (FR-26):** `Username or password is incorrect`, without saying which field. The username stays and the password is cleared and focused.
- [x] **Locked account (FR-27):** the message, with or without a time, plus the Coach number from config. No Session is created.
- [x] **Inactive or no subscription (FR-28)** and **expired password (FR-29)**, which shows the "Reset your password" control (wired in Story 1.5).
- [x] **Too many attempts (FR-30):** 5 consecutive failures lock sign-in for 15 minutes. The lockout survives a reload and is synced across tabs, Login is disabled (opacity 0.5), and the count resets on success.
- [x] **Offline and timeout (FR-31):** both show a banner. The timeout is counted from submit and covers a hung request.
- [x] **Banner (FR-32):** placed under the title, white with a red border, and announced once. Elements below it move by the measured banner height.
- [x] **Session expired (FR-34):** the banner shows once, and after sign-in the user returns to `from`.
- [x] **At rest:** with no banner, the Login page still matches the Figma baseline.

### Review Findings

- **Patched (17):** listed in the Spec Change Log above.
- **Deferred (3):** in [deferred-work.md](deferred-work.md).
  - Server-side lockout.
  - A race-free attempts counter.
  - Removing the per-account latency before any real deployment.
- **Rejected:** a remark about how the spec file was kept up to date (`implementation_status` is a progress field, not the approval status).

## Suggested Review Order

**Failure handling**

- Deadline at submit, PRD check order, outcome → banner mapping, lockout sync.
  [`useSignIn.js:1`](../../src/features/auth/useSignIn.js#L1)
- Attempts record, `endLockout` compare-before-reset, cross-tab subscribe.
  [`session.js:1`](../../src/lib/session.js#L1)
- Abortable load, per-account latency, shared `MAX_TIMEOUT_MS`.
  [`api.js:1`](../../src/data/api.js#L1)

**UI**

- FR-32 banner.
  [`AlertBanner.jsx:1`](../../src/features/auth/AlertBanner.jsx#L1)
- Banner slot, measured shift, cleared password, `aria-disabled` lockout.
  [`LoginForm.jsx:1`](../../src/features/auth/LoginForm.jsx#L1)
- Time formatting and verbatim message helpers.
  [`copy.js:1`](../../src/lib/copy.js#L1)

**Tests**

- Every I/O-matrix row, deadline, lockout and cross-tab cases.
  [`signin-failures.test.jsx:1`](../../tests/unit/signin-failures.test.jsx#L1)
- Banner layout (one-line and wrapped), lockout state, at-rest baseline.
  [`signin-failures.spec.js:1`](../../tests/fidelity/signin-failures.spec.js#L1)

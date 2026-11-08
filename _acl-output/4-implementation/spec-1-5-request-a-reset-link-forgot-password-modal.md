---
status: In Review
spec_approved_by: Manager (via Markdown Studio)
spec_approved_at: 2026-11-08T20:00:33.174Z
title: 'Story 1.5 — Request a reset link (Forgot Password modal)'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
baseline_commit: '10e78f4b5102bd7037075f44c234901dd9428dbe'
implementation_status: review
story_key: 1-5-request-a-reset-link-forgot-password-modal
jira: SCRUM-29
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-1-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `Forgot Password or Username?` and the expired-password `Reset your password` control do nothing. Customers can't request a reset link, and there is no shared overlay mechanism for later overlays (the profile menu and Notifications panel).

**Approach:**
- Create the single overlay owner (AD-12): `OverlayProvider` and `useOverlay()` in `src/ui/overlay/`, with `modal`, `menu` and `panel` kinds, rendering through a portal into `#overlay-root`.
- Build the Forgot Password modal from Figma frame `6026:62907` (600×374) at exact PRD FR-37 to FR-44 values, with validation, loading, the identical confirmation, closing and focus rules (FR-36 and FR-45 to FR-49).
- Both triggers (the Forgot link and the FR-29 Reset control) open it.

## Boundaries & Constraints

**Always:**
- **Exact values:** PRD FR-36 to FR-49 values and copy, verbatim (including the ’ U+2019 in the intro and the red `*`). Styling uses tokens and CSS Modules only; the modal is placed on a fixed overlay layer (AD-4 overlay exception).
- **Close X:** stays at opacity 0, as drawn (FR-39). It is still a reachable, labelled control.
- **Submit:** disabled until the email is valid. A disabled Submit looks exactly as drawn, with cursor `not-allowed`.
- **Confirmation:** the same confirmation shows for any email. There is no network call; simulated latency comes only from `api.js`.
- **Closing and focus:** the modal closes on Cancel, Esc and backdrop click. It unmounts on close, so typed input is discarded, and focus returns to the trigger. Focus is trapped while it is open.
- **Visuals:** the backdrop and confirmation styles are [ASSUMPTION] per FR-36/FR-47, and live in the `/* states */` block. With the modal closed, the Login page must still pass the Story 1.2 Fidelity check unchanged.

**Ask First:** new copy; token, font or baseline changes; a new dependency.

**Never:** a Reset Password page (SCRUM-30 is out of scope); any real email send; `react-router-dom`; a second overlay mechanism.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open from link | Click `Forgot Password or Username?` | Modal 600×374 centred on the overlay layer; focus inside | N/A |
| Open from expired banner | `expired` account, then `Reset your password` | Same modal opens | Control no longer `aria-disabled` |
| Invalid email | empty, `abc`, `a@b` | Submit disabled; on blur shows `Enter a valid email address` | N/A |
| Valid email | `x@y.com`, then Submit or Enter | Loading, then the identical FR-47 confirmation for any address | N/A |
| Close | Cancel, Esc or backdrop click | Modal unmounts; input discarded; focus returns to the trigger | N/A |
| Focus trap | Tab or Shift+Tab inside | Focus cycles in the FR-49 order and never leaves the modal | N/A |
| Fidelity | Modal open at 1366×768 | The modal region matches the Figma render: ≤ 0.5% pixel diff, ±1 px measurements, exact copy | N/A |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md:527-687`: FR-36 to FR-49 (geometry, typography, colours, shadow `0 12px 20px -2px rgba(39,39,39,0.15)`, copy, validation rule, focus order).
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:196-226` (Part A §3): the modal layout tables.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-reference/forgot-password-6026-62907.png`: a **636×410** render, which includes the shadow overflow. The 600×374 card sits inside it; locate its exact offset from the shadow geometry. The Fidelity check compares the modal card region against that crop. The crop is made at test setup, and the committed file is never edited.
- `src/features/auth/LoginForm.jsx` and `useSignIn.js`: the two triggers (the Forgot link, and the FR-29 Reset control, currently `aria-disabled`).
- `src/app/App.jsx`: mount `OverlayProvider` once. `index.html` already has `#overlay-root`.
- `src/lib/copy.js` `forgotPassword.*`, `src/lib/fid.js`, `src/assets/icons/16936.svg` (help "?"), `0d4fd.svg` (close X).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/overlay/OverlayProvider.jsx` and `useOverlay.js`: the single open-state owner, `modal`/`menu`/`panel` kinds, the portal, Esc handling, focus trap and return, and unmount on close.
- [x] `src/features/forgot-password/ForgotPasswordModal.jsx` and `.module.css`: exact FR-37 to FR-44 visuals with `data-fid`, and FR-45 to FR-47 behaviour.
- [x] `src/data/api.js`: `requestPasswordReset(email)`, a simulated resolve after the existing data latency (no network).
- [x] `src/app/App.jsx`, `LoginForm.jsx` and `useSignIn.js`: mount the provider; wire both triggers; drop `aria-disabled` on the Reset control.
- [x] `tests/unit/forgot-password.test.jsx` and `overlay.test.jsx`: every I/O-matrix row, plus "one overlay at a time".
- [x] `tests/fidelity/forgot-password.spec.js` and `expected/forgot-password.json`: the modal-region screenshot against the cropped baseline (≤ 0.5%), the measurement audit (±1 px) and the copy audit. The Login at-rest check is unchanged.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then all pass, with the Login screenshot still ≤ 0.5% and the Story 1.2 baseline untouched.

## Spec Change Log

- 2026-11-09 — **Pixel check on Windows (developer decision):** the modal screenshot differs from the Figma card crop by **0.70%** against the **0.5%** limit. The cause is how Windows Chromium smooths text edges; every measurement (±1 px) and every copy audit passes. The limit stays 0.5%. The Windows run is advisory, and the **macOS CI run is authoritative** (AD-6, AD-15). macOS hasn't run yet because the repo has no remote. **Manager to confirm.**
- 2026-11-09 — **Deviation from a PRD assumption:** FR-48 assumed "Esc while the tooltip is visible closes the modal". It now follows WCAG 1.4.13: Esc first dismisses a visible tooltip, and a second Esc closes the modal. **Manager to confirm.**
- 2026-11-09 — **Baseline crop:** the 600×374 card is cropped at (18, 6) from the 636×410 Figma render at test setup, with a check that the crop lines up with the card. The committed render is never edited.
- 2026-11-09 — **Review loop 1 (patches only):** overlay hardening (inert, trigger, id-aware close, close on route change, scroll lock, IME-safe Esc, focus trap, live content, split contexts) and modal hardening (failure recovery, validation paths, Coach fallback, tooltip, X hit area, reduced motion, shared `useConfig`, stricter email rule). **KEEP:** the visuals stay as drawn in Figma, and the copy stays verbatim.

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected exit code 0.

## Implementation Review (Story 1.5)

**Result:**
- **Commits:** `10e78f4` to `0e62ea1` on `feature/1-5-forgot-password`.
- **Lint and build:** `npm run lint` passes with 0 issues and `npm run build` succeeds.
- **Unit tests:** `npm test` passes **616/616**.
- **Fidelity check:** `npm run test:fidelity` passes **25/26**. The one failure is the modal screenshot on Windows, at 0.70% against 0.5%; it is advisory, and macOS CI is authoritative (see the Change Log). Every modal measurement and copy audit passes, and the Login page is unchanged at ≤ 0.436%.

### Acceptance Criteria Checklist

- [x] **Opening (FR-36):** the modal opens from `Forgot Password or Username?` and from the expired-password `Reset your password` control. It is centred at 600×374 on the overlay layer.
- [x] **Visuals (FR-37 to FR-44):** the container and shadow, title, invisible close X, intro copy (’), Email field with the red `*` and placeholder, help "?" and tooltip, Coach number, and Cancel/Submit all match Figma. Every element is within ±1 px, and the copy is exact.
- [x] **Validation (FR-45/FR-46):** Submit is disabled until the email is valid. An invalid email shows `Enter a valid email address` when the field loses focus.
- [x] **Submit (FR-47):** after a loading state, the identical confirmation shows for any address. No network call is made.
- [x] **Closing (FR-48):** Cancel, Esc and a backdrop click each close the modal, discarding the input and returning focus to the trigger.
- [x] **Focus (FR-49):** Email is focused on open, and focus stays trapped in the modal in the FR-49 order.
- [x] **Overlay mechanism (AD-12):** one overlay open at a time, closed on route changes. Later stories (the profile menu, the Notifications panel) reuse it.
- [x] **Login page:** with the modal closed it is unchanged, and still matches the Figma baseline.

### Review Findings

- **Patched (27):** listed in the Spec Change Log above.
- **Deferred (1):** wire a real reset-email endpoint before production, in [deferred-work.md](deferred-work.md).
- **Rejected:**
  - **Small viewports:** the canvas is fixed at 1366 px (AD-4).
  - **Loading announcement:** it would need new copy that isn't in the PRD.
  - **Spec-edit concern:** only progress fields changed in the spec.

## Suggested Review Order

**Overlay mechanism (shared by later stories)**

- Single owner, portal, inert, scroll lock, focus trap/return, id-aware close, route-change close.
  [`OverlayProvider.jsx:1`](../../src/ui/overlay/OverlayProvider.jsx#L1)
- Actions vs state hooks.
  [`useOverlay.js:1`](../../src/ui/overlay/useOverlay.js#L1)
- Tabbable detection.
  [`focus.js:1`](../../src/ui/overlay/focus.js#L1)

**Forgot Password modal**

- FR-36–49 behaviour, Coach fallback, tooltip, failure recovery.
  [`ForgotPasswordModal.jsx:1`](../../src/features/forgot-password/ForgotPasswordModal.jsx#L1)
- Exact Figma geometry; states block last.
  [`ForgotPasswordModal.module.css:1`](../../src/features/forgot-password/ForgotPasswordModal.module.css#L1)
- FR-45 email rule.
  [`email.js:1`](../../src/lib/email.js#L1)
- Shared config hook.
  [`useConfig.js:1`](../../src/data/useConfig.js#L1)

**Wiring**

- Two triggers via `onForgotPassword`.
  [`LoginPage.jsx:1`](../../src/pages/Login/LoginPage.jsx#L1)
- Routed overlay provider.
  [`App.jsx:1`](../../src/app/App.jsx#L1)

**Tests**

- Modal-region screenshot vs cropped Figma, measurement/copy audits, focus, flows.
  [`forgot-password.spec.js:1`](../../tests/fidelity/forgot-password.spec.js#L1)
- I/O matrix + overlay behaviour.
  [`forgot-password.test.jsx:1`](../../tests/unit/forgot-password.test.jsx#L1)

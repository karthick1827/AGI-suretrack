---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-08T20:00:33.174Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 1.5 — Request a reset link (Forgot Password modal)'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
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
- [ ] `src/ui/overlay/OverlayProvider.jsx` and `useOverlay.js`: the single open-state owner, `modal`/`menu`/`panel` kinds, the portal, Esc handling, focus trap and return, and unmount on close.
- [ ] `src/features/forgot-password/ForgotPasswordModal.jsx` and `.module.css`: exact FR-37 to FR-44 visuals with `data-fid`, and FR-45 to FR-47 behaviour.
- [ ] `src/data/api.js`: `requestPasswordReset(email)`, a simulated resolve after the existing data latency (no network).
- [ ] `src/app/App.jsx`, `LoginForm.jsx` and `useSignIn.js`: mount the provider; wire both triggers; drop `aria-disabled` on the Reset control.
- [ ] `tests/unit/forgot-password.test.jsx` and `overlay.test.jsx`: every I/O-matrix row, plus "one overlay at a time".
- [ ] `tests/fidelity/forgot-password.spec.js` and `expected/forgot-password.json`: the modal-region screenshot against the cropped baseline (≤ 0.5%), the measurement audit (±1 px) and the copy audit. The Login at-rest check is unchanged.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then all pass, with the Login screenshot still ≤ 0.5% and the Story 1.2 baseline untouched.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected exit code 0.

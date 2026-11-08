---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-06T05:34:30.518Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
---

- source_spec: `_acl-output/4-implementation/spec-1-1-project-foundation-on-figmas-design-system.md`
  summary: Add a build-level CI check (vite build --manifest) that every src/data/json/*.json is emitted as a separate asset, never inlined as a data: URL.
  evidence: api.js is not imported by the app yet, so dist/ has no JSON assets; the unit test passes with or without &no-inline. Implement once Story 1.2/1.3 imports api.js.
- source_spec: `_acl-output/4-implementation/spec-1-1-project-foundation-on-figmas-design-system.md`
  summary: Apply the users.json policy.requestTimeoutMs (15 s) with an AbortController in the sign-in path and define precedence between VITE_DATA_LATENCY_MS and policy latency (800 ms).
  evidence: loadJson has no timeout; the slow account (16 s) and timeout message (FR-31) belong to Story 1.4.
- source_spec: `_acl-output/4-implementation/spec-1-1-project-foundation-on-figmas-design-system.md`
  summary: Add a users.json fixture with status locked and a lockedUntil in the past and specify the expected sign-in behaviour.
  evidence: Expired-lock branch is unspecified; belongs to Story 1.4 (FR-27/FR-30).
- source_spec: `_acl-output/4-implementation/spec-1-1-project-foundation-on-figmas-design-system.md`
  summary: Render notification messages that contain an embedded newline (notifications.json n4) consistently, e.g. white-space: pre-line per the Figma frame.
  evidence: Rendering decision belongs to Story 3.1 (FR-101).
- source_spec: `_acl-output/4-implementation/spec-1-1-project-foundation-on-figmas-design-system.md`
  summary: Decide whether public/icons.svg (starter sprite) is still used by Markdown Studio and remove it if orphaned.
  evidence: The deleted starter App.jsx was its only known consumer; public/ is shared with Markdown Studio so removal needs confirmation.
- source_spec: `_acl-output/4-implementation/spec-1-1-project-foundation-on-figmas-design-system.md`
  summary: Pin react, react-dom, vite, oxlint and the Babel packages exactly (spine lists vite 8.3.6, @rolldown/plugin-babel 0.3.0) for consistent builds.
  evidence: Only the spec-listed deps were pinned; others keep caret ranges, so a fresh install can drift.
- source_spec: `_acl-output/4-implementation/spec-1-1-project-foundation-on-figmas-design-system.md`
  summary: Decouple unit tests from planning documents (tests read _acl-output PRD/addendum/figma-assets) by snapshotting the needed contracts into tests/fixtures.
  evidence: Any wording edit in the PRD can break CI; planning folder is an unmanaged build input.
- source_spec: `_acl-output/4-implementation/spec-1-1-project-foundation-on-figmas-design-system.md`
  summary: Consider a separate vitest config (or test.include) so the test run does not load the Markdown Studio aclMarkdownSaverPlugin from vite.config.js.
  evidence: vite.config.js changes are Ask First; currently every test run loads the Studio plugin.
- source_spec: `_acl-output/4-implementation/spec-1-2-pixel-exact-login-page-with-the-fidelity-check.md`
  summary: Cache Playwright browsers in the macos-latest CI job and align its Node version with the Ubuntu job.
  evidence: Each CI run re-downloads Chromium; job settings may drift.
- source_spec: `_acl-output/4-implementation/spec-1-2-pixel-exact-login-page-with-the-fidelity-check.md`
  summary: Give the Login and Forgot buttons visible feedback once Stories 1.3 and 1.5 wire them up (currently focusable no-ops by design).
  evidence: Static Story 1.2 scope; behaviour arrives in 1.3/1.5.
- source_spec: `_acl-output/4-implementation/spec-1-2-pixel-exact-login-page-with-the-fidelity-check.md`
  summary: Update the PRD (FR-4/FR-20 notes) to record the user-approved Roboto metric overrides and the Figma-render separator spacing.
  evidence: Implementation deviates from PRD wording with user approval; PRD should reflect it in its next update.
- source_spec: `_acl-output/4-implementation/spec-1-3-sign-in-and-reach-the-dashboard.md`
  summary: Rewrite the cross-tab sign-out fidelity test to use the real Logout control instead of copying signOut() storage writes.
  evidence: No Logout UI exists until Story 2.1; the test currently mirrors signOut() internals.
- source_spec: `_acl-output/4-implementation/spec-1-3-sign-in-and-reach-the-dashboard.md`
  summary: Reconcile ARCHITECTURE-SPINE AD-9 (exactly two storage keys) with the third key suretrack.signout used for cross-tab sign-out broadcast.
  evidence: Spec and PRD addendum C require the broadcast key; the spine text says two keys.
- source_spec: `_acl-output/4-implementation/spec-1-3-sign-in-and-reach-the-dashboard.md`
  summary: Decide FR-21 autofocus on Username at page load vs. the Figma at-rest render (focus ring would show and break the Story 1.2 baseline).
  evidence: Autofocus not implemented to keep the at-rest render identical to Figma; needs a design/PM decision.

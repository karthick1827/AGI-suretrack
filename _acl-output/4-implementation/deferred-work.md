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

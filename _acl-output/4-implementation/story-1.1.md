---
title: 'Story 1.1 — Project foundation on Figma''s design system'
status: In Review
type: story-review
story_key: 1-1-project-foundation-on-figmas-design-system
epic: 1
spec: spec-1-1-project-foundation-on-figmas-design-system.md
branch: feature/1-1-project-foundation
baseline_commit: 464457683d23546fbee2269fccc25012d6e93dc7
head_commit: 40325ff328f1b8ba8da60b2f20441b2078ab4b3b
created: '2026-11-06'
---

# Story 1.1 — Project foundation on Figma's design system (Implementation Review)

**Spec:** [spec-1-1-project-foundation-on-figmas-design-system.md](spec-1-1-project-foundation-on-figmas-design-system.md). Its Suggested Review Order lists the files to look at first.

**Branch:** `feature/1-1-project-foundation`. The change runs from `4644576` to `40325ff`.

**Result:** `npm run lint` passes with 0 issues, `npm run build` is clean, and `npm test` passes 367 of 367 tests.

## Acceptance Criteria Checklist

- [x] The starter `src/` is replaced by the layered tree, with all pinned dependencies installed exactly:
  - react-router 8.5.1;
  - @fontsource/roboto 5.3.0 and @fontsource/inter 5.3.0;
  - vitest 5.1.0;
  - @testing-library/react 16.3.3 and @testing-library/dom 10.4.2;
  - jsdom 30.1.3;
  - sharp 0.35.5;
  - `engines.node >=22.22.0`.
- [x] `react-router-dom` is absent from `package.json`.
- [x] `src/styles/tokens.css` holds every Figma variable and hard-coded colour verbatim. `#C62828`, `#DC2626`, `#FF0000`, `#F3F4F6` and `#F3F4F4` are separate tokens, and the shadows, font stacks and z-index scale are included. A test checks every value.
- [x] The CSS-literal gate fails on hex, rgb/hsl, the modern colour functions, named colours and font literals in any `src/**/*.css` outside `src/styles/`. A command-line test confirms it exits non-zero with `file:line`.
- [x] Roboto 400–800 and Inter 400–700 load from local WOFF2 files through our own `@font-face` with `font-display: block`. No `@fontsource` CSS and no CDN is used.
- [x] The 25 Figma SVGs in `src/assets/icons/` are byte-identical to `figma-assets/`, checked by a checksum test. `chevron-right.svg` (12×16, `#006A36`) is the only hand-made icon.
- [x] `login-bg.webp` (569 KB) and `login-bg.jpg` (548 KB) are 2732 px wide and ≤ 600 KB each.
- [x] `src/data/json/*.json` match the PRD addendum §A/§B character for character, and `public/app-config.json` holds the legal URLs and the Coach number.
- [x] `api.js` passes all I/O-matrix rows:
  - an exact load for `small`;
  - `NOT_FOUND` for an unknown state;
  - `FORCED_FAIL` via `?__fail` in dev and test only;
  - `getConfig` resolves, or rejects with `LOAD_FAILED`.
- [x] Latency is 300 ms in dev, 0 in tests and always 0 in production.
- [x] `paths.js` covers the FR-57/FR-75 routes and reserves the Markdown Studio prefixes. `copy.js` keeps U+00B7, U+2019 and the design typos, with exact whitespace checks. `fid.js` holds the Figma node IDs.
- [x] Ubuntu CI (`npm ci`, lint, build, test) is defined in `.github/workflows/ci.yml`.
- [x] Markdown Studio is unaffected: `/markdown.html` and `/api/health` return 200 on the dev server.

## Review Findings

- **Patched in this story (24):** the latency rules, the unified fail seam, the response-shape check, the path and copy guards, the gaps in the CSS gate, safe image writes, and stronger tests.
- **Deferred (8):** logged in [deferred-work.md](deferred-work.md), each assigned to the story it belongs to (for example the login timeout goes to Story 1.4, and the newline in notification text to Story 3.1).
- **Rejected:** the contradictory readings in the data files are intentional. Figma is copied exactly, per the brief and PRD.

## Points for the Manager

1. `.oxlintrc.json` now ignores the Markdown Studio folders (`public/markdown/**`, `tools/**`, `api/**`, `vite.config.js`). Without that, lint reports about 117 old warnings in those files.
2. The legal URLs are placeholders (`https://example.com/privacy` and `/terms`) until AGI supplies the real ones.
3. Nothing visual ships in this story. The Figma pixel check starts with Story 1.2 (the Login page).

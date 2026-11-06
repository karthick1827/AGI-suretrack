---
title: 'Story 1.2 — Pixel-exact Login page with the Fidelity check'
status: In Review
type: story-review
story_key: 1-2-pixel-exact-login-page-with-the-fidelity-check
epic: 1
jira: SCRUM-27 (AC1), SCRUM-31
spec: spec-1-2-pixel-exact-login-page-with-the-fidelity-check.md
branch: feature/1-2-login-page
baseline_commit: abc380359e9a600c19934bec1c3b01f3ad4761c7
created: '2026-11-06'
---

# Story 1.2 — Pixel-exact Login page with the Fidelity check (Implementation Review)

**Spec:** [spec-1-2-pixel-exact-login-page-with-the-fidelity-check.md](spec-1-2-pixel-exact-login-page-with-the-fidelity-check.md). It contains the Suggested Review Order and the Change Log.

**Figma:** frame `6026:60111` (1366×768). The baseline is `tests/fidelity/__baselines__/login-6026-60111.png`, a byte-identical copy of the Figma export.

**Result:**
- **Lint and build:** `npm run lint` passes with 0 issues and `npm run build` succeeds.
- **Unit tests:** `npm test` passes 392 of 392.
- **Fidelity check:** `npm run test:fidelity` passes 8 of 8, run against the production build. The screenshot differs from Figma by **≤ 0.436%** of pixels (the limit is 0.5%).

## Acceptance Criteria Checklist

- [x] Any route (`/`, `/dashboard`, `/xyz`) redirects to `/login` (FR-11).
- [x] Every element matches PRD FR-12 to FR-20 and carries its `data-fid`:
  - the silo photo in two mirrored layers;
  - the green angled panel (`f4626.svg`);
  - the 9×13 triangle;
  - the form column and logo;
  - the title and labels;
  - the inputs, with a 1.5 px `#a4dfbb` edge, 4 px radius and transparent fill;
  - the white button with its `#004b27` label;
  - the Forgot link;
  - the legal text, with the separator at 50% white.
- [x] The measurement audit puts every `data-fid` box within ±1 px, with exact computed colours, fonts and radii. The copy audit matches every string character for character.
- [x] The legal links open the URLs from `public/app-config.json` (http or https only) in a new tab with `noopener noreferrer`, and the typed values stay in place (SCRUM-31). If the config fails, the links render without `href` and nothing is logged.
- [x] The `:focus-visible` ring appears on keyboard focus for all six controls and never shows at rest, so the at-rest render is unchanged.
- [x] Submitting the form (Enter or a click) does nothing: the URL stays `/login`, the password never appears in the URL, and the values stay in place. Sign-in comes in Story 1.3.
- [x] No requests go outside the app and the console is empty.
- [x] The macOS CI job (`macos-latest`) runs the Fidelity check and uploads artifacts on failure.

## Decisions Needing Manager Sign-off (approved by the developer during implementation)

1. **Figma's Roboto metrics:** `fonts.css` sets `ascent-override: 92.77%; descent-override: 24.41%; line-gap-override: 0%`. Without them every text line renders 1–1.5 px higher than in Figma, and the screenshot fails at 0.565%. This applies to Roboto across the whole app.
2. **Legal-line spacing:** the copy stays the PRD's `' | '`. The extra space Figma draws around the separator (about 3.5 px each side) is applied in CSS.
3. **Photo mask:** the Fidelity check masks the silo photo with 8 px strips to the right of the panel edge. The photo's placement is still checked by the measurement audit.

## Review Findings

- **Patched (20):**
  - separator spacing moved from the copy into CSS;
  - http(s)-only legal URLs;
  - integer `<img>` attributes;
  - an autofill guard;
  - Fidelity runs against the production build;
  - guards for font loading, baseline size and colours;
  - a tighter mask;
  - new tests for submit, focus and font metrics.
- **Deferred (3):** logged in [deferred-work.md](deferred-work.md):
  - a Playwright browser cache in CI;
  - feedback on the Login and Forgot buttons once Stories 1.3 and 1.5 add them;
  - a PRD note recording the decisions above.
- **Rejected (by design):**
  - **Photo masking:** the PRD masks the photo.
  - **Text zoom and reflow:** the canvas is fixed at 1366 px (AD-4).
  - **Test-only text rendering:** the Fidelity run turns off coloured text edges and font hinting to match Figma's smoothing.

## Known Limits

- **Input edge:** the right edge of each input is off by less than 1 px, because Chrome rounds the 392.43 px width to 392. This is within the ±1 px tolerance.
- **Authoritative run:** the macOS CI run is the official result. It hasn't run yet because nothing has been pushed. The Windows run above passes.

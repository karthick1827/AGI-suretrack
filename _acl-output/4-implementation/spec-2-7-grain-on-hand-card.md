---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-09T10:52:32.379Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: 'Story 2.7 — Grain On Hand card'
tier: Tier 1 (Self-Contained)
type: 'feature'
created: '2026-11-09'
baseline_commit: '92a60c2230682451dc3ff0cb95210569744592f2'
implementation_status: in-progress
story_key: 2-7-grain-on-hand-card
jira: SCRUM-39
review_loop_iteration: 0
context:
  - '{project-root}/_acl-output/4-implementation/epic-2-context.md'
  - '{project-root}/_acl-output/planning-artifacts/architecture/architecture-agi-cursor2-2026-11-05/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Grain On Hand card (Story 2.2) shows only its shell and header. Customers can't see their grain inventory by Commodity, how full their storage is, or the per-Commodity amounts.

**Approach:**
- Fill the Grain On Hand card (426×326) inside the existing `{ status, data, onRetry, variant }` section contract (AD-18), for Full `6215:58878`, Small `6864:4514` and All-good `6879:15603`.
- Show the summary line and fill label (FR-84).
- Draw the segmented Fill bar from a new pure `geometry.grainSegments()` (AD-8, FR-85), with the remaining-capacity track.
- Show the two-column legend (FR-87), keeping the scaled Corn item as drawn.
- The card is display-only: no links, and no tooltip (FR-86 is deferred by AD-14).

## Boundaries & Constraints

**Always:**
- **Exact values:** every size, position, gap, colour, radius and font comes from PRD FR-83 to FR-87 and design spec Part B §8, §10, §12 to §14, verbatim, per state.
- **Summary:**
  - The left paragraph is `#374151`: `summaryBold` (SF 700 16/1.3), then one space, then `summaryRest` (SF 400 16/1.3).
  - The right side is `fillLabel` (SF 510 16/1.5 `#111827`).
  - The row is `space-between`, `flex-end`, `nowrap`.
  - All three strings are verbatim, keeping the Q-G3 contradictions.
- **Fill bar:** 386×10, radius 8.75, `overflow: hidden`, with absolutely placed 10 px segments.
- **Segment widths:** `round_to_1.25(amountK × 0.21386)`, with a 3.83 px gap after segment 1 and 3.75 px after each later segment. A segment's `segmentPx` / `segmentTopPx`, when present, override the formula (Q-G1).
- **Full segments:** Canola 0 → 72.5; Corn 76.33 → 67.5; Soybeans 147.58 → 57.5; Wheat 208.83 → 47.5; Barley 260.08 → 30; Oats 293.83 → 23.75. All within ±0.01 in unit tests and ±1 px in Fidelity.
- **Track:** `#EEF1EF` at left 321.33, width 81.25, clipped by the bar.
- **Small and All-good bar:** one Wheat segment, left 0, width 321, top −0.5.
- **Colours:** segment and swatch colours come from one Commodity colour map: Canola `#E3C341`, Corn `#E07B39`, Soybeans `#6F8F4F`, Wheat `#C98F2E`, Barley `#8FB36B`, Oats `#B9A47A`. The data `color` must match the map; an unknown Commodity gets no segment colour and never crashes.
- **Legend:** two columns of 188 px items with a column gap of 16, in file order, row-major. Each item has a 12.5 px swatch (radius 3.75, top 12.81), a name (SF 590 16/1.5 `#111827`) and a sub-label (SF 400 12/1.5 `rgba(0,0,0,0.8)`, top 36, `translateY(-50%)`). The Corn item keeps its scaled values (11.368 swatch, 3.41 radius, 11.65 top, left 22, name 14.551, sub 10.913, height 40) per Q-G2. Sub-labels are verbatim.
- **No hover:** no tooltip and no hover style on segments (AD-14).
- **Guards (as in Stories 2.3 to 2.6):**
  - Only strings and finite numbers render.
  - Non-finite or negative amounts never produce `NaN` or a crash.
  - A ready slice with no usable items or summary shows the Story 2.2 error state.
  - There is one visible-text rule.
  - Font weights use tokens where one exists; there is no 700 token, so a raw 700 with a comment.
  - No `::after` overlays.
  - Class assertions use data attributes or computed styles, never the Vitest CSS-module proxy.
- **Loading and error:** the Story 2.2 `SectionState` at the card's size, so there is no layout shift.
- **Unchanged:** every earlier Fidelity check.

**Ask First:** a value not found in the PRD or design spec; token, font or baseline changes; new copy; a new icon export.

**Never:** the Liquid card (Story 2.8); the FR-86 tooltip (deferred, AD-14); links; normalising the Corn legend item; responsive CSS; `react-router-dom`; a second fetch.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full | `demo`, `/dashboard` | `Grain On Hand` / `All grain inventory`; `1.40M bu` (bold) `of 1.78M bu · 79% full`; `79% Fill`; six segments at the FR-85 positions; the track at 321.33 + 81.25 | N/A |
| Legend, Full | Full | Canola, Corn / Soybeans, Wheat / Barley, Oats, with the sub-labels `340k bu · 1 unit` and so on verbatim; Corn at its scaled sizes | N/A |
| Small and All-good | `?state=small` or `allgood` | `21,050 bu` `of 25,000 bu · 79% full`; `84% Fill`; one Wheat segment of 321 at top −0.5; legend `Wheat` `21,050 bu · 1 unit · Wheat Storage` | N/A |
| Geometry | `grainSegments` unit tests | Full widths and lefts ±0.01; `segmentPx`/`segmentTopPx` override; zero or invalid amounts give no `NaN` | Skip the segment |
| Hover | Pointer over a segment | No tooltip and no visual change | N/A |
| Bad data | Unknown colour or Commodity, missing items, objects as values | No crash; the section error when nothing usable remains | Story 2.2 error |
| Loading / error | Latency or `?__fail=dashboard` | Story 2.2 placeholder or error at the card size | Retry via the layout |
| Fidelity | Each state at 1366 px | The card region screenshot is within 0.5% of the 1× Figma render; segments, track and legend are within ±1 px; copy is exact | Windows advisory, macOS authoritative |

</frozen-after-approval>

## Code Map

- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md` §4.9: FR-83 to FR-87 and notes Q-G1 to Q-G3.
- `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/addendum.md:838-881` (Part B §8 Grain On Hand card), plus §10, §12 to §14 and §16.
- `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/addendum.md:301-311` (§B `grain.*`), plus the JSON at `:389`, `:474` and `:549`, and B.8 expected chart results.
- `src/lib/geometry.js`: add `grainSegments()` next to `healthSegments()` and `runtimeBars()`.
- `src/features/dashboard/fan/fanActivity.js` and `FanActivityCard.jsx`: the latest guard, visible-text and content-rule patterns.
- `src/pages/Dashboard/DashboardPage.jsx` (the Grain slot), `src/ui/CardShell.jsx`, `src/ui/SectionState.jsx`, `src/lib/dashboardLayout.js` `FRAME[state].grain`, and `src/lib/fid.js` `grain.cornLegendItem`.
- `figma-reference/1x/dashboard-{full,small,allgood}-*.raw-1374x*.png`: crop the card at test setup through `writeCroppedBaseline` with its own references constant. The committed renders are never edited.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/geometry.js` `grainSegments(items)`: pure. Returns `{ name, color, left, width, top }[]` plus the track `{ left, width }`, with the formula, 1.25 px rounding, the FR-85 gaps and the `segmentPx`/`segmentTopPx` overrides.
- [ ] `src/features/dashboard/grain/GrainCard.jsx`, `.module.css` and `grain.js`: summary, Fill bar, track and legend (including the Corn item), with `data-fid`, plus the shared content rule.
- [ ] `src/pages/Dashboard/DashboardPage.jsx`: the Grain section renders `GrainCard` when ready.
- [ ] `tests/unit/geometry.test.js` (`grainSegments`) and `tests/unit/grain-card.test.jsx`: every I/O-matrix row except Fidelity, plus a check that no value is formatted.
- [ ] `tests/fidelity/grain-card.spec.js` and `expected/grain-card.json`: per-state card screenshot against the cropped Figma render (≤ 0.5%), the ±1 px audit, the copy audit, and hover producing no change.

**Acceptance Criteria:**
- Given `npm run lint && npm run build && npm test && npm run test:fidelity`, when run, then everything passes except the already-recorded Windows screenshot advisories, and all earlier Fidelity checks are unchanged.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint`, `npm run build`, `npm test`, `npm run test:fidelity`: expected to pass (Windows screenshot advisories documented).

---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T10:48:02.762Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: "Project Reconcile-Brief"
type: audit
created: 2026-11-05
---

# Input Reconciliation: PRD vs Brief, Brief Design Spec and Jira Stories

**PRD under check:** `prd.md` + `addendum.md` (this folder).
**Inputs:** `brief.md` (Approved), brief `addendum.md` Part A and Part B (Figma values), Jira story specs SCRUM-5, 27, 28, 29, 31, 37, 38, 39, 40 (Approved). SCRUM-30 is out of scope on purpose.

**Not flagged (deliberate decisions):**
- Readings copied from Figma exactly, even where they contradict each other.
- Tablet/phone layouts and chart tooltips deferred.
- Reset Password page out of scope.
- Menu label `Logout` (Figma) used instead of the brief's "Sign out".
- Bottom space per state: 16/28/24.
- Fan bars use the exact Figma heights through `barPx`.
- SF Pro through the system font stack.

## Summary verdict

**PASS WITH FIXES.** I sample-checked every element in the brief addendum's layout tables, typography tables and colour palette against the PRD. The PRD did not drop or change any Figma value for Login, the Forgot Password modal, the Dashboard cards or the Notifications panel. Coordinates, sizes, hex values, font weight, size and line-height, copy, and chart formulas all match. The few fractional values I re-derived (KPI tile x positions, Fill-bar lefts, chart bar offsets) also agree.

The PRD does more than copy the addendum in one place. FR-51 says the header divider (`e73a1.svg`) is invisible. The exported asset `figma-assets/dashboard/navline.svg` confirms this: its path carries `opacity="0"`. The brief addendum says the divider is visible.

The gaps fall into four groups:
1. **Self-contradiction on a deliberate decision.** §6.2 defers chart tooltips, but FR-86, FR-90 and the §4.9/§4.10 descriptions still specify them.
2. **Two internal style/font contradictions.**
   - Hover: FR-9 conflicts with FR-58.
   - Roboto weights: FR-4 conflicts with NFR-2.
3. **One place where Figma loses to an invented design.** The profile menu (FR-54) is a made-up dropdown, although Figma draws it.
4. **Bookkeeping.**
   - Deferred Jira ACs are not listed in §6.2.
   - Undesigned states are not all listed in §10, as brief rule 5 requires.
   - One Jira clause is missing: SCRUM-38 dryer alarms.
   - The SF Pro font tokens are missing.
   - PRD addendum §C contradicts PRD addendum §A and the FRs on session storage, routes and latency.

**Counts (per input row below):** covered 170 · deferred 9 · MISSING 3 · CONFLICT 11. These are **13 distinct gaps** to fix. Some gaps count more than once because they appear in several inputs.

---

## 1. Brief (`brief.md`)

| # | Brief item | PRD location | Status |
|---|---|---|---|
| B1 | Pixel-faithful React build; Figma file is the source of truth | §1, §0, FR-8 | covered |
| B2 | Six views with frames, sizes and data files (Solution table) | §3 Glossary, FR-10, §8, FR-93 | covered |
| B3 | `?state=full\|small\|allgood`, default `full`; the dummy account sets the default | FR-25, FR-93, addendum A.4.6 | covered |
| B4 | Rule 1: exact values, odd values kept (14.551, 9.375) | FR-8, FR-87, FR-90, FR-91 | covered |
| B5 | Rule 1: exact copy (U+00B7, ’, `Missing Fan Switched`) | FR-8, FR-94, §8.3 | covered |
| B6 | Rule 2: readings copied from Figma, contradictions kept | FR-94, §5 | covered |
| B7 | Rule 2: Health bar formula | FR-69 | covered |
| B8 | Rule 2: Grain formula `k_bu × 0.21386`, 1.25 px rounding | FR-85 | covered |
| B9 | Rule 2: Liquid formula `k_gal × 3.515625` | FR-90 | covered |
| B10 | Rule 2: Fan bar formula | FR-80 (`barPx`, deliberate; formula kept as fallback) | covered |
| B11 | Rule 3: unmodified SVGs; chevron redrawn 12×16 `#006A36` | FR-6, FR-65, FR-67 | covered |
| B12 | Rule 3: silo photo in two mirrored layers, about 2,700 px | FR-7, FR-12 | covered |
| B13 | Rule 3: covered photo layers not shipped | FR-7, FR-12 | covered |
| B14 | Rule 3: avatar shown as a 32 px circle | FR-7, FR-54 | covered |
| B15 | Rule 4: Roboto self-hosted (brief says 400/500/600) | FR-4 says 400/500/600; NFR-2 says 400–800; §4.4 conventions say 400–800; FR-10 Notes still asks | **CONFLICT** (internal, Gap 3) |
| B16 | Rule 4: SF stack with Inter fallback | FR-4, §4.4 conventions, NFR-2 | covered |
| B17 | Rule 4: Inter used once, for `83% Fill` | FR-4, FR-89 | covered |
| B18 | Rule 4: pixel tests run on macOS | FR-10, §8, C.4 | covered |
| B19 | Rule 5: minimal token styling; **each such element listed under Open Questions for Design** | FR-9, FR-58 present; §10.4 lists only some of them | **MISSING** (Gap 5) |
| B20 | Workflow 1: Enter submits; required messages; username trimmed | FR-21, FR-22 | covered |
| B21 | Workflow 1: check against users.json; redirect to `/dashboard` or the requested page | FR-24, FR-25, FR-11 | covered |
| B22 | Workflow 1: wrong-credentials copy and behaviour; one dummy user each for locked, inactive and expired | FR-26–FR-29, addendum A.3 | covered |
| B23 | Workflow 2: modal; Submit disabled until valid; confirmation copy | FR-36, FR-46, FR-47 | covered |
| B24 | Workflow 2: Cancel, Esc or a click outside closes; focus returns to the link | FR-48 | covered |
| B25 | Workflow 2: close X stays invisible | FR-39 | covered |
| B26 | Workflow 3: legal links open in a new tab; placeholder URLs in config | FR-20, addendum A.4.7 | covered |
| B27 | Workflow 4: Dashboard protected; KPI, row, View All, action-link and row targets; "Coming soon" | FR-56, FR-64, FR-72, FR-75, FR-57 | covered |
| B28 | Workflow 5: bell opens a right-anchored, full-height panel with no scrim; ✕ or Esc closes it; filters | FR-53, FR-97–FR-100 | covered |
| B29 | Workflow 6: profile menu out of scope except Sign out | FR-54, FR-35 (label `Logout`, deliberate) | covered |
| B30 | Success: ≤0.5% of pixels differ, ±1 px | FR-10, §8 | covered |
| B31 | Success: exact hex and copy | FR-1, FR-10, §8.2–8.3 | covered |
| B32 | Success: charts match the formulas in all states | §8.4, addendum B.8 | covered |
| B33 | Success: workflow works with keyboard and mouse | FR-21, FR-49, FR-58, NFR-5 | covered |
| B34 | Success: no console errors; `npm run build` passes | FR-8, NFR-8 | covered |
| B35 | Success: all icons are SVG | FR-6, NFR-3 | covered |
| B36 | Out: tablet/phone layouts; Reset Password | §6.2 | deferred |
| B37 | Out: Equipment, Alerts and Profile pages (placeholders) | §6.2, FR-57 | covered |
| B38 | Out: real API and auth; hidden layers | §5, §6.2, FR-8 | covered |
| B39 | Open Question 1: contradictory readings | §10.1–10.2 | covered |
| B40 | Open Question 2: style drift | §10.3 | covered |
| B41 | Open Question 3: missing states, including **chart tooltips (to be designed)** | §10.4 and §6.2 defer them, but FR-86 and FR-90 still specify tooltips | **CONFLICT** (Gap 1) |
| B42 | Open Question 4: destinations; `tel:` link | §10.5, FR-43 | covered |
| B43 | Open Question 5: leftovers; `6215:58878` is canonical | §10.6, FR-14, FR-39, Q-A1 | covered |
| B44 | Vision: tokens, SVG library and JSON components reused; API replaces JSON | §1, NFR-7, SM-4 | covered |
| B45 | Who it serves: design gets a list of design gaps | §10, §12 | covered |

## 2. Brief design spec: addendum Part A (Login and Forgot Password)

| # | Element / value (brief addendum) | PRD location | Status |
|---|---|---|---|
| A1 | Login variables `#ffffff`, `#a4dfbb`, `#004b27`, `#ffffff80`, `weight/regular` 400 | FR-1, FR-3 | covered |
| A2 | Modal colour variables (13 tokens) | FR-1 | covered |
| A3 | Modal spacing, radius and border-width tokens (`space/0…8`, `sm/md/xl/lg`, `radius/*`, `border-width/*`) | FR-2 | covered |
| A4 | Modal size and line-height tokens (`body/sm` 14 … `Line Height/Text - sm` 20) | FR-3 | covered |
| A5 | `Heading/md/Semibold` (−0.2px), `Label/md/Semibold`, `Body/md/Regular` | FR-3 | covered |
| A6 | `Shadow/Lg` = `0 12px 20px -2px rgba(39,39,39,0.15)`, not the filter version | FR-5, FR-37 | covered |
| A7 | Hard-coded `#009926`→`#006633`, `#02A45B`@40%, `#ffffff`, `#6B7280`, `#9CA3AF` | FR-1 | covered |
| A8 | Frame 1366×768, `#ffffff`, clips content | FR-12 | covered |
| A9 | Layers 1–3 and hidden `6026:60118` not shipped | FR-7, FR-12 | covered |
| A10 | Silo layers: 386.34 / −249.42 / 1571.09 × 1048.26; −634.24 / −283.10 / 1627.24 × 1085.39, clipped at x 513; `scaleX(-1)` | FR-12 | covered |
| A11 | Panel polygon `(0,0)…(519.958,768)`, 12.6265°, gradient stops and coordinates, `326.94deg 2.99%/62.28%`, opacity 0.9 | FR-13 | covered |
| A12 | Right overlay: bounds 1356.833, −55, 1824.10×823; visible triangle 9.17×12.68 | FR-14 | covered |
| A13 | Form column: x 90, y 127.039, w 392.4285, h 513.922; gaps 32 / 24 / 40 | FR-15 | covered |
| A14 | Logo 392.4305×24 at 90, 127.04; alt text "AGI SureTrack Farm" | FR-6, FR-15 | covered |
| A15 | Title `Login` 67.32×30 at 90, 191.04; Roboto 600 20/30 `#ffffff` | FR-16 | covered |
| A16 | Labels 64×20 and 62×20 at y 253.04 / 343.04; Roboto 400 14/20; nowrap | FR-16 | covered |
| A17 | Inputs 392.43×40 at y 279.04 / 369.04; transparent; 1.5px `#a4dfbb`; radius 4; field-group gap 6 | FR-17 | covered |
| A18 | Login button 392×40 at y 450.04; `#ffffff`; radius 8; px 16; gap 8; label 600 16/24 `#004b27` | FR-18 | covered |
| A19 | Forgot link box at x 199 (offset 109), y 524.96, 197×20; 500 14/20; underline with skip-ink none; left-aligned | FR-19 | covered |
| A20 | Legal box 126.21 / 576.96 / 320×64; Regular / Medium spans; separator rgba(255,255,255,0.5); mixed-weight spaces | FR-20 | covered |
| A21 | Vertical rhythm 24 → 40 → 30 → 32 → 20 → 6 → 40 → 24 → 20 → 6 → 40 → 41 → 40 → 34.92 → 20 → 32 → 64 | FR-15 | covered |
| A22 | Modal 600×374, radius 16, `Shadow/Lg`, stack 72 / 1 / 228 / 1 / 72 | FR-37 | covered |
| A23 | Header 600×72, padding 20 24, gap 8; title 532×24 at 24, 24 | FR-38 | covered |
| A24 | Close box 12×32 at 564, 20; X 12×12 at y 30; `#6B7280` 1.5 round caps; opacity 0 | FR-39 | covered |
| A25 | Dividers at y 72 and y 301, `#d1d5db` | FR-38, FR-44 | covered |
| A26 | Body at y 73, 600×228, `#fbfbfb`, padding 24, gap 16; copy 392×44 at 24, 97; 14/22 `#374151` | FR-40 | covered |
| A27 | Email group 320×60 at 24, 157, gap 4; label 600 12/16 `#374151`; `*` `#dc2626`; field at y 177, 320×40, 1px `#d1d5db`, radius 8, px 16; placeholder 400 16/24 `#6b7280` | FR-41 | covered |
| A28 | Help icon: 16 slot; 35.001 SVG at −8.5; r 7.5 at (9, 9); `#9CA3AF` 1.5 | FR-42 | covered |
| A29 | Help text 552×44 at 24, 233; line 2 Medium 500, not underlined | FR-43 | covered |
| A30 | Hidden Select `6026:62917` | FR-43, FR-8 | covered |
| A31 | Footer at y 302, 72 high, justify-end, gap 12, padding 16 24; Cancel 100×40 at 364, 318, transparent, `#111827`; Submit 100×40 at 476, 318, `#006a36`, `#ffffff`; 600 14/20 | FR-44 | covered |
| A32 | Typography table; Inter not rendered on Login; no text-transform | FR-3, FR-4 | covered |
| A33 | Raster and vector assets table | FR-6, FR-7 | covered |
| A34 | Unknown states and prototype data (backdrop, position, focus, error, tooltip) | FR-9, FR-36, FR-42, FR-45–FR-47 ([ASSUMPTION]) | covered |
| A35 | Copy deck verbatim, including ’ in the modal intro | FR-8, FR-38, FR-40, FR-41, FR-43, FR-44 | covered |
| A36 | Open Questions 1–13 | §10, notes on FR-17, FR-19, FR-39, FR-43 | covered |

## 3. Brief design spec: addendum Part B (Dashboard and Notifications)

| # | Element / value (brief addendum) | PRD location | Status |
|---|---|---|---|
| P1 | §1.1 colour variables (`#005c2f` … `#000000b2`) | FR-1 | covered |
| P2 | §1.1 `font/family` = "SF Pro"; `font/weight/regular/medium/semibold` = 400/510/590; empty-state `font-family/font-1` = Roboto | not listed as tokens in FR-3 (only applied inside styles) | **MISSING** (Gap 11) |
| P3 | `xs`/`md` 6; `icons/16px` 1.33; `Shadow/2` | FR-2, FR-5 | covered |
| P4 | Empty-state library tokens (`color/grey/96`, `azure/11/34`, `corner-radius/12`, `item-spacing/10/14`, `font-size/16`, `line-height/20_3`) | FR-1, FR-2, FR-3 | covered |
| P5 | §1.2 NativeBase and Roboto named styles (`Display/xs/Semibold` −0.48px, `Heading/md/Medium` −1%, …) | FR-3 | covered |
| P6 | §1.3 Roboto weights 400/500/600/700/800 | NFR-2 says 400–800; FR-4 says 400/500/600 | **CONFLICT** (Gap 3) |
| P7 | §1.4 palette: surfaces, text, brand, semantic, fan, grain, liquid, notifications, profile | FR-1 (as a group), FR-50–FR-101 (each value used) | covered |
| P8 | §1.5 elevation (header, cards, KPI, "All" chip) | FR-5, FR-51, FR-59, FR-65, FR-100 | covered |
| P9 | §2.1 page grid: 24 gutters, 1318 width, y 0 / 64 / 136 / 246, rows 444/240 and 326, gaps 20 | FR-50 | covered |
| P10 | §2.2 Header container 1366×64, flex space-between, padding 0 24 | FR-51 | covered |
| P11 | Left block 193 wide, gap 16; logo 176.895×14 `#111827`; divider `#9CA3AF` | FR-51. The PRD says the divider has `opacity="0"`; `navline.svg` confirms it, while the brief addendum implies the divider is visible | covered (see Gap 12) |
| P12 | Hidden "Farm Test" switcher; hidden title children | FR-51 | covered |
| P13 | Nav tabs 154×64; active `#F0FFF8` with 4px `#006A36` border; inactive at opacity 0.7; start at x 514.5; icons | FR-52 | covered |
| P14 | Right block gap 20; bell 20×20 `#111827`; avatar 48 holder with 32 circle and `#1C447E` fallback | FR-53, FR-54 | covered |
| P15 | Badge 14×14 at 9, 18; `#FF0000`; Roboto 800 9px −0.5px; `2` | FR-53 | covered |
| P16 | Header variants per active tab | FR-52 | covered |
| P17 | Page title: Roboto 600 24/32, −0.6px, `#09090B`, ellipsis; strip `#F3F4F4` with padding 16/20/24 | FR-55 | covered |
| P18 | KPI shell 1318×90; radius 16 vs 12; padding-y 6 and 4; justify per state | FR-59 | covered |
| P19 | Segment padding 12 20, gap 14, `#E6E8EB` left border; icon tile 44×46 / 44×44, radius 12; number 700 22/25.3; label 400 13.5 | FR-59, FR-60 | covered |
| P20 | Segment widths A/B/C (264/500/173/173/208; 264/308/248.67×3; 264/248/242×3); C positions 0/284/552 | FR-61–FR-63 | covered |
| P21 | Sub-count weight 400 (A) vs 700 (B, C); 40/50-wide blocks; 147 block; gap 20 | FR-62 | covered |
| P22 | Card shell; header 56 vs 33 (46 overflow); title `#1F2937`; subtitle colour split; View All min-height 44, padding 13.5 2 | FR-65 | covered |
| P23 | Equipment row: min-height 58, padding 12 0 8, height 68/69; left 74; right 523, gap 32; bar block 474, gap 6; chevron 18 box | FR-67 | covered |
| P24 | First-row divider rule per state | FR-68 | covered |
| P25 | Health bar 474×8, radius 4, 2px gaps; fr templates; B Bin made of two red cells | FR-69 | covered |
| P26 | Hatch gradient `43.841deg`, 5.8535% stripes | FR-70 | covered |
| P27 | Caption: Roboto 14/normal; numbers Bold `#111827`; words `#4B5563` | FR-71 | covered |
| P28 | Alerts card: gap 8, list gap 12; row gap 16; icon circles and glyph sizes; detail column; left 204; right column styles | FR-73, FR-74 | covered |
| P29 | Action link: height 24, gap 6, padding-y 6, radius 6; 510 14/1.25 `#005C2F`; arrow 16, stroke 1.33 | FR-75 | covered |
| P30 | Last-item border rule (A none, B bordered) | FR-76 | covered |
| P31 | Alerts empty state: `#F4F5F6`, radius 12, padding 32 18, gap 10, height 134; body width 377, 14/20.3 | FR-77 | covered |
| P32 | Fan stat tiles: width 386, gap 16, padding 8 10, radius 8; value 20 px box; label 17 px box | FR-79 | covered |
| P33 | Chart 386×119/120; columns 55.14 × 103; bar 24 (max 30), radius 5/2; `#0B7A3B` / `#0A5C30`; value label −18; day label padding-top 5 | FR-80, FR-81 | covered |
| P34 | Bar heights 54/61/66/72/68/79/76 | FR-80 (`barPx`) | covered |
| P35 | Fan caption: padding-top 12; 400 12/1.5 | FR-82 | covered |
| P36 | Grain layout: gap 20/24; summary height 45, gap 10; spans SF 700 / 400 16/1.3; `79% Fill` SF 510 16/1.5 | FR-83, FR-84 | covered |
| P37 | Grain segments (lefts, widths, gaps 3.83/3.75, track 321.33 + 81.25); B/C Wheat 321 at top −0.5 | FR-85 | covered |
| P38 | Grain legend: 188-wide items; swatch 12.5, radius 3.75 at top 12.81; text at left 24; sub at top 36; Corn exception | FR-87 | covered |
| P39 | Liquid: summary in Roboto, `83% Fill` in Inter 500; bar 9.375 high, radius 8.203, gap 3.516; widths; track 73 × 10 | FR-88–FR-90 | covered |
| P40 | Liquid legend: gaps 16 / 16.406; item 44.531; gap 10.547; marker 11.719 r 3.516; 14.551 / 10.913 | FR-91 | covered |
| P41 | Liquid empty state: height 220, padding 18 18 0, width 222; header 46 | FR-92 | covered |
| P42 | §10 per-state differences | FR-61–FR-92, addendum B.3–B.5 | covered |
| P43 | Notifications placement: the addendum recommends a drawer below the header; the brief says full height | FR-97 follows the brief (approved) | covered |
| P44 | Notifications container, title, toggle, tablist, chips, list 250×563, items, tags, timestamps, data | FR-98–FR-101, addendum B.7 | covered |
| P45 | Profile menu `6026:52937`: 290×768 panel, padding 20, gap 32; title `My Profile` Roboto 500 20/24 −0.2px `#374151`; 24 px icon + gap 16; entry Roboto 500 16/24; 198 px dividers; `Logout` `#E05400` | FR-54 invents a dropdown card (1px `#D1D5DB` border, radius 12, card shadow, anchored below the avatar). Only the colour and font of `Logout` come from Figma | **CONFLICT** (Gap 4) |
| P46 | §12 typography summary (spot-checked, all 33 rows) | FR-52–FR-101 | covered |
| P47 | §13 assets, including `n_close`, `n_toggle`, `arrow_right` | FR-6, FR-53, FR-60, FR-74, FR-75, FR-97, FR-99 | covered |
| P48 | §14 data readings, verbatim | addendum B.3–B.7 (spot-checked: every string matches) | covered |
| P49 | §15: clickable elements; no hover variants; **no tooltip design** | FR-58, FR-64, FR-72, FR-75; tooltips still specified in FR-86 / FR-90 | **CONFLICT** (Gap 1) |
| P50 | Alternate frame `7833:12061` | §10.6, Q-A1 | covered |
| P51 | §16 inconsistencies 1–28 and (a)–(f) | §10, Q-K1/K2, Q-E1/E2, Q-A1–A3, Q-N1/N2, Q-G1–G3, Q-Q1–Q3, Q-P1–P3 | covered |

## 4. Jira story specs (Approved)

| Story / AC | Requirement (short) | PRD location | Status |
|---|---|---|---|
| SCRUM-5 | No description or ACs (attachment only) | §0 lists the story | covered (nothing to trace) |
| 27 AC1 | Signed out → Login page with all elements and the photo | FR-11, FR-12–FR-20 | covered |
| 27 AC2 | Tablet/phone layout | §6.2 | deferred |
| 27 AC3 | Empty field → no request; required messages | FR-22 | covered |
| 27 AC4 | Enter submits; tab order | FR-21 | covered |
| 27 AC5 | Autocomplete hints; trim the username, not the password | FR-17, FR-22 | covered |
| 27 AC6 | Loading state; extra clicks ignored | FR-23 | covered |
| 27 AC7 | Session set; land on the Dashboard or the requested page | FR-25 (client dummy Session; real server session is in §6.2) | covered |
| 27 AC8 | Already signed in → Dashboard | FR-33 (at risk from the sessionStorage choice in C.2, Gap 8) | covered |
| 27 AC9 | Sign-out reaches all tabs; Back doesn't show data | FR-35, C.2 | covered |
| 28 AC1 | Wrong credentials | FR-26 | covered |
| 28 AC2 | Locked account | FR-27 | covered |
| 28 AC3 | Inactive account or no subscription | FR-28 | covered |
| 28 AC4 | Expired password with a link to Forgot Password | FR-29, FR-36 | covered |
| 28 AC5 | Too many attempts; Login disabled | FR-30 | covered |
| 28 AC6 | Offline or timeout (15 s) | FR-31 | covered |
| 28 AC7 | Session expired → Login, then back to the same page | FR-34 | covered |
| 28 AC8 | Alert banner announced; button re-enabled | FR-32, FR-23 | covered |
| 29 AC1 | Modal contents | FR-36–FR-44 | covered |
| 29 AC2 | Help tooltip (text TBC) | FR-42 | covered |
| 29 AC3 | Submit disabled; `Enter a valid email address` on blur | FR-45, FR-46 | covered |
| 29 AC4 | Loading, then the same confirmation | FR-47 | covered |
| 29 AC5 | Close or resend after 60 s (TBC) | Close: FR-48. Resend: excluded in §4.3 Out of Scope but **not in §6.2** | deferred (Gap 6) |
| 29 AC6 | Cancel, Esc or click outside; focus returns; focus trapped | FR-48, FR-49 | covered |
| 29 AC7 | Tap-to-call | FR-43 | covered |
| 31 AC1 | Legal sentence with two links | FR-20 | covered |
| 31 AC2 | New tab; typed values kept | FR-20 | covered |
| 31 AC3 | Offline behaviour | FR-20 | covered |
| 31 AC4 | Keyboard access, focus ring, URLs change without a release | FR-20, addendum A.4.7 | covered |
| 37 AC1 | KPI strip contents | FR-61–FR-63 | covered |
| 37 AC2 | Tile navigation | FR-64 | covered |
| 37 AC3 | Equipment card bars and text | FR-66–FR-71 | covered |
| 37 AC4 | Zero categories omitted; singular and plural | FR-71 | covered |
| 37 AC5 | Counting precedence; totals agree with the Equipment page | Q-E2 (display only; "totals agree" is overridden by the verbatim-readings rule). **Not in §6.2** | deferred (Gap 6) |
| 37 AC6 | Row and View All navigation | FR-72 | covered |
| 37 AC7 | Tablet/phone wrapping; cards stack below 1024 | §6.2 | deferred |
| 37 AC8 | Loading and error with Retry | FR-95, FR-96 | covered |
| 38 AC1 | Top 4; Critical first; View All | FR-73, FR-76 | covered |
| 38 AC2 | Row content | FR-74 | covered |
| 38 AC3 | Action link and row navigation | FR-75 | covered |
| 38 AC4 | Hover highlight; keyboard access | FR-58, FR-75 | covered (but contradicts FR-9, Gap 2) |
| 38 AC5 | Empty → "No active alerts" | FR-77 (Figma copy wins, documented) | covered |
| 38 AC6a | **Dryer alarms are included (AGI-R28)** | not mentioned anywhere | **MISSING** (Gap 7) |
| 38 AC6b | Relative time updates every minute; full date on hover | Q-A2 only; **not in §6.2** | deferred (Gap 6) |
| 39 AC1 | Total and capacity; `79% Fill` | FR-84 | covered |
| 39 AC2 | Bar split by commodity; grey track | FR-85 | covered |
| 39 AC3 | Segment tooltip | §6.2 defers it, but FR-86 specifies it | **CONFLICT** (Gap 1) |
| 39 AC4 | Legend, largest first, two columns | FR-87 | covered |
| 39 AC5 | "1.40M" / "340k" format; metric unit TBC | FR-84, FR-87 (verbatim); metric only in Notes | covered (metric part in Gap 6) |
| 39 AC6 | Total covers bins, piles and flats; storage with no reading is left out | Notes only; **not in §6.2** | deferred (Gap 6) |
| 39 AC7 | Shared colour map | FR-85 | covered |
| 39 AC8 | More than 6 → "Other"; no storage → hide card | Notes only; **not in §6.2** | deferred (Gap 6) |
| 40 AC1 | Total and capacity; `83% Fill` | FR-89 | covered |
| 40 AC2 | Bar by product with track; **hover tooltip** | Bar: FR-90. Tooltip: §6.2 defers it, but FR-90 still specifies it | **CONFLICT** (Gap 1) |
| 40 AC3 | Legend with colour, name, volume and tank count | FR-91 | covered |
| 40 AC4 | Gallons or litres | Q-Q3 only; **not in §6.2** | deferred (Gap 6) |
| 40 AC5 | No tanks → card hidden; unknown product shown in grey | FR-92 (Figma empty state overrides "hidden", documented); grey product only in Q-Q3 | covered (grey part in Gap 6) |

## 5. Internal consistency (PRD vs its own addendum), found during reconciliation

| # | Item | Locations | Status |
|---|---|---|---|
| I1 | Hover style | FR-9 says hover changes "only the cursor… no colour, underline or background change"; FR-58 adds a row background of `#F0FFF8` and underlined links | **CONFLICT** (Gap 2) |
| I2 | Session storage and fields | Addendum A.5: shared by all tabs; fields `username, displayName, dashboardState, issuedAt, expiresAt`. Addendum C.2: `sessionStorage` (one tab only) with `{ username, dashboardState, signedInAt }` | **CONFLICT** (Gap 8) |
| I3 | Route shapes | FR-57 / FR-75: `/equipment/<deviceId>/<actionKey>`. C.1: `/alerts/:id/:action` and `/profile` | **CONFLICT** (Gap 9) |
| I4 | Simulated latency | FR-23 / FR-47 and A.1: `policy.simulatedLatencyMs` 800. C.2: "300 ms in development, 0 ms in Fidelity tests" | **CONFLICT** (Gap 10) |
| I5 | Editorial | FR-57 and FR-58 say "Realizes UJ-1, UJ-1." | minor (Gap 13) |

---

## Gaps to fix

1. **Chart tooltips: the PRD contradicts its own §6.2 deferral** (SCRUM-39 AC3, SCRUM-40 AC2; brief Open Question 3).
   - **FR-86:** replace the title and both consequences with:
     > **FR-86: No segment tooltip (deferred).** Coloured segments and the track of the Grain Fill bar show no tooltip and no hover style in this release; SCRUM-39 AC3 is deferred until AGI design supplies a tooltip (§6.2).
   - **FR-90:** replace the last consequence with:
     > No tooltip on Liquid segments; SCRUM-40 AC2 hover tooltip is deferred (§6.2).
   - **§4.9 Description:** replace "Hovering a segment shows a minimal tooltip (SCRUM-39 AC3) [ASSUMPTION style]." with:
     > Segment tooltips (SCRUM-39 AC3) are deferred until designed (§6.2).
   - **§4.10 Description:** replace "Hover tooltip per SCRUM-40 [ASSUMPTION style]." with:
     > Segment tooltips (SCRUM-40 AC2) are deferred until designed (§6.2).
   - **§11:** delete the FR-86 / FR-90 tooltip entries and the "4.9 — style" / "4.10 — style" entries.
   - **Addendum B.1 rule 1:** delete "and the tooltip share in FR-86/FR-90".
   - **Addendum B.2:** change the notes "Tooltip share" / "Tooltip share only" / "Tooltip amount text" to "Reserved for the deferred tooltip; not used in this release."

2. **Hover rule (FR-9 vs FR-58).** In FR-9, replace the bullet "Hover on links and buttons changes only the cursor to `pointer`; no colour, underline or background change. [ASSUMPTION]" with:
   > On the Login page and Forgot Password modal, hover on links and buttons changes only the cursor to `pointer`; no colour, underline or background change. Dashboard hover styling is defined in FR-58 (SCRUM-38 AC4). [ASSUMPTION]

3. **Roboto weights (brief rule 4 vs NFR-2 vs FR-4).**
   - **FR-4, first bullet:** replace it with:
     > Roboto at weights 400, 500, 600, 700 and 800 is self-hosted as WOFF2 (no request to a third-party font CDN at runtime). 400/500/600 cover the Login page, Forgot Password modal, Header, page title, KPI labels, chart labels, Empty states and panels; 700 covers KPI numbers, Health caption numbers, the Runtime chart `Today` label, Empty-state titles and the Liquid summary bold span; 800 covers only the bell badge.
   - **FR-4, Inter bullet:** align it with NFR-2 by stating the weights once:
     > Inter is self-hosted at 400, 500, 600 and 700 (500 for `83% Fill`; all four as the SF-stack fallback).
   - **NFR-2:** change "Inter is self-hosted for the single Inter text style" to:
     > Inter is self-hosted at 400/500/600/700 (FR-4).
   - **§4.1 Notes:** delete the first note ("Brief rule 4 self-hosts Roboto 400/500/600 only … Confirm whether 700/800 …"), or turn it into a resolved note:
     > Resolved: 700/800 are self-hosted because Figma uses them (addendum Part B §1.3); brief rule 4 listed only the Login weights.

4. **Profile menu presentation weakens Figma** (addendum Part B §11, "Related panel", `6026:52937`; brief rule 1). In FR-54, replace the bracketed menu-presentation assumption with:
   > [ASSUMPTION: presentation reuses the Figma "MY PROFILE" panel `6026:52937`: a 290 px wide, full-viewport-height panel anchored right (same placement rules as FR-97), background `#FFFFFF`, padding 20, column gap 32; title `My Profile` Roboto 500 20/24, letter-spacing −0.2px, `#374151`, with a 12×24 close control; one menu entry: 24 px icon + 16 px gap + `Logout` in Roboto 500 16/24 `#E05400`, followed by a 198 px divider at y 35.5. The user block (`Henry Jones`, `Global Storage`) and the other entries (My Profile, My Preference, Account Settings, Help) are not shown.]

   If the Manager prefers the dropdown, keep it, but add it to §10.4 as a design gap and add this sentence to FR-54:
   > This deviates from Figma `6026:52937`, which draws a 290 px side panel.

   The Logout icon is not in `figma-assets/dashboard/`. Add it to the asset export list, or state "no icon" explicitly.

5. **§10.4 does not list every undesigned element, as brief rule 5 requires.** Add this bullet to §10 item 4:
   > **Other assumed visuals introduced by this PRD:** Login inline validation messages and error border (FR-22); Login and Submit spinners (FR-23, FR-47); disabled Login button during lockout (FR-30); Forgot Password modal position, `#000000b2` backdrop and no animation (FR-36); help-icon tooltip (FR-42); email error message (FR-45); keyboard-focus visibility of the invisible close X (FR-39); Dashboard focus ring and row/link hover (FR-58); "Coming soon" placeholder page (FR-57); Dashboard loading placeholders and `Couldn’t load this section.` / Retry (FR-95, FR-96); profile menu presentation (FR-54); Unread Only OFF state, active-chip transfer and empty filter result (FR-99, FR-100).

6. **§6.2 is missing several deferred Jira ACs.** The task treats §6.2 as the record of deliberate deferrals, so add these bullets:
   - > **Resend reset link after 60 s** (SCRUM-29 AC5, TBC). The confirmation offers Cancel only.
   - > **Live relative times and full-date hover on alerts** (SCRUM-38 AC6). Times are verbatim strings; no absolute timestamp or tooltip design exists.
   - > **Counting precedence and cross-page total agreement** (SCRUM-37 AC5). This build displays the state file's numbers verbatim (FR-94).
   - > **Grain data rules not exercised by the Figma data:** metric units (SCRUM-39 AC5, TBC), the totals-composition and missing-reading note (AC6, TBC), the "Other" grouping beyond 6 commodities and hiding the card with no storage (AC8).
   - > **Liquid data rules not exercised by the Figma data:** litres (SCRUM-40 AC4), unknown product in grey (AC5). Hiding the card with no tanks is replaced by Figma's Empty state (FR-92).

7. **SCRUM-38 AC6 "Dryer alarms are included (AGI-R28)" is not mentioned anywhere.** Add to the FR-76 consequences:
   > Alert rows for dryers are listed like any other equipment when present in the data (SCRUM-38 AC6, AGI-R28); none of the three state files contains a dryer alert, so this is verified with a test fixture.

8. **Session storage contradiction (addendum C.2 vs A.5, FR-33, FR-35).** In addendum C.2, replace the Session bullet with:
   > **Session:** stored in `localStorage` under `suretrack.session` as `{ username, displayName, dashboardState, issuedAt, expiresAt }` (A.5), so it is shared by all tabs and survives reload; never contains the password. Cross-tab sign-out uses the `storage` event on that key (SCRUM-27 AC9).

   Reason: `sessionStorage` is per tab, which breaks FR-33 (already signed in) in a new tab, and it lacks the `expiresAt` that FR-34 needs.

9. **Route list contradiction (addendum C.1 vs FR-57, FR-75).** In addendum C.1, replace the "Protected routes" bullet with:
   > **Protected routes:** `/dashboard`, `/equipment` (optional `?type=bins|piles|flats|tanks|dryers` or `?status=online|offline`), `/equipment/:deviceId`, `/equipment/:deviceId/:actionKey` (`hotspot|fans|connection|fan-switches`), `/alerts`.

   Then remove `/alerts/:id/:action` and `/profile`, or add `/profile` to FR-57.

10. **Latency contradiction (addendum C.2 vs A.1, FR-23, FR-47).** In addendum C.2, replace the "Simulated latency" sub-bullet with:
    > **Simulated latency:** sign-in and forgot-password results use `policy.simulatedLatencyMs` (800 ms, A.1); Dashboard and notifications JSON loads use 300 ms in development and 0 ms in Fidelity tests. `[ASSUMPTION]`

11. **Missing SF Pro and font tokens** (addendum Part B §1.1, empty-state table). Add a bullet to FR-3:
    > Font tokens: `font/family` = "SF Pro" (rendered through the SF stack, FR-4); `font/weight/regular` 400, `font/weight/medium` 510, `font/weight/semibold` 590; empty-state `font-family/font-1` = Roboto.

12. **Header divider visibility differs from the brief addendum.** FR-51 is correct: `navline.svg` (`e73a1.svg`) has `opacity="0"`. Brief addendum Part B §2.2 and §13 describe a visible divider. Add to §10 item 6:
    > The Header divider `e73a1.svg` is exported with `opacity="0"` and is invisible in the Reference render, although addendum Part B §2.2 describes it as a visible `#9CA3AF` line; kept invisible as drawn — confirm.

13. **Editorial.** In FR-57 and FR-58, change "Realizes UJ-1, UJ-1." to "Realizes UJ-1."

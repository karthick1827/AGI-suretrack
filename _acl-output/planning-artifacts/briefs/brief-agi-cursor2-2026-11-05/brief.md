---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T10:19:04.197Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: "Product Brief: AGI SureTrack Farm — Web Login & Dashboard"
project_type: greenfield
created: "2026-11-05"
updated: "2026-11-05"
---

# Product Brief: AGI SureTrack Farm — Web Login & Dashboard

## Executive Summary

AGI SureTrack Farm is a monitoring app for farmers' grain storage (bins, piles, flats), dryers and liquid tanks. This brief covers the first two web screens, **Login** and **Dashboard**, and two overlays that belong to them: the **Forgot Password** modal and the **Notifications** panel.

The goal is a React build that is a **pixel-faithful copy of the approved Figma design**. That means the same typography, colours, measurements, shapes, icons (as SVG), image placement, charts and readings. All data comes from local dummy JSON files that reproduce the design's readings exactly, so the screens can be checked against Figma frame by frame before any real API exists.

**Source of truth:** Figma file `js9ue0LTQDFIxAsxEuM8Wx` ("AGI-Web", page "🎨 Demo"). Every extracted value is in [addendum.md](addendum.md), the exported assets are in `figma-assets/`, and the reference renders are in `figma-reference/`.

## The Problem

The design team has finished these screens in Figma. A loose "inspired by" implementation would mean weeks of design-review ping-pong over spacing, font weights and chart proportions. Two things make this harder:

- **Figma is not a complete spec.** The file has no prototype links the tools can read, no hover, focus or error states, and no tablet or phone layouts.
- **Figma's numbers contradict each other** in places (see §Open Questions for Design).

Without explicit rules, each developer will fill these gaps differently, and "100% accurate" can't be tested.

## The Solution

Build the four views in the existing **React 19 + Vite 8** app (`src/`). Use the extracted Figma values as design tokens, the exported SVGs for every icon and the logo, and the original silo photo for the Login background. Drive the Dashboard from one JSON file per Figma state.

| View | Figma frame | Size | Data |
|---|---|---|---|
| Login | `6026:60111` | 1366×768 | `users.json` (dummy accounts) |
| Forgot Password modal | `6026:62907` | 600×374 | none (dummy submit) |
| Dashboard — full account | `6215:58878` | 1366×1052 | `dashboard.full.json` |
| Dashboard — small account, 1 alert | `6864:4514` | 1366×860 | `dashboard.small.json` |
| Dashboard — all good | `6879:15603` | 1366×856 | `dashboard.allgood.json` |
| Notifications panel | `8270:44312` | 290×768 | `notifications.json` |

The Dashboard state is chosen with a URL query, `?state=full|small|allgood`. The default is `full`. `[ASSUMPTION]` The dummy account in `users.json` sets the default state.

### Fidelity rules (how "100% accurate" is decided)

1. **Visible appearance follows Figma.**
   - **Exact values:** every size, position, radius, border, shadow, colour (hex), font family, weight, size, line height and letter spacing in the addendum is implemented as written. Odd values are kept too (e.g. 14.551 px legend text, 9.375 px liquid bar).
   - **Exact copy:** all text is verbatim, including "·" (U+00B7), curly apostrophes and the design's typo "Missing Fan Switched".
2. **Readings copy Figma exactly**, including where Figma contradicts itself. Charts are drawn with the formulas in addendum Part B, which reproduce Figma's pixel widths and heights, not idealised maths:
   - **Health bar:** `segment = (474 − 2·(k−1)) × count/total`.
   - **Grain bar:** `segment ≈ k_bu × 0.21386`, rounded to 1.25 px.
   - **Liquid bar:** `segment = k_gal × 3.515625`.
   - **Fan bars:** `height ≈ round(hours / 90 × 79)`.
3. **Icons, the logo and images come from Figma.**
   - **Icons and logo:** the exported Figma SVGs, used unmodified. The only icon not exported is the right chevron (an SF Symbol glyph in Figma); it is redrawn as an SVG matching 12×16 px in `#006A36`.
   - **Silo photo** (`981df`): placed in two mirrored layers as specified, served as an optimised copy of about 2,700 px wide (WebP/JPEG).
   - **Hidden photos:** the four photo layers that are fully covered are not shipped.
   - **Avatar:** the avatar photo is used as a 32 px circle.
4. **Fonts.**
   - **Roboto 400/500/600** is self-hosted. It covers the login page, header, title, KPI strip, chart labels, empty states and panels.
   - **Card text** is designed in **SF Pro**. Apple's licence does not allow self-hosting SF Pro on the web, so card text uses `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"` with Inter as the fallback. That renders the real SF Pro on macOS and iOS.
   - **Inter** is used once, for "83% Fill".
   - `[ASSUMPTION]` Pixel-comparison tests run on macOS (see Success Criteria).
5. **Behaviour Figma doesn't draw comes from the approved Jira stories** (SCRUM-27 to 31, 37 to 40). Where a story implies a visual Figma lacks (hover, focus, error text), it gets the smallest possible styling built from existing tokens, and it never changes how the screen looks at rest. Each such element is listed under §Open Questions for Design for the design team to supply.

### Workflow

1. **Login** (SCRUM-27, SCRUM-28).
   - **Validation:** pressing Enter submits. Empty fields show "Username is required" or "Password is required". The username is trimmed before checking.
   - **Credentials:** checked against `users.json`. On success, go to `/dashboard`, or to the page the user originally tried to open.
   - **Errors:** wrong credentials show "Username or password is incorrect". The username stays, and the password is cleared and focused. Locked, inactive and expired accounts each have one dummy user showing its message.
2. **Forgot Password or Username?** opens the modal over the Login page (SCRUM-29).
   - **Submit:** disabled until the email is valid. Submitting shows the same confirmation for any email: "If an account exists for this email, we've sent a reset link. Check your inbox and spam folder."
   - **Closing:** Cancel, Esc or a click outside closes the modal and returns focus to the link.
   - **Close X:** the X is at opacity 0 in Figma, so it stays invisible.
3. **Privacy Policy and Terms of Service** each open in a new tab (SCRUM-31). `[ASSUMPTION]` They point to placeholder URLs in a config file until real URLs are supplied.
4. **Dashboard** (SCRUM-37, SCRUM-38). The page only shows when signed in; otherwise it redirects to Login. Clicking:
   - **a KPI tile** opens Alerts, the matching Equipment section, or Equipment;
   - **an equipment row** opens that type's Equipment section;
   - **View All** opens Equipment or Alerts;
   - **an alert's action link** (View Hotspot, Check Fans, Check Connection, Check Fan Switches) opens that screen;
   - **anywhere else on an alert row** opens the equipment detail page.

   `[ASSUMPTION]` These target pages are out of scope, so their routes render a "Coming soon" placeholder.
5. **Bell** opens the Notifications panel, anchored to the right edge at full viewport height. `[ASSUMPTION]` There is no scrim, and the panel closes with ✕ or Esc. The "Unread Only" toggle and the All / App / Equipment / Promotions chips filter the JSON list.
6. **Avatar** has a profile menu in Figma (`6026:52937`). It is out of scope except for **Sign out**, which returns to Login.

## Who This Serves

- **Farm customers.** They check their storage, alerts and inventory at a glance from a computer.
- **The development team.** They need a spec they can build to without guessing, and tests that say "done".
- **Design and QA.** They get a build they can overlay on Figma, plus a list of design gaps to close.

## Success Criteria

- **Visual match.** At 1366 px wide in Chrome on macOS, each view is compared with its Figma frame exported at 1×, using automated screenshot comparison (Playwright).
  - **Pixels:** no more than 0.5% of pixels differ, excluding anti-aliasing tolerance and the silo photo. `[ASSUMPTION — threshold to be agreed with QA]`
  - **Measurements:** every measured element is within ±1 px of the addendum.
- **Exact values.** Colours match the addendum's hex values exactly. Every text string matches the addendum's copy deck character for character.
- **Charts.** Chart segments and bars match the addendum formulas, with Figma readings reproduced verbatim in all three states.
- **Workflow.** Every step in §Workflow works with keyboard and mouse.
- **Code quality.** No console errors. `npm run build` passes.
- **Assets.** All icons are inline or imported SVGs; no icon is a raster image.

## Scope

**In:** Login, the Forgot Password modal, the Dashboard (3 states), the Notifications panel, header navigation with an active "Dashboard" tab, dummy JSON data, and a client-side dummy login session.

**Out:**
- **Not designed:** tablet and phone layouts (only 1366 px is designed); the Reset Password page (SCRUM-30); hover, focus and error visuals beyond the minimal defaults in rule 5.
- **Other pages:** the Equipment, Alerts and Profile pages (placeholders only).
- **Not part of this build:** real API integration, real authentication, and the hidden Figma layers ("Remember Me", register link, "Farm Test" switcher).

## Open Questions for Design

None of these blocks the build, which copies Figma as drawn, but each should be fixed in Figma:

1. **Readings that contradict each other:**
   - **Full state:** "7 Need attention" vs 5 alerts in the health bars vs 4 in Recent Alerts; Offline 4 vs 1 offline; 6 tanks vs 17 in the liquid legend; 6 grain units vs 12 storages; the bar fills (83% and 81%) don't match their labels (79% and 83%).
   - **Small and all-good states:** "79% full" next to "84% Fill"; fan tiles "7 / 86 h / 410 kWh" next to "2 of 3" fans; "7 h 24 m" next to the chart's "Today 86h"; the bell badge "2" in every state.
2. **Style drift:**
   - **Colours:** three reds (#C62828, #DC2626, #FF0000); two page greys (#F3F4F6 vs #F3F4F4).
   - **Fonts:** KPI sub-counts are Regular in one state and Bold in the others; SF Pro, Roboto and Inter are mixed.
   - **Inputs:** the Login inputs have a 4 px radius vs the modal's 8 px.
3. **Missing states:**
   - **Fields and buttons:** focus, error, disabled and loading.
   - **Hover:** links, nav tabs and rows.
   - **Chart tooltips** (SCRUM-39 and 40 ask for them).
   - **Notifications panel:** its scrim, position and animation.
4. **Missing destinations:** URLs for Privacy Policy and Terms of Service; whether the SureTrack Coach number should be a `tel:` link.
5. **Leftover Figma items:** an invisible close ✕ in the modal; a stray 9×13 px green triangle at the bottom right of Login (kept as drawn); an alternate Dashboard frame `7833:12061` with different alert data. This brief treats `6215:58878` as canonical because it matches SCRUM-38.

## Vision

Once this build has been signed off, the same token set, SVG icon library and JSON-driven card components become the base for the Equipment, Alerts and Profile pages already drawn in this Figma file. When the real API lands, it replaces the JSON files without changing the components.

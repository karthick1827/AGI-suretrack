---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T10:38:27.029Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: "PRD: AGI SureTrack Farm — Web Login & Dashboard"
created: "2026-11-05"
updated: "2026-11-05"
---

# PRD: AGI SureTrack Farm — Web Login & Dashboard

*Working title — confirm.*

## 0. Document Purpose

This PRD is the build contract between ACL Digital and AGI for the first two screens of the AGI SureTrack Farm web app: the **Login page** and the **Dashboard**. It also covers the **Forgot Password modal** and the **Notifications panel**. It is written for the developers who build the screens, the QA engineers who run the **Fidelity check**, AGI's design team, and the Manager who approves each phase.

It builds on three approved inputs and does not repeat them:

- **Product brief:** [brief.md](../../briefs/brief-agi-cursor2-2026-11-05/brief.md) (Approved). It holds the fidelity rules, scope and decisions.
- **Design specification:** [addendum.md](../../briefs/brief-agi-cursor2-2026-11-05/addendum.md). It holds every value extracted from Figma, layer by layer, and is the source behind every px, hex and font value in this PRD. Its assets are in `figma-assets/` and its **Reference renders** in `figma-reference/`.
- **Jira stories:** SCRUM-5, 27, 28, 29, 31, 37, 38, 39 and 40 (Approved story specs in `_acl-output/`). They are the source for behaviour Figma does not draw.

**How to read this document:**
- §3 Glossary fixes the vocabulary; every later section uses those terms exactly.
- §4 groups the product into features. Each functional requirement (FR) has a stable global ID and a list of **testable consequences** with the exact Figma values (px, hex, font, copy, chart formula). A requirement is met only when every consequence is true.
- `[ASSUMPTION]` marks anything inferred rather than confirmed; §11 indexes them all.
- Implementation choices (framework, file layout, test tooling) and the dummy-data contracts are in this PRD's [addendum.md](addendum.md).

**Precedence when sources disagree:**
1. For anything visible, the Figma frame wins.
2. For behaviour Figma doesn't show, the Jira acceptance criteria win.
3. Where Figma is internally inconsistent, the screen reproduces Figma as drawn, and the inconsistency is listed in §10 for AGI design to resolve.

## 1. Vision

AGI SureTrack Farm helps farmers watch over their grain storage (bins, piles and flats), dryers and liquid tanks remotely. The web app opens on two screens. The **Login page** gets a customer in quickly and safely. The **Dashboard** then shows, on one desktop screen:
- what needs attention;
- how each equipment type is doing;
- how hard the fans have worked this week;
- how much grain and liquid is on hand.

This release delivers those screens as a **pixel-exact implementation of AGI's approved Figma design**. Typography, colours, spacing, shapes, SVG icons, image placement, charts and every reading must match the Figma frames. All data comes from local dummy JSON, so the build can be signed off visually and behaviourally before the real SureTrack API is connected. Once the shell, the **Design tokens** and the card components are proven against Figma, the Equipment, Alerts and Profile screens already designed can be built on the same base.

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** sign in from a desktop browser and see, in a few seconds, whether any storage, dryer or tank needs attention.
- **Functional:** know grain and liquid inventory without adding up each bin or tank.
- **Functional:** go straight from an alert to the thing to do next (View Hotspot, Check Fans, Check Connection, Check Fan Switches).
- **Emotional:** feel reassured when everything is fine ("all good"), and not miss it when something isn't.
- **Contextual:** get back into the account alone when the password or username is forgotten, without calling support first.
- **For AGI as the client:** receive a build that matches the approved design exactly, so design review doesn't reopen settled decisions.

### 2.2 Non-Users (v1)

- Mobile and tablet users: only the 1366 px desktop layout is designed (§6.2).
- AGI support or admin staff managing multiple farms: the "Farm Test" switcher is hidden in Figma and out of scope.
- New customers registering an account: the register link is a hidden Figma layer and out of scope.

### 2.3 Key User Journeys

- **UJ-1. Dale checks his farm before supper.** `[ASSUMPTION — persona drafted from Jira SCRUM-27/37/38; confirm with AGI]`
  - **Persona + context:** Dale runs a 12-bin grain operation with a few tanks and two dryers. He checks SureTrack on the office desktop at the end of the day.
  - **Entry state:** signed out; opens the SureTrack web address in Chrome on a 1366 px-wide screen.
  - **Path:**
    1. The **Login page** shows the silo photo behind the green panel. Dale types his username and password and presses Enter.
    2. He lands on the **Dashboard** (Full state). The **KPI strip** reads `7` `Need attention · 2 critical`.
    3. The **Recent Alerts card** lists `HotSpot Detected` on `759 | Wheat Storage` as Critical, 30 mins ago.
    4. He clicks the **Action link** `View Hotspot`.
  - **Climax:** within one screen he knows what is wrong (a hotspot in his wheat bin), where it is and what to do next, and the **Grain On Hand card** confirms `1.40M bu` stored.
  - **Resolution:** the hotspot screen opens (a "Coming soon" placeholder in this release). He returns to the Dashboard with the Back button, and the bell badge shows unread notifications for later.
  - **Edge case:** with a wrong password, the Login page shows `Username or password is incorrect`, keeps his username, clears and focuses the password field, and he retries.

- **UJ-2. Maria can't remember her password.** `[ASSUMPTION — persona drafted from Jira SCRUM-29]`
  - **Persona + context:** Maria manages a small operation (one bin and one dryer) and signs in only a few times a season.
  - **Entry state:** signed out, on the Login page.
  - **Path:**
    1. She clicks `Forgot Password or Username?` and the **Forgot Password modal** opens over the page.
    2. She types her email. `Submit` enables once the address is valid, and she clicks it.
    3. The modal shows the same confirmation it would show for any address, so it doesn't reveal whether an account exists.
  - **Climax:** she knows a reset link is on its way and where to look (inbox and spam).
  - **Resolution:** she closes the modal and focus returns to the link. Resetting from the email is outside this release (SCRUM-30).
  - **Edge case:** she presses Esc halfway through. The modal closes, discards what she typed, and focus returns to the link.

- **UJ-3. Priya confirms all is well.** `[ASSUMPTION — persona drafted from Figma frame 6879:15603]`
  - **Persona + context:** Priya has a single monitored bin.
  - **Path:** after signing in, the Dashboard (All-good state) shows `0` `Need attention · all good` with a green tick, `No Alerts Right Now`, and `No Tanks Monitored Yet`.
  - **Climax:** she sees nothing needs her and closes the tab.

## 3. Glossary

*Every later section uses these terms exactly. No synonyms.*

**Screens and overlays**
- **Login page:** the public sign-in screen, Figma frame `6026:60111` (1366×768).
- **Forgot Password modal:** the overlay opened from the Login page, Figma frame `6026:62907` (600×374).
- **Dashboard:** the signed-in home screen at `/dashboard`. It is drawn in three **Dashboard states**.
- **Dashboard state:** one of three data scenarios, each with its own Figma frame and JSON file:
  - **Full** (`6215:58878`, `dashboard.full.json`): 20 pieces of equipment, 4 alerts, grain and liquid.
  - **Small** (`6864:4514`, `dashboard.small.json`): 2 pieces of equipment, 1 critical alert, no tanks.
  - **All-good** (`6879:15603`, `dashboard.allgood.json`): 1 bin and no alerts.
- **Notifications panel:** the right-hand panel opened from the bell, Figma frame `8270:44312` (290×768).
- **Empty state:** the grey placeholder block a card shows when it has no data (`No Alerts Right Now`, `No Tanks Monitored Yet`).

**Page shell**
- **Header:** the 64 px top bar holding the logo, the **Nav tabs**, the bell and the avatar.
- **Nav tab:** a top navigation item (Dashboard, Equipment, Alerts); exactly one is active.

**Dashboard cards and their parts**
- **KPI strip:** the summary bar under the page title, made of **KPI tiles**.
- **KPI tile:** one cell of the KPI strip: Need attention, Equipment (with its per-type counts), Online, Offline, Fans running now.
- **Equipment card:** "Equipment (N) · Health by type", one row per equipment type, each with a **Health bar**.
- **Health bar:** an 8 px horizontal bar split into **Health segments**.
- **Health segment:** one part of a Health bar: *alert* (red), *offline* (grey hatched) or *healthy* (green).
- **Recent Alerts card:** the card listing **Alert rows**, most urgent first.
- **Alert row:** one alert: severity icon, title, device ID and location, severity label, relative time and **Action link**.
- **Action link:** the green link on an Alert row that opens the next step (e.g. `View Hotspot`).
- **Fan activity card:** the card with three **Stat tiles** and the **Runtime chart**.
- **Stat tile:** a small grey tile showing one fan figure (Running Now, Runtime Today, Energy Today).
- **Runtime chart:** the 7-bar chart of daily fan runtime hours, Wed to Today.
- **Grain On Hand card / Liquid On Hand card:** the inventory cards, each with a summary line, a **Fill bar** and **Legend items**.
- **Fill bar:** a segmented horizontal bar showing inventory per **Commodity** or **Liquid product** against capacity.
- **Legend item:** a colour swatch with a name and an amount line under a Fill bar.
- **Commodity:** a grain type (Canola, Corn, Soybeans, Wheat, Barley, Oats).
- **Liquid product:** a tank liquid (Propane, Fuel Oil, Water, Kerosene, Gasoline, Diesel).

**Notifications**
- **Notification item:** one message in the Notifications panel, with a tag (`App` / `Promotion`) and a timestamp.
- **Filter chip:** a pill in the Notifications panel that filters Notification items by category.

**Sessions and data**
- **Dummy account:** an entry in `users.json` used to sign in. It decides login outcomes and the default Dashboard state.
- **Session:** the signed-in state, held in the browser, that protects the Dashboard and ends on Logout.

**Design and verification**
- **Design token:** a named design value (colour, size, radius, font, shadow) taken from Figma and used consistently in code.
- **Figma frame:** a top-level design frame in Figma file `js9ue0LTQDFIxAsxEuM8Wx`, identified by its node ID.
- **Reference render:** the 1× PNG export of a Figma frame, used as the comparison baseline.
- **Fidelity check:** the automated and manual comparison of a built screen against its Reference render and the addendum values (§8).

## 4. Features

> **Conventions used in this section.**
> - All coordinates are CSS px at a 1366 px wide viewport, relative to the top-left of the Figma frame named in the FR (Login frame `6026:60111`, 1366×768; Forgot Password modal `6026:62907`, 600×374), unless stated otherwise. Fractional Figma values are kept as written.
> - "Addendum" means `addendum.md` of the approved brief (`brief-agi-cursor2-2026-11-05`). "Brief rule n" means brief §Fidelity rules, rule n.
> - Jira acceptance criteria are numbered in the order they appear in the approved story spec (e.g. SCRUM-28 AC3 = the third AC of `spec-1-28-…`).
> - User journeys (UJ-1 Dale, UJ-2 Maria, UJ-3 Priya) are defined in §2.3.
> - Any styling for a state Figma does not draw (focus, hover, error, loading, disabled, open-modal backdrop) is tagged **[ASSUMPTION]** and, per brief rule 5, uses existing Design tokens and never changes how the screen looks at rest.

---

### 4.1 Design Foundation

**Description:** The Design Foundation is the shared visual contract for every screen in this build (Login page, Forgot Password modal, Dashboard, Notifications panel). It turns the values extracted from the Figma file `js9ue0LTQDFIxAsxEuM8Wx` (page "🎨 Demo") into named Design tokens, fixes the font set, governs how icons, the logo and photographs are shipped, and sets the global rendering rules that make "100% accurate" testable through a Fidelity check against each Reference render. It underpins UJ-1 and UJ-2 and every Dashboard journey. Nothing in the Design Foundation may be "rounded", "normalised" or "harmonised": where Figma contradicts itself (three reds, two page greys, 4 px vs 8 px input radius), each value is kept where Figma uses it (brief rule 1).

**Functional Requirements:**

#### FR-1: Colour Design tokens
The build exposes every colour used by the Figma frames as a named Design token whose value is the exact hex from the addendum, and every coloured element on every screen takes its colour from one of these tokens. Supports UJ-1, UJ-2.
**Source:** Figma variables on `6026:60111`, `6026:62907`, `6215:58878` · addendum Part A §1, Part B §1.1, §1.4 · brief rule 1
**Consequences (testable):**
- Login frame tokens exist with these exact values: `primitives/color/base/white` `#ffffff`; `brand/primary/200` `#a4dfbb`; `brand/primary/700` `#004b27`; `primitives/color/alpha-white/50` `#ffffff80` (rgba(255,255,255,0.5)).
- Forgot Password modal tokens exist with these exact values: `semantic/color/bg/white` `#ffffff`; `semantic/color/bg/primary` `#ffffff`; `semantic/color/text/primary` `#111827`; `semantic/color/text/secondary` `#374151`; `semantic/color/text/placeholder` `#6b7280`; `semantic/color/fg/quaternary` `#6b7280`; `semantic/color/text/white` `#ffffff`; `semantic/color/border/primary` `#d1d5db`; `table/row/border` `#d1d5db`; `component/input/text/default` `#111827`; `component/badge/text/error` `#dc2626`; `brand/primary/500` `#006a36`; `brand/gray/50` `#fbfbfb`.
- Hard-coded Login/modal colours are captured as tokens with these exact values: green-panel gradient stops `#009926` and `#006633`; right overlay `#02A45B` (used at opacity 0.4); close "X" stroke `#6B7280`; help "?" stroke `#9CA3AF`; Login-page white text `#ffffff`.
- Dashboard-file variables exist with these exact values: `semantic/color/fg/brand-primary` `#005c2f`; `brand/primary/50` `#eaf8ef`; `brand/primary/500` `#006a36`; `brand/primary/600` `#005c2f`; `brand/primary/700` `#004b27`; `brand/secondary/500` `#00b156`; `brand/gray/200` `#e4e5e4`; `brand/gray/300` `#cfd0d0`; `semantic/color/text/primary` `#111827`; `semantic/color/text/secondary` `#374151`; `semantic/color/fg/primary` `#111827`; `semantic/color/border/secondary` `#9ca3af`; `component/input/text/default` `#111827`; `component/input/border/error` `#dc2626`; `component/nav/text/default` `#374151`; `component/button/secondary/icon` `#111827`; `content/content-primary` `#09090b`; `table/row/bg-selected` `#f0fff8`; `primitives/color/alpha-black/80` `#000000cc`; `primitives/color/alpha-black/70` `#000000b2`; `primitives/color/amber/600` `#d97706`; `primitives/color/sky/500` `#0ea5e9`; `primitives/color/lime/500` `#84cc16`; `primitives/color/indigo/500` `#6366f1`; `primitives/color/violet/100` `#ede9fe`; `primitives/color/blue/50` `#eff6ff`; `primitives/color/base/white` `#ffffff`; `primitives/color/base/black` `#000000`; empty-state library `color/grey/96` `#f4f5f6`, `color/azure/11` `#111827`, `color/azure/34` `#4b5563`.
- The hard-coded Dashboard palette in addendum Part B §1.4 (surfaces, text, brand/links, semantic colours, fan chart, grain commodities, liquid products, Notifications panel, profile menu) is captured as tokens with the hex/rgba values exactly as listed there, including both page greys `#F3F4F6` (page) and `#F3F4F4` (title strip) and all three reds `#C62828`, `#DC2626`, `#FF0000`, each used only where Figma uses it.
- A colour-audit test finds no colour value in the rendered styles of any screen that is not one of the tokens above (anti-aliasing and the silo photo excluded).

#### FR-2: Spacing, radius and border Design tokens
The build exposes the Figma spacing, radius and border-width variables as Design tokens and uses them for the elements that Figma binds them to. Supports UJ-1, UJ-2.
**Source:** Figma variables on `6026:62907`, `6215:58878` · addendum Part A §1, Part B §1.1
**Consequences (testable):**
- Spacing tokens: `space/0` 0, `space/2` 4, `space/4` 8, `space/5` 12, `space/6` 16, `space/7` 20, `space/8` 24, `input/spacing/padding-x` 16; button tokens `sm` 8 (gap), `md` 10 (padding-y), `xl` 16 (padding-x), `lg` 8 (radius); Dashboard `xs` 6 and `md` 6; empty-state `item-spacing/10` 10.
- Radius tokens: `radius/none` 0, `radius/md` 8, `brand/radius/md` 8, `radius/xl` 16, empty-state `corner-radius/12` 12.
- Border-width tokens: `border-width/hairline` 1, `border-width/sm` 1.5, `border-width/md` 2; icon stroke `icons/16px` 1.33.
- The Login-page input radius stays **4px** and the modal input radius stays **8px** (both as drawn; brief Open Questions 2).

#### FR-3: Typography Design tokens (named text styles)
The build exposes every Figma named text style as a typography Design token (family, weight, size, line-height, letter-spacing) and applies it to the text nodes that use it. Supports UJ-1, UJ-2.
**Source:** Figma text styles · addendum Part A §1 (Text styles), §4; Part B §1.2
**Consequences (testable):**
- Login/modal styles: `Heading/md/Semibold` = Roboto 600, 20px, line-height 24px, letter-spacing −0.2px (−1%); `Label/md/Semibold` = Roboto 600, 12px / 16px, letter-spacing 0; `Body/md/Regular` = Roboto 400, 16px / 24px, letter-spacing 0; modal size/line-height tokens `body/sm` 14, `label/md` 12, `line-height/body-sm/content` 22, `line-height/label/md` 16, `line-height/body/md` 24, `line-height/heading/md` 24, `Size/Text - sm` 14, `Line Height/Text - sm` 20, `weight/regular` 400.
- NativeBase (SF Pro) styles: `Heading/Semibold/md` 590/20/1.25; `Heading/Medium/xs` 510/14/1.25; `Heading/Regular/xs` 400/14/1.25; `Text/Semibold/md` 590/16/1.5; `Text/Semibold/xs` 590/12/1.5; `Text/Regular/xs` 400/12/1.5; size tokens `heading/font-size/md` 20, `heading/font-size/xs` 14, `text/font-size/md` 16, `text/font-size/xs` 12, `type-heading/24/size` 24.
- Roboto styles: `Body/lg/Semibold` 600/18/26; `Body/md/Semibold` 600/16/24; `Body/md/Medium` 500/16/24; `Body/sm/Regular` 400/14/20; `Body/sm/Medium` 500/14/20; `Body/xs/Regular` 400/12/18; `Display/xs/Semibold` 600/24/26, letter-spacing −0.48px (−2%); `Heading/md/Medium` 500/20/24, letter-spacing −1%; `Roboto/Bold` 700/16/normal; `Roboto/Regular` 400/14/20.3; empty-state `font-size/16` 16, `line-height/20_3` 20.3, `item-spacing/14` 14 (used as a font size).
- No text on any screen uses `text-transform`.

#### FR-4: Font families and loading
The build renders every text node in the font family and weight Figma specifies, using the brief's resolved font strategy. Supports UJ-1, UJ-2.
**Source:** addendum Part A §4, Part B §1.3 · brief rule 4
**Consequences (testable):**
- Roboto at weights 400, 500 and 600 is self-hosted (no request to a third-party font CDN at runtime) and covers the Login page, Forgot Password modal, Header, page title, KPI strip, chart labels, Empty states and panels.
- Every Login page and Forgot Password modal text node renders in Roboto; Inter is **not** rendered anywhere on the Login page (the legal-text root's `Inter Regular` at 0px is overridden by its Roboto spans).
- SF Pro text (card text) uses the family stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"` followed by Inter as fallback; SF Pro is never self-hosted.
- Inter is used as a primary family only for "83% Fill" (Inter Medium 500). [ASSUMPTION: Inter is self-hosted at the weights needed for that string and for the SF Pro fallback (400, 500, 600, 700).]
- `font-variation-settings: "wdth" 100` is the default width and is not required; static Roboto files are acceptable.
- Text is not shown in a fallback font while web fonts load in a way that is captured by a Fidelity check (the check waits for fonts to finish loading).

#### FR-5: Elevation Design tokens
The build exposes each Figma shadow as a Design token with the exact CSS listed in the addendum. Supports UJ-1, UJ-2.
**Source:** Figma effect styles · addendum Part A §1 (Effect style), Part B §1.1, §1.5
**Consequences (testable):**
- `Shadow/Lg` = `box-shadow: 0 12px 20px -2px rgba(39,39,39,0.15)` (not the filter version `drop-shadow(0 12px 10px …)` emitted by generated code).
- `Shadow/2` = drop shadow `#2727271A`, offset (0, 2), radius 4, spread 0.
- Card elevation = `filter: drop-shadow(0px 2px 2px rgba(39,39,39,0.1))`; KPI strip = `box-shadow: 0px 2px 4px 0px rgba(39,39,39,0.15)`; Notifications "All" chip = `drop-shadow(0 3px 4px rgba(0,0,0,0.12)), drop-shadow(0 3px 0.5px rgba(0,0,0,0.04))`; Header shadow per addendum Part B §1.5.

#### FR-6: Icons and logo as unmodified Figma SVGs
Every icon and logo on every screen is the SVG exported from Figma, used unmodified, inline or imported; no icon is a raster image. Supports UJ-1, UJ-2.
**Source:** addendum Part A §5 (Vectors), Part B §13 · brief rule 3 · brief Success Criteria (Assets)
**Consequences (testable):**
- Login/modal vectors used are exactly `e34ba.svg` (logo, 392.429×24, all `#ffffff`), `f4626.svg` (green angled panel, 692×768), `321e0.svg` (right overlay, 1824.1×823), `0d4fd.svg` (close X, 32×32 viewBox, stroke `#6B7280` 1.5, round caps, group opacity 0), `16936.svg` (help "?", 35.001×35.001, stroke `#9CA3AF` 1.5, round caps), from `figma-assets/login/`.
- Path data, viewBox, stroke widths and colours of each shipped SVG are byte-for-byte equivalent to the exported file (formatting/whitespace and id attributes excepted).
- The only icon not exported, the right chevron (SF Symbol glyph), is redrawn as an SVG measuring 12×16 px in `#006A36`.
- No icon or logo on any screen is delivered as PNG, JPEG, WebP or icon font.
- The logo has the accessible name `AGI SureTrack Farm`.

#### FR-7: Photographs and raster assets
Raster images ship only where they are visible, in optimised form, and placed exactly as in Figma. Supports UJ-1.
**Source:** addendum Part A §2.1, §5 (Raster images), Part B §13 · brief rule 3
**Consequences (testable):**
- The silo photo (`981df.png`, source JPEG 4096×2732, 17.6 MB) is served as an optimised copy about 2,700 px wide in WebP or JPEG; the 17.6 MB source is never shipped.
- The occluded Login photo layers `fdfae.png`, `aa532.png`, `951ae.png`, `f4d3a.png` and the hidden layer `6026:60118` are not shipped in the build output.
- The avatar is one 32 px circular image.

#### FR-8: Global rendering and copy rules
Every screen is built to the 1366 px Figma frame with exact values and verbatim copy. Supports UJ-1, UJ-2.
**Source:** brief rules 1–2, Success Criteria, Scope · addendum Part A intro, Part B intro
**Consequences (testable):**
- At a 1366 px wide viewport every measured element is within ±1 px of the addendum value; fractional values (e.g. 392.4285, 519.958, 14.551) are implemented as written, not rounded.
- Every visible string matches the addendum copy deck character for character, including `·` (U+00B7), typographic apostrophes `’` where the copy deck uses them, and the design's typo `Missing Fan Switched`.
- Figma layers marked hidden or covered are not rendered (e.g. "Remember Me", the register link, "capella icon 1", "Farm Test" switcher, the modal's hidden Select field).
- No console errors or warnings appear while any screen loads or is used; `npm run build` succeeds.
- Tablet and phone layouts are not built (only 1366 px is designed).

#### FR-9: Minimal styling for undesigned states
Any interactive state Figma does not draw (focus, hover, error, loading, disabled, modal backdrop) uses the smallest styling built from existing Design tokens and leaves the at-rest appearance identical to the Figma frame. Supports UJ-1, UJ-2.
**Source:** brief rule 5 · addendum Part A §6, §8 Q5 · SCRUM-31 AC4
**Consequences (testable):**
- A Fidelity check of each screen at rest (no focus, no hover, no errors) passes with the state styles present in the build.
- Keyboard focus is shown only for keyboard-initiated focus (`:focus-visible` semantics) on buttons and links, so mouse clicks do not leave rings that change the look; text inputs show focus whenever focused. [ASSUMPTION]
- Focus indicator: a 2px (`border-width/md`) solid outline offset 2px; colour `#ffffff` on the green Login panel and `#006a36` (`brand/primary/500`) inside the Forgot Password modal. [ASSUMPTION]
- Hover on links and buttons changes only the cursor to `pointer`; no colour, underline or background change. [ASSUMPTION]
- Each undesigned state introduced is listed in the PRD's open-questions list for the design team to supply.

#### FR-10: Fidelity check
Each screen can be verified automatically against its Reference render. Supports UJ-1, UJ-2.
**Source:** brief Success Criteria · addendum `figma-reference/`
**Consequences (testable):**
- An automated screenshot comparison (Playwright, Chrome on macOS, viewport 1366 px wide, device scale 1) compares each view with its Reference render: Login page ↔ `login-6026-60111.png`; Forgot Password modal ↔ `forgot-password-6026-62907.png` (modal surface only); Dashboard ↔ `dashboard-full-6215-58878.png`, `dashboard-small-6864-4514.png`, `dashboard-allgood-6879-15603.png`; Notifications panel ↔ `notifications-8270-44312.png`.
- Pass threshold: no more than 0.5% of pixels differ, excluding anti-aliasing tolerance and the silo photo region. [ASSUMPTION — threshold to be agreed with QA, carried from the brief]
- Every hex colour sampled at an element's solid fill matches the addendum exactly.

**Feature-specific NFRs:**
- NFR-1: Fonts are self-hosted; the app makes no runtime request to third-party font or icon CDNs.
- NFR-2: The silo photo asset is ≤ 600 KB. [ASSUMPTION]

**Notes:**
- Brief rule 4 self-hosts Roboto 400/500/600 only, but addendum Part B §1.3 shows Roboto 700 (`Roboto/Bold`, fan "Today" label) and 800 (bell badge) on the Dashboard. Confirm whether 700/800 are also self-hosted or synthesised (affects the Dashboard Fidelity check, not Login).
- SF Pro renders only on macOS/iOS; on other OSes the Inter fallback will differ from Figma. The Fidelity check therefore runs on macOS only (brief rule 4).

---

### 4.2 Login Page

**Description:** The Login page (`/login`, Figma frame `6026:60111`, 1366×768) is the entry point to SureTrack for every signed-out customer and realizes UJ-1. It is a pixel-exact copy of the Figma frame: a mirrored steel-silo photograph across the page, a 90%-opaque green angled panel on the left carrying the white AGI SureTrack Farm logo, the "Login" title, Username and Password fields, a white Login button, the "Forgot Password or Username?" link (entry to UJ-2) and the Privacy Policy / Terms of Service legal line, plus a 9×13 px green leftover triangle at the bottom-right that is kept as drawn.

Behaviour comes from SCRUM-27, SCRUM-28 and SCRUM-31. Credentials are checked client-side against the Dummy accounts in `users.json` (addendum A); a successful check creates a client-side Session and sends the user to the Dashboard, or to the page they originally tried to open. Failures show the exact SCRUM-28 messages in an alert banner. Because Figma draws only the empty at-rest state, every error, focus and loading visual is a minimal token-based default [ASSUMPTION] that leaves the at-rest look unchanged. Tablet and phone layouts (SCRUM-27 AC2) are out of scope.

**Functional Requirements:**

#### FR-11: Signed-out access lands on the Login page
A signed-out user who opens any SureTrack route is shown the Login page, and the route they asked for is remembered. Realizes UJ-1.
**Source:** Figma `6026:60111` · brief Workflow 1, 4 · SCRUM-27 AC1, AC7
**Consequences (testable):**
- With no Session, opening `/login` renders the Login page.
- With no Session, opening `/dashboard` (with or without `?state=`) or any other protected route redirects to `/login`, and the originally requested path including its query string is remembered for FR-25.
- With no Session, opening `/` redirects to `/login`. [ASSUMPTION]
- Only same-origin, in-app paths are remembered; any other value is discarded and FR-25 falls back to `/dashboard`. [ASSUMPTION]

#### FR-12: Frame and background photo composition
The Login page reproduces the Figma frame's background: a white frame clipping two mirrored layers of the silo photo. Realizes UJ-1.
**Source:** Figma `6026:60111`, `6026:60116`, `6026:60117` · addendum Part A §2, §2.1, §5 · brief rule 3
**Consequences (testable):**
- The frame is 1366×768, background `#ffffff`, and clips its content (nothing renders outside 0…1366 × 0…768; no scrollbars at a 1366×768 viewport).
- Both visible photo layers use the same silo photo, mirrored horizontally (`scaleX(-1)` equivalent), at 100% opacity, without distortion (placed aspect 1.4988 vs image 1.4993).
- Layer `6026:60116` ("…0b 1") image rect in frame coords: x **386.34**, y **−249.42**, w **1571.09**, h **1048.26** (right edge 1957.44, bottom 798.85); it covers frame x > 513.
- Layer `6026:60117` ("…0b 3") image rect: x **−634.24**, y **−283.10**, w **1627.24**, h **1085.39**, clipped at frame x = **513** (visible x 0…513, entirely under the green panel); it sits above `6026:60116`.
- Equivalent alternative: a single composited 1366×768 background exported at @2x (about 2732×1536, WebP or JPEG) whose pixels match the two-layer composition.
- Covered/hidden photo layers (`6026:60112/60113`, `6026:60114`, `6026:60115`, `6026:60118`) are not rendered or shipped.
- The photo region is excluded from the pixel-diff threshold (FR-10) but its placement is verified within ±1 px.

#### FR-13: Green angled panel
The Login page shows the semi-transparent green angled panel over the photo exactly as drawn. Realizes UJ-1.
**Source:** Figma `6026:60122` (boolean of `6026:60123`) · addendum Part A §1 (Hard-coded colors), §2.2 · `f4626.svg`
**Consequences (testable):**
- Bounds x 0, y 0, 692×768; shape is the polygon `(0,0) → (692,0) → (519.958,768) → (0,768)` (SVG path `M519.958 768H0V0H692L519.958 768Z`); the angled edge is 12.6265° from vertical, leaning left toward the bottom.
- Fill is a linear gradient from `#009926` at (636.115, 768) to `#006633` at (305.824, 260.485) in user space (CSS equivalent `linear-gradient(326.94deg, #009926 2.99%, #006633 62.28%)` on the 692×768 box), at fill-opacity **0.9**; everything past 62.28% is solid `#006633`.
- The panel sits above both photo layers and below the form column; the photo shows through at 10%.

#### FR-14: Bottom-right leftover triangle kept as drawn
The Login page keeps the visible corner of the right overlay. Realizes UJ-1.
**Source:** Figma `6026:60119` · addendum Part A §2.3, §8 Q6 · brief Open Questions 5 · `321e0.svg`
**Consequences (testable):**
- A triangle with vertices (1356.83, 768) → (1366, 768) → (1366, 755.32) (9.17 × 12.68 px) renders in `#02A45B` at opacity **0.4**.
- It is produced by the overlay shape at bounds x 1356.833, y −55, 1824.10×823 (path `M1824.1 823H0L595.167 0H1824.1V823Z`) clipped by the frame, or by an equivalent shape yielding identical pixels.

#### FR-15: Form column layout and logo
The form column sits on the green panel with the exact vertical rhythm of the Figma auto-layout. Realizes UJ-1.
**Source:** Figma `6026:60124`, `6026:60125`, `6026:60126`, `6026:60127`, `6026:60133`, `6026:60134` · addendum Part A §2.4, §5, §7
**Consequences (testable):**
- Column: x **90**, y **127.039** (vertically centred: (768 − 513.922)/2), w **392.4285**, h **513.922**; vertical, items centred, gap 32 between the inner stack and the legal text; inner stacks: `6026:60125` gap 24, `6026:60126` gap 40 (items start).
- Logo (`e34ba.svg`, `#ffffff`): x 90, y 127.04, w **392.4305**, h **24**; accessible name `AGI SureTrack Farm`.
- Vertical rhythm, top to bottom: logo 24 → gap 40 → title 30 → 32 → Username label 20 → 6 → input 40 → 24 → Password label 20 → 6 → input 40 → 41 → Login button 40 → 34.92 → Forgot link 20 → 32 → legal text 64.
- Hidden layers are not rendered: "capella icon 1" (`6026:60135`), "Remember Me" + tick-square (`6026:60148`), `Don’t have an account yet?  Click here to register.` (`6026:60154`).

#### FR-16: Title and field labels
The Login page shows the title and both field labels in the Figma typography. Realizes UJ-1.
**Source:** Figma `6026:60138`, `6026:60141`, `6026:60144` · addendum Part A §2.4, §4, §7
**Consequences (testable):**
- Title `Login`: x 90, y 191.04, w 67.32, h 30; Roboto SemiBold 600, 20px / 30px, letter-spacing 0, `#ffffff`.
- Label `Username`: x 90, y 253.04, w 64, h 20; label `Password`: x 90, y 343.04, w 62, h 20; both Roboto Regular 400, 14px / 20px, letter-spacing 0, `#ffffff`, no wrap.
- Each label is programmatically associated with its input (clicking a label focuses its input).

#### FR-17: Username and Password inputs
The user can type a username and password into two inputs that look exactly like the Figma rectangles at rest. Realizes UJ-1.
**Source:** Figma `6026:60140`, `6026:60142`, `6026:60143`, `6026:60145` · addendum Part A §2.4, §4, §6, §8 Q4 · SCRUM-27 AC5
**Consequences (testable):**
- Username input: x 90, y **279.04**, w 392.43, h 40. Password input: x 90, y **369.04**, w 392.43, h 40. Field groups: Username x 90 y 253.04 h 66, Password x 90 y 343.04 h 66, each vertical gap 6.
- Both inputs: no fill (transparent), border **1.5px solid `#a4dfbb`** (`brand/primary/200`), radius **4px**, no placeholder text.
- Typed-text style is UNKNOWN in Figma. [ASSUMPTION: Roboto Regular 400, 16px / 24px (`Body/md/Regular`), colour `#ffffff`, caret `#ffffff`, horizontal padding 16px (`input/spacing/padding-x`).]
- The Password input masks characters; no show/hide toggle is rendered (none is designed).
- The Username input carries the `username` autocomplete hint and the Password input the `current-password` hint, so password managers can fill them.
- Focus: the border colour and width stay as drawn; a 2px `#ffffff` outline offset 2px appears around the focused input. [ASSUMPTION]
- Browser autofill does not change the input background or text colour (no yellow/blue autofill fill). [ASSUMPTION]

#### FR-18: Login button
The user can submit the form with a white Login button drawn exactly as in Figma. Realizes UJ-1.
**Source:** Figma `6026:60153`, `I6026:60153;23:2941` · addendum Part A §2.4, §4, §6
**Consequences (testable):**
- Button: x 90, y **450.04**, w **392** (99.89% of the column), h 40; background `#ffffff`; radius **8px**; padding-x 16; gap 8; content centred; no border.
- Label `Login`: Roboto SemiBold 600, 16px / 24px, letter-spacing 0, `#004b27` (`brand/primary/700`), centred.
- It is a real submit control reachable by keyboard and activated by Enter/Space.
- Hover changes only the cursor to `pointer` (FR-9). [ASSUMPTION]

#### FR-19: "Forgot Password or Username?" link
The user can open the Forgot Password modal from a link drawn exactly as in Figma. Realizes UJ-2.
**Source:** Figma `6026:60146`, `6026:60147` · addendum Part A §2.4, §4, §7, §8 Q3 · brief Workflow 2 · SCRUM-29 AC1
**Consequences (testable):**
- Text `Forgot Password or Username?` in a box at x **199** (left offset 109 within the column = 27.78%), y **524.96**, w **197** (50.2%), h 20, **left-aligned** inside the box (the 11.3 px right-of-centre offset is kept as drawn).
- Roboto Medium 500, 14px / 20px, letter-spacing 0, `#ffffff`, underline solid with from-font thickness and offset, `text-decoration-skip-ink: none`.
- Activating it (click, Enter or Space) opens the Forgot Password modal (FR-36) without navigating away or clearing typed Username/Password values.

#### FR-20: Legal text and Privacy Policy / Terms of Service links
The user can read the legal sentence and open each legal document in a new browser tab. Realizes UJ-1.
**Source:** Figma `6026:60155` · addendum Part A §1, §2.4, §4, §7, §8 Q8, Q13 · brief Workflow 3 · SCRUM-31 AC1–AC4
**Consequences (testable):**
- Box: x **126.21** (offset 36.214 in the column), y **576.96**, w **320**, h **64**; text centre-aligned, top-aligned (2 lines × 24 px = 48 px; 16 px slack at the bottom).
- Line 1: `By clicking login, you hereby agree to our ` (Roboto Regular 400, 14px / 24px, `#ffffff`) followed by a hard line break.
- Line 2: `Privacy Policy` · ` | ` · `Terms of Service`: both link names Roboto Medium 500, 14px / 24px, `#ffffff`, underlined (solid, from-font thickness and offset, skip-ink none); the `|` is Roboto Regular 400 in `rgba(255,255,255,0.5)` (`primitives/color/alpha-white/50`), not underlined; the space before `|` is Regular 400 and the space after it is Medium 500.
- Each link opens its document in a new browser tab without an opener reference; the Login page stays on screen with typed values intact.
- Link URLs are read at runtime from a configuration file so they can change without a code release. [ASSUMPTION: placeholder URLs until the client supplies the real ones; see addendum A.]
- When offline, clicking a link still opens the new tab (which shows the browser's offline page) and the Login page is unaffected.
- Each link is keyboard reachable and shows the FR-9 focus ring (2px `#ffffff`, offset 2px) on keyboard focus. [ASSUMPTION]

#### FR-21: Keyboard order and Enter-to-submit
The user can complete the Login page entirely by keyboard. Realizes UJ-1.
**Source:** SCRUM-27 AC4 · brief Success Criteria (Workflow)
**Consequences (testable):**
- Tab order is exactly: Username → Password → Login → Forgot Password or Username? → Privacy Policy → Terms of Service.
- Pressing Enter in the Username or Password input submits the form.
- On page load, focus is placed in the Username input. [ASSUMPTION — the at-rest Fidelity check is taken with focus removed]

#### FR-22: Required-field validation
The user is told which required field is empty, and nothing is checked against `users.json` until both are filled. Realizes UJ-1.
**Source:** SCRUM-27 AC3, AC5 · brief Workflow 1
**Consequences (testable):**
- The username is trimmed of leading/trailing spaces before validation and checking; the password is used exactly as typed (no trimming).
- Submitting with an empty (or all-spaces) Username shows `Username is required` under the Username input; submitting with an empty Password shows `Password is required` under the Password input; both appear if both are empty.
- When validation fails, no credential check runs, no loading state appears, the failed-attempts counter (FR-30) is not incremented, and focus moves to the first empty field.
- An inline message clears as soon as the user types into its field. [ASSUMPTION]
- Inline message style: Roboto Regular 400, 12px / 16px, `#ffffff`, 4px (`space/2`) below the input; the input border changes to `#dc2626` (`component/input/border/error`) at the same 1.5px width; the message is announced to screen readers and linked to its input as its description. [ASSUMPTION]
- While an inline message shows, the elements below it move down by the message height; the column's top stays at y 127.039. [ASSUMPTION]

#### FR-23: Submit loading state and double-submit guard
After a valid submit the Login button shows a loading state and ignores further clicks until the result arrives. Realizes UJ-1.
**Source:** SCRUM-27 AC6 · SCRUM-28 AC8
**Consequences (testable):**
- After a valid submit, the Login button keeps its size, background `#ffffff` and label `Login`, and shows a 16×16 spinner (stroke 2px `#004b27`) left of the label with an 8px gap; the button exposes a busy state to assistive technology. [ASSUMPTION]
- While loading, further clicks and Enter presses do not start a second check.
- The dummy check resolves after the simulated latency defined in `users.json` (`policy.simulatedLatencyMs`) so the loading state is observable. [ASSUMPTION]
- When any error is shown (FR-26–FR-32), the Login button is enabled again (unless FR-30's lockout is active).

#### FR-24: Dummy authentication against users.json
The user signs in with a Dummy account from `users.json`; the result follows a fixed order of checks. Realizes UJ-1.
**Source:** brief Workflow 1, Scope · SCRUM-27 AC7 · SCRUM-28 AC1–AC6 · addendum A
**Consequences (testable):**
- Credentials are checked client-side against `users.json` only; no real authentication service is called.
- Username matching is case-insensitive after trimming; password matching is exact and case-sensitive. [ASSUMPTION]
- Checks run in this order and stop at the first that applies: (1) required fields (FR-22); (2) active too-many-attempts lockout (FR-30); (3) offline (FR-31); (4) timeout (FR-31); (5) unknown username or wrong password (FR-26); (6) `status: "locked"` (FR-27); (7) `status: "inactive"` or `subscriptionActive: false` (FR-28); (8) `passwordExpired: true` (FR-29); (9) success (FR-25). [ASSUMPTION — account-status messages are revealed only after a correct password, so the page never discloses whether a username exists]
- The password is never written to browser storage, the URL or the console.

#### FR-25: Successful sign-in and redirect
A user whose Dummy account is valid gets a Session and lands on the Dashboard or on the page they originally requested. Realizes UJ-1.
**Source:** brief Workflow 1, Solution · SCRUM-27 AC7 · SCRUM-28 AC7
**Consequences (testable):**
- On success a Session is created containing the account's username, display name, Dashboard state and an expiry time; the failed-attempts counter is reset.
- If FR-11 remembered a requested page, the user is sent there (path and query preserved); otherwise to `/dashboard`.
- On `/dashboard` without a `?state=` query, the Dashboard shows the state set by the Dummy account's `dashboardState` (`full`, `small` or `allgood`); an explicit `?state=full|small|allgood` overrides it. Signing in as `demo` shows the `full` state. [ASSUMPTION per brief Solution]
- The Login page is replaced in history, so pressing Back after sign-in does not return to the filled Login form.

#### FR-26: Wrong credentials
A user who enters an unknown username or wrong password sees a generic message and can retry immediately. Realizes UJ-1.
**Source:** SCRUM-28 AC1, AC8 · brief Workflow 1
**Consequences (testable):**
- The alert banner (FR-32) shows exactly `Username or password is incorrect`, without indicating which field is wrong.
- The Username value stays; the Password input is cleared and receives focus.
- The failed-attempts counter (FR-30) is incremented by 1.
- The same message and behaviour apply whether the username is unknown or the password is wrong.

#### FR-27: Locked account
A user whose Dummy account is locked is told so, when they can try again (if known), and how to reach SureTrack Coach. Realizes UJ-1.
**Source:** SCRUM-28 AC2, AC8 · brief Workflow 1
**Consequences (testable):**
- Signing in with correct credentials of a Dummy account with `status: "locked"` does not create a Session.
- The alert banner shows `Your account is locked. Try again after {time}. Contact SureTrack Coach (855) 293-5607.` when `lockedUntil` is set, and `Your account is locked. Contact SureTrack Coach (855) 293-5607.` when it is null. [ASSUMPTION — exact wording; SCRUM-28 gives only the content]
- `{time}` is `lockedUntil` in the browser's local time, formatted `h:mm A` if today and `MMM D, YYYY h:mm A` otherwise (e.g. `3:45 PM`, `Jan 1, 2027 9:00 AM`). [ASSUMPTION]
- Username stays; password stays as typed; the counter is not incremented. [ASSUMPTION]

#### FR-28: Inactive account or no active subscription
A user whose Dummy account is inactive or has no active subscription is not signed in and is told to contact SureTrack Coach. Realizes UJ-1.
**Source:** SCRUM-28 AC3, AC8 · brief Workflow 1
**Consequences (testable):**
- For a Dummy account with `status: "inactive"` or `subscriptionActive: false`, no Session is created.
- The alert banner shows exactly `Your account is inactive. Contact SureTrack Coach.`
- The counter is not incremented. [ASSUMPTION]

#### FR-29: Expired password
A user whose password has expired is told so and can open the Forgot Password modal from the message. Realizes UJ-1, UJ-2.
**Source:** SCRUM-28 AC4, AC8 · SCRUM-29 AC1
**Consequences (testable):**
- For a Dummy account with `passwordExpired: true`, no Session is created.
- The alert banner shows `Your password has expired` followed by a link `Reset your password` [ASSUMPTION — link wording]; activating the link opens the Forgot Password modal (FR-36), and closing the modal returns focus to that link.
- The link inside the banner is Roboto Medium 500, underlined, in the banner text colour. [ASSUMPTION]

#### FR-30: Too many attempts
After too many consecutive wrong-credential attempts the user is told when they can try again and the Login button is disabled until then. Realizes UJ-1.
**Source:** SCRUM-28 AC5, AC8 · addendum A (policy)
**Consequences (testable):**
- The browser keeps a count of consecutive wrong-credential failures (FR-26 only; validation, locked, inactive, expired, offline and timeout results do not count), surviving page reload. [ASSUMPTION — counted per browser, not per username]
- When the count reaches `policy.maxFailedAttempts` (5), a lockout starts for `policy.lockoutMinutes` (15) from that failure, and this fifth failure shows the too-many-attempts message instead of FR-26's. [ASSUMPTION]
- The alert banner shows `Too many sign-in attempts. You can try again at {time}.` with `{time}` formatted as in FR-27. [ASSUMPTION — wording]
- During the lockout the Login button is disabled (not focusable/activatable, exposed as disabled; visually opacity 0.5 and cursor `not-allowed` [ASSUMPTION]), Enter does not submit, and reloading the page keeps the button disabled and the banner shown.
- When the lockout ends, the Login button re-enables without a reload, the banner clears and the count resets to 0.
- A successful sign-in resets the count to 0.

#### FR-31: Offline and timeout
A user whose browser is offline, or whose check does not complete within the timeout, sees a connection or timeout message and can retry. Realizes UJ-1.
**Source:** SCRUM-28 AC6, AC8 · addendum A (policy)
**Consequences (testable):**
- If the browser reports it is offline at submit, no check runs and the alert banner shows `You appear to be offline. Check your connection and try again.` [ASSUMPTION — wording]
- If the check does not complete within `policy.requestTimeoutMs` (15000 ms, "15 s, TBC" in SCRUM-28), it is abandoned and the alert banner shows `The server did not respond in time. Please try again.` [ASSUMPTION — wording]
- The timeout path is testable with the Dummy account `slow`, whose `simulatedLatencyMs` exceeds the timeout. [ASSUMPTION]
- In both cases Username and Password values stay, the Login button is enabled again, and submitting again retries; the counter is not incremented.

#### FR-32: Alert banner presentation
All sign-in errors and the session-expired notice appear in one alert banner above the form that screen readers announce. Realizes UJ-1.
**Source:** SCRUM-28 AC8 · brief rule 5
**Consequences (testable):**
- No banner is rendered at rest (Fidelity check unaffected).
- When shown, the banner sits below the `Login` title and above the `Username` label, 16px (`space/6`) below the title and 24px above the label, full column width 392.43; the column top stays at y 127.039 and content below moves down. [ASSUMPTION]
- Banner style: background `#ffffff`, border 1px solid `#dc2626`, radius 8px, padding 8px 16px, text Roboto Regular 400, 14px / 20px, `#111827`. [ASSUMPTION]
- The banner is exposed as an alert, so its text is announced when it appears or changes.
- Only one banner shows at a time; a new submit clears it before the next result. [ASSUMPTION]
- With the banner and both inline messages shown, all elements remain within the 768 px frame height.

#### FR-33: Already signed in
A user with a valid Session who opens the Login page goes straight to the Dashboard. Realizes UJ-1.
**Source:** SCRUM-27 AC8
**Consequences (testable):**
- With a valid Session, opening `/login` redirects to `/dashboard` without rendering the Login form.

#### FR-34: Session expiry
A user whose Session expires is returned to the Login page on their next action and goes back to the same page after signing in. Realizes UJ-1.
**Source:** SCRUM-28 AC7
**Consequences (testable):**
- A Session expires `policy.sessionTtlMinutes` after sign-in. [ASSUMPTION: 480 minutes; see addendum A]
- When the Session has expired and the user navigates or performs an action that loads data, they are sent to `/login`, the current page is remembered (FR-11), and the alert banner shows exactly `Your session has expired. Please sign in again.`
- After signing in again they land on the remembered page.

#### FR-35: Logout returns to the Login page
A user who signs out is returned to the Login page in every open SureTrack tab and cannot see their data with Back. Realizes UJ-1.
**Source:** brief Workflow 6 · SCRUM-27 AC9
**Consequences (testable):**
- Choosing Logout (from the avatar profile menu on the Header) ends the Session and shows `/login` with empty fields and no banner.
- Every other open SureTrack tab of the same browser switches to `/login` without user action within 1 second. [ASSUMPTION — timing]
- Pressing the browser Back button after logout shows the Login page, not the Dashboard or any of its data (including pages restored from the browser's back-forward cache).

**Out of Scope:** tablet/phone layout (SCRUM-27 AC2 — not designed); real authentication, server-set sessions and profile/permission loading (SCRUM-27 AC7 is met by the client-side dummy Session); "Remember Me" and registration (hidden layers); password show/hide toggle (not designed); the Reset Password page (SCRUM-30).

**Feature-specific NFRs:**
- NFR-11: The Login page reaches a stable, fully rendered state (fonts and background loaded) within 2 s on a desktop broadband connection. [ASSUMPTION]
- NFR-12: Every message in FR-22 and FR-26–FR-34 is announced by screen readers (alert or live-region semantics).
- NFR-13: Text contrast of all at-rest copy is as drawn; no change is made to improve contrast (fidelity wins, brief rule 1).

**Notes:**
- Typed-text style, padding, caret colour and password visibility toggle for the Login inputs are UNKNOWN in Figma (addendum Part A §8 Q4); FR-17 uses an assumed style.
- No error, focus, disabled or loading visuals exist in Figma (addendum Part A §8 Q5); FR-22, FR-23, FR-30, FR-32 use assumed token-based styles. Design to supply.
- Exact wording for the locked, too-many-attempts, offline and timeout messages and for the expired-password link is not given in SCRUM-28; assumed copy is used (FR-27, FR-29, FR-30, FR-31).
- The 15 s timeout is "TBC" in SCRUM-28.
- Behaviour at viewports other than 1366×768 (panel scaling, photo crop, vertical centring) is UNKNOWN (addendum Part A §8 Q9).
- Privacy Policy / Terms of Service URLs are UNKNOWN (addendum Part A §8 Q13).
- The Forgot link is 11.3 px right of the column centre (addendum Part A §8 Q3); kept as drawn.
- The leftover 9×13 px triangle is kept as drawn pending design confirmation (addendum Part A §8 Q6).

---

### 4.3 Forgot Password Modal

**Description:** The Forgot Password modal (Figma frame `6026:62907`, 600×374) opens over the Login page when the user activates "Forgot Password or Username?" (or the expired-password link) and realizes UJ-2. Its surface is a pixel-exact copy of the Figma frame: a white 16 px-radius card with `Shadow/Lg`, a 72 px header with the title "Forgot Your Password or Username?" and an invisible close X kept as drawn, a `#fbfbfb` body with intro copy, a required Email field with a help "?" icon and the SureTrack Coach help text, and a 72 px footer with Cancel and Submit.

Behaviour comes from SCRUM-29. Submit stays disabled until the email is well formed; submitting shows a loading state and then the same confirmation for any email (no request leaves the browser in this build). The modal closes with Cancel, Esc, a click outside or the close X, and focus returns to the link that opened it; while open, focus is trapped inside. Figma defines no backdrop, position, animation, error, tooltip, disabled or loading visuals, so these are minimal token-based defaults tagged [ASSUMPTION].

**Functional Requirements:**

#### FR-36: Open the Forgot Password modal
The user can open the Forgot Password modal over the Login page. Realizes UJ-2.
**Source:** Figma `6026:62907`, `6026:60146` · addendum Part A §3, §6, §8 Q2 · brief Workflow 2 · SCRUM-29 AC1 · SCRUM-28 AC4
**Consequences (testable):**
- Activating `Forgot Password or Username?` (FR-19) or the expired-password link (FR-29) opens the modal; the URL does not change and the Login page stays rendered underneath with typed values intact.
- The modal (600×374) is centred horizontally and vertically in the viewport (at 1366×768: x 383, y 197). [ASSUMPTION — position UNKNOWN in Figma]
- A full-viewport backdrop of `primitives/color/alpha-black/70` (`#000000b2`) covers the Login page behind the modal. [ASSUMPTION — backdrop UNKNOWN in Figma]
- The modal appears and disappears without animation. [ASSUMPTION — animation UNKNOWN]
- The page behind the modal does not scroll or receive pointer/keyboard input while the modal is open.
- Each time the modal opens it starts empty: Email blank, no error, no confirmation. [ASSUMPTION]

#### FR-37: Modal container
The modal surface matches the Figma frame's container. Realizes UJ-2.
**Source:** Figma `6026:62907` · addendum Part A §1, §3
**Consequences (testable):**
- Container 600×374; background `#ffffff` (`semantic/color/bg/white`); radius **16px** (`radius/xl`); shadow `Shadow/Lg` = `0 12px 20px -2px rgba(39,39,39,0.15)`; content clipped to the radius.
- Vertical stack, gap 0, padding 0, children full width: header 72 → divider 1 → body 228 → divider 1 → footer 72 = 374.
- The modal is exposed as a modal dialog whose accessible name is its title.

#### FR-38: Header and title
The modal header shows the title exactly as in Figma. Realizes UJ-2.
**Source:** Figma `6026:62908`, `6026:62909`, `6026:62912` · addendum Part A §1, §3, §4, §7
**Consequences (testable):**
- Header: x 0, y 0, 600×72; horizontal, gap 8 (`space/4`), padding 20px 24px (`space/7` / `space/8`), items centred, overflow clipped.
- Title `Forgot Your Password or Username?`: x 24, y 24, w 532, h 24, flex 1; `Heading/md/Semibold` = Roboto SemiBold 600, 20px / 24px, letter-spacing −0.2px, `#111827` (`semantic/color/text/primary`).
- Divider: x 0, y 72, 600×1, `#d1d5db` (`semantic/color/border/primary`).

#### FR-39: Invisible close X kept as drawn
The close X exists at its Figma position but stays invisible at rest, and still closes the modal. Realizes UJ-2.
**Source:** Figma `6026:62910`, `6026:62911` · addendum Part A §3, §5, §8 Q1 · brief Workflow 2 · `0d4fd.svg`
**Consequences (testable):**
- Close control box: x **564**, y **20**, 12×32; X glyph 12×12 at y 30 in the modal (paths `M0 10L12 22M12 10L0 22`), stroke `#6B7280` 1.5px, round caps; group opacity **0** (invisible at rest and on hover).
- Clicking the 12×32 box closes the modal (FR-47).
- The control has the accessible name `Close` and is in the modal's tab order; on keyboard focus only, it shows at opacity 1 with the FR-9 focus ring (2px `#006a36`, offset 2px). [ASSUMPTION]

#### FR-40: Body and intro copy
The modal body shows the intro copy exactly as in Figma. Realizes UJ-2.
**Source:** Figma `6026:62913`, `6026:62914` · addendum Part A §1, §3, §4, §7 · SCRUM-29 AC1
**Consequences (testable):**
- Body: x 0, y 73, 600×228; background `#fbfbfb` (`brand/gray/50`); padding 24 (`space/8`); vertical gap 16 (`space/6`); overflow clipped.
- Body copy: x 24, y 97, w **392** (fixed), h 44; text `Forgot your password or username? Enter your email address, and we’ll send you a link to reset your password.` (typographic `’`); Roboto Regular 400, 14px / 22px, `#374151`; wraps to exactly 2 lines, breaking after `email address,` as in the Reference render.

#### FR-41: Email field
The user can type an email address into a required Email field drawn exactly as in Figma. Realizes UJ-2.
**Source:** Figma `6026:62915` (`I…;4324:43401`, `I…;215:1978`, `I…;215:1979`, `I…;215:1981`) · addendum Part A §1, §3, §4, §7 · SCRUM-29 AC1
**Consequences (testable):**
- Input group: x 24, y 157, 320×60, vertical gap 4 (`space/2`).
- Label row: x 24, y 157, auto width, h 16, horizontal gap 4, items centred; label `Email ` + `*`: `Label/md/Semibold` = Roboto SemiBold 600, 12px / 16px, `#374151`; the `*` is `#dc2626`.
- Field: x 24, y **177**, 320×40; background `#ffffff` (`semantic/color/bg/primary`); border 1px (`border-width/hairline`) solid `#d1d5db` (`table/row/border`); radius **8px** (`brand/radius/md`); padding 0 16px (`input/spacing/padding-x`); gap 8; items centred; overflow clipped.
- Placeholder `Eg. example@mail.com`: `Body/md/Regular` = Roboto Regular 400, 16px / 24px, `#6b7280` (`semantic/color/text/placeholder`).
- Typed text: Roboto Regular 400, 16px / 24px, `#111827` (`component/input/text/default`). [ASSUMPTION]
- The field is required, uses the email input type and the `email` autocomplete hint, and is labelled `Email`.
- Focus: border stays 1px `#d1d5db`; a 2px `#006a36` outline offset 2px appears. [ASSUMPTION]

#### FR-42: Help "?" icon and tooltip
The user can see a tooltip explaining which email to use by hovering or focusing the help icon. Realizes UJ-2.
**Source:** Figma `I6026:62915;4324:43402;5759:52232` · addendum Part A §3, §5, §6 · SCRUM-29 AC2 · `16936.svg`
**Consequences (testable):**
- Icon slot 16×16 directly after `Email *` in the label row (gap 4); the SVG (35.001×35.001) is placed at −8.5, −8.5 inside the slot with overflow visible; circle r 7.5 centred at (9, 9) relative to the slot; stroke `#9CA3AF` 1.5px, round caps.
- On pointer hover or keyboard focus of the icon, a tooltip shows: `Use the email address linked to your SureTrack account.` [ASSUMPTION — text TBC in SCRUM-29]
- Tooltip style: background `#111827`, text Roboto Regular 400, 12px / 16px, `#ffffff`, padding 8px 12px, radius 8px, max width 240px, positioned above the icon. [ASSUMPTION]
- The tooltip hides on pointer leave or blur; the icon is keyboard focusable, has the accessible name `Email help` [ASSUMPTION] and the tooltip text is its accessible description.
- The tooltip is not visible at rest.

#### FR-43: Help text and SureTrack Coach number
The modal shows how to reach SureTrack Coach exactly as in Figma. Realizes UJ-2.
**Source:** Figma `6026:62916` · addendum Part A §3, §4, §7, §8 Q12 · brief Open Questions 4 · SCRUM-29 AC1, AC7
**Consequences (testable):**
- Box: x 24, y **233**, w **552**, h 44.
- Line 1 `Need additional help?`: Roboto Regular 400, 14px / 22px, `#374151`; then a line break.
- Line 2 `SureTrack Coach (855) 293-5607`: Roboto Medium 500, 14px / 22px, `#374151`; not underlined.
- The number is a tap-to-call link to `tel:+18552935607` whose appearance is identical to the plain text drawn (same colour, weight, no underline). [ASSUMPTION — satisfies SCRUM-29 AC7 on phones without changing the at-rest look]
- The hidden Select field (`6026:62917`) is not rendered.

#### FR-44: Footer, Cancel and Submit
The modal footer shows Cancel and Submit exactly as in Figma. Realizes UJ-2.
**Source:** Figma `6026:62918`, `6026:62919`, `6026:62920`, `6026:62921` · addendum Part A §1, §3, §4, §7
**Consequences (testable):**
- Divider: x 0, y **301**, 600×1, `#d1d5db`.
- Footer: x 0, y 302, 600×72; horizontal, justify end, items centred, gap 12 (`space/5`), padding 16px 24px.
- Cancel: x **364**, y **318**, 100×40; transparent background; padding 10px 16px; gap 8; radius 8px; label `Cancel` Roboto SemiBold 600, 14px / 20px, `#111827` (`component/input/text/default`).
- Submit: x **476**, y **318**, 100×40; background `#006a36` (`brand/primary/500`); padding 10px 16px; gap 8; radius 8px; label `Submit` Roboto SemiBold 600, 14px / 20px, `#ffffff` (`semantic/color/text/white`).
- Both are real buttons, keyboard reachable, activated by Enter/Space.

#### FR-45: Email validation
The user is told when the email is missing or badly formed after leaving the field. Realizes UJ-2.
**Source:** SCRUM-29 AC3 · brief Workflow 2
**Consequences (testable):**
- An email is valid when, after trimming spaces, it has exactly one `@`, a non-empty local part without spaces, and a domain containing at least one `.` with a final label of 2 or more letters. [ASSUMPTION]
- Leaving the field (blur) when it is empty or invalid shows `Enter a valid email address` below the field; the message hides as soon as the value becomes valid.
- The message never shows before the field has been focused and left once (so it is absent at rest).
- Error style: text Roboto Regular 400, 12px / 16px, `#dc2626`, 4px below the field; field border 1px `#dc2626` (`component/input/border/error`); the body and modal grow by the message height (footer moves down). [ASSUMPTION]
- The message is announced to screen readers and linked to the field as its description.

#### FR-46: Submit disabled until the email is valid
Submit cannot be activated until the email is valid, without changing Submit's drawn appearance. Realizes UJ-2.
**Source:** SCRUM-29 AC3 · brief Workflow 2, rule 5 · Figma `6026:62921`
**Consequences (testable):**
- While the email is empty or invalid, activating Submit (click, Enter, Space) does nothing and Submit is exposed as disabled to assistive technology.
- The disabled Submit looks exactly as drawn (`#006a36` background, `#ffffff` label, full opacity), because Figma's at-rest modal has an empty email; only the cursor changes to `not-allowed`. [ASSUMPTION — required so the at-rest Fidelity check passes]
- Pressing Enter in a valid Email field submits. [ASSUMPTION]

#### FR-47: Loading and identical confirmation
A user who submits a valid email sees a loading state and then the same confirmation, whatever the email. Realizes UJ-2.
**Source:** SCRUM-29 AC4, AC5 · brief Workflow 2
**Consequences (testable):**
- After Submit, Submit keeps its size and colour and shows a 16×16 spinner (stroke 2px `#ffffff`) left of the label with an 8px gap; further Submit activations are ignored; the button exposes a busy state. [ASSUMPTION]
- After `policy.simulatedLatencyMs` the modal shows exactly `If an account exists for this email, we've sent a reset link. Check your inbox and spam folder.`, for any valid email (existing Dummy account email or not); no request leaves the browser.
- In the confirmation state the intro copy and Email field are replaced by the confirmation text (Roboto Regular 400, 14px / 22px, `#374151`); the help text stays; Submit is not shown; `Cancel` remains and closes the modal; the modal keeps its 600 px width and its height adjusts to content. [ASSUMPTION]
- The confirmation is announced to screen readers.

#### FR-48: Close the modal and return focus
The user can close the modal with Cancel, Esc, a click outside or the close X, and focus returns to the opener. Realizes UJ-2.
**Source:** SCRUM-29 AC6 · brief Workflow 2 · addendum Part A §8 Q1–Q2
**Consequences (testable):**
- Each of these closes the modal, in both the form and confirmation states: activating `Cancel`; pressing Esc anywhere in the modal; a pointer click on the backdrop outside the 600×374 surface; activating the close X (FR-39).
- A click inside the surface never closes it.
- After closing, keyboard focus is on the element that opened the modal (`Forgot Password or Username?` or the expired-password link), and the Login page's typed values are unchanged.
- If Esc is pressed while the tooltip (FR-42) is visible, the modal closes. [ASSUMPTION]

#### FR-49: Focus management inside the modal
While the modal is open, keyboard focus stays inside it in a fixed order. Realizes UJ-2.
**Source:** SCRUM-29 AC6 · brief Success Criteria (Workflow)
**Consequences (testable):**
- On open, focus moves to the Email field. [ASSUMPTION]
- Tab order: Close X → help "?" icon → Email → SureTrack Coach number → Cancel → Submit, then wraps to Close X; Shift+Tab wraps in reverse. [ASSUMPTION — order follows document order]
- No element of the Login page behind the modal can receive focus while it is open.
- In the confirmation state the order is Close X → SureTrack Coach number → Cancel, and focus moves to the confirmation text container or Cancel on entry. [ASSUMPTION]

**Out of Scope:** "resend after 60 seconds (TBC)" (SCRUM-29 AC5 — not in the approved brief workflow; pending confirmation); sending a real email; the Reset Password page reached from the email link (SCRUM-30); the hidden Select field (`6026:62917`); phone/tablet layouts.

**Feature-specific NFRs:**
- NFR-36: The modal is a modal dialog with an accessible name from its title; the confirmation and error messages are announced.
- NFR-37: Opening and closing the modal never causes layout shift on the Login page underneath.

**Notes:**
- The close X is invisible (opacity 0) in Figma (addendum Part A §8 Q1); kept as drawn per the brief. Confirm whether it should be visible.
- No prototype data: backdrop colour/opacity, position, animation and post-Submit design are UNKNOWN (addendum Part A §6, §8 Q2); FR-36 and FR-47 use assumptions.
- No disabled-Submit visual exists; FR-46 keeps Submit's drawn look while disabled. Design to supply a disabled style.
- Tooltip text is "TBC" in SCRUM-29 AC2; assumed copy is used.
- Resend after 60 s is "TBC" in SCRUM-29 AC5 and excluded here; confirm whether it is required.
- The confirmation copy in SCRUM-29 and the brief uses a straight apostrophe (`we've`) while the modal's Figma copy uses `’`; this PRD keeps it verbatim from SCRUM-29. Confirm which character to use.
- The Login input radius (4 px) differs from the modal input radius (8 px) (brief Open Questions 2); both kept as drawn.
- `border-width/md` (2) is defined but not applied in Figma; its intended use (possibly the focus border) is UNKNOWN.

---

> **Conventions for §4.4–4.12.**
> - All px values are CSS px at a 1366 px wide viewport; positions are relative to the Figma frame unless stated.
> - "SF stack" = font-family `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter` with `font-variation-settings: "wdth" 100` (brief fidelity rule 4). SF weights 510 / 590 are the variable-font weights from Figma and are set as written.
> - "Roboto" = self-hosted Roboto (400/500/600/700/800 as listed).
> - Copy in backticks is verbatim: "·" is U+00B7 with one space each side, "’" is U+2019.
> - Figma frames: A = Full `6215:58878` (1366×1052), B = Small `6864:4514` (1366×860), C = All-good `6879:15603` (1366×856), N = Notifications panel `8270:44312` (290×768). Reference renders: `figma-reference/dashboard-full-6215-58878.png`, `dashboard-small-6864-4514.png`, `dashboard-allgood-6879-15603.png`, `notifications-8270-44312.png`.


### 4.4 App Shell & Header

**Description:** Every signed-in view of the Dashboard is drawn inside one app shell: a light-grey page, a white 64 px Header with the SURETRACKFARM logo, three Nav tabs (Dashboard active), a bell with a red badge and the user avatar, followed by a 68 px page-title strip reading "Dashboard". The page is designed only at 1366 px wide (no max-width container, 24 px side gutters, 1318 px content width). The Dashboard is only reachable with a Session; without one the user is sent to Login and returned afterwards. The Equipment and Alerts Nav tabs, and all other out-of-scope destinations, open a "Coming soon" placeholder. The avatar opens a menu whose only entry is Logout. Realizes UJ-1. Hover and focus visuals are not designed in Figma; where behaviour needs them they get the minimal token-built styling defined in FR-58 [ASSUMPTION: styling per brief fidelity rule 5].

**Functional Requirements:**

#### FR-50: Page canvas and grid
The system renders the Dashboard on a fixed 1366 px layout with the exact vertical rhythm of the Figma frame. Realizes UJ-1.
**Source:** Figma `6215:58878`, `6864:4514`, `6879:15603` · addendum Part B §2.1, §1.4, §16 items 18, 25
**Consequences (testable):**
- Page background is `#F3F4F6` (sampled); there is no max-width container; side gutters are 24 px, content width 1318 px.
- Vertical positions (x, y, w×h): Header 0, 0, 1366×64 · page-title strip 0, 64, 1366×68 · KPI strip 24, 136, 1318×90 (4 px below the title strip) · content area 24, 246 (20 px below the KPI strip).
- Content row 1: two cards, each 649 px wide, column gap 20 px (649 + 20 + 649 = 1318); height 444 px in Full, 240 px in Small and All-good.
- Content row 2 at y 464 (Full) / 260 (Small, All-good) relative to the content area, i.e. row gap 20 px: three cards, each 426×326, column gap 20 px (426×3 + 20×2 = 1318).
- Bottom space below row 2 is exactly as drawn per Dashboard state: Full 16 px, Small 28 px, All-good 24 px (driven by the state data, not normalised). Resulting document heights equal the Figma frames exactly: Full 1052 px, Small 860 px, All-good 856 px.
- At viewport widths other than 1366 px the layout is not required to adapt (responsive behaviour from SCRUM-37 AC7 is out of scope).

#### FR-51: Header container
The system shows a Header across the top of every signed-in view. Realizes UJ-1.
**Source:** Figma `6227:63670` (instance of master `6194:35398` "Dashboard") · addendum Part B §2.2, §1.5
**Consequences (testable):**
- Header is 1366×64, background `#FFFFFF`, `display:flex; justify-content:space-between; align-items:center; padding:0 24px`.
- Header shadow: drop-shadow `0 2px 2px rgba(39,39,39,0.1)` (generated-code value; the `Shadow/2` Design token states blur 4 — see Notes Q-S2).
- Left block is 193 px wide, 64 px high, gap 16: logo, then the header divider.
- Logo: asset `figma-assets/dashboard/logo.svg` (`d61ab.svg`) used unmodified, rendered at 176.895×14, fill `#111827`, vertically centred; left edge at x 24.
- Header divider: asset `navline.svg` (`e73a1.svg`), 24 px line rotated 90°, stroke `#9CA3AF`; the exported path carries `opacity="0"`, so it occupies its slot but is not visible — the Reference render shows no divider.
- The hidden "Farm Test" switcher (Roboto SemiBold 18/26 + Alt-Arrow-Down 24) and the hidden page-title breadcrumb / back arrow / 327×36 right frame are NOT rendered in any Dashboard state.

#### FR-52: Nav tabs with active Dashboard tab
User can see three Nav tabs with the Dashboard tab marked active and can open each tab's page. Realizes UJ-1.
**Source:** Figma master `6194:35398`, icons `I6227:63670;6194:35372`, `I6227:63670;6194:35376`, `3062:32562` · addendum Part B §2.2, §12, §13, §15 · brief Workflow 4
**Consequences (testable):**
- Three Nav tabs in this order with labels `Dashboard`, `Equipment`, `Alerts`; no gap between tabs; tab group starts at x 514.5 (result of `space-between`, not centred), so tabs span x 514.5–668.5, 668.5–822.5, 822.5–976.5.
- Each Nav tab: 154×64, `display:flex; gap:8px; align-items:center; justify-content:center; border-bottom:4px solid`.
- Active tab (Dashboard): background `#F0FFF8`; border-bottom 4px `#006A36`; icon `widget5.svg` ("AGI Icons / Widget 5") 24×24, fill `#006A36`; label Roboto 600 16/24, letter-spacing 0, colour `#111827`.
- Inactive tabs (Equipment, Alerts): background `#FFFFFF`; border-bottom 4px `#FFFFFF` (keeps the height stable); label Roboto 600 16/24 colour `#374151`; label AND icon at opacity 0.7; Equipment icon `garage.svg` (24, black with inner 0.7 opacity); Alerts icon `nav_danger.svg` ("vuesax/linear/danger", 24, black stroke 1.5).
- Activating `Dashboard` navigates to `/dashboard`; `Equipment` to `/equipment`; `Alerts` to `/alerts` (target pages per FR-57). Tabs are links reachable by Tab key and activated by Enter.
- On `/equipment` and `/alerts` the Header shows that tab in the active style and Dashboard in the inactive style (Figma header variants `6229:37003` "Equipment", `6223:34415` "Alerts").
- No hover style exists in Figma; only the FR-58 minimal hover/focus applies.

#### FR-53: Bell button and badge
User can open the Notifications panel from the bell, which shows an unread badge. Realizes UJ-1.
**Source:** Figma `I6227:63670;6194:35257` · addendum Part B §2.2, §1.4, §12, §16 item 14 · brief Workflow 5
**Consequences (testable):**
- Right block ("Icon action Header"): row, gap 20, height 64; bell followed by avatar; visible bell-to-avatar spacing about 16 px.
- Bell: a button containing `bell.svg` ("AGI Icons / Bell") at 20×20, fill `#111827`. Accessible name `Notifications` [ASSUMPTION: Figma gives no label].
- Badge: absolutely positioned at left 9 px, top 18 px of the right-block container (overlapping the bell's top-right); 14×14; border-radius 100; background `#FF0000`; text centred, Roboto 800 (ExtraBold) 9 px, line-height normal, letter-spacing −0.5px, colour `#FFFFFF`.
- Badge text is `header.bellBadge` from the Dashboard state file, rendered verbatim: `2` in Full, Small and All-good (not derived from the notifications list or alert counts).
- Activating the bell (click, Enter or Space) opens the Notifications panel (FR-97); activating it while the panel is open closes the panel.

#### FR-54: Avatar and Logout
User can open the avatar menu and log out. Realizes UJ-1.
**Source:** Figma `I6227:63670;6194:35269/35270/35277`, profile menu `6026:52937` · addendum Part B §2.2, §11 (profile menu), §13 · brief Workflow 6
**Consequences (testable):**
- Avatar holder 48×48 with `justify-content:flex-end`, containing one 32×32 circular image (`border-radius:50%`, `object-fit:cover`) made from `avatar3.png` (`543ac.png`, 256² JPEG); fallback disc colour `#1C447E` behind the image. The avatar's right edge sits at x 1342.
- The avatar is a button; accessible name `Account menu` [ASSUMPTION].
- Activating the avatar opens a menu containing exactly one entry, `Logout`. [ASSUMPTION: menu presentation — a white panel (`#FFFFFF`, 1px `#D1D5DB` border, radius 12, card drop-shadow `0 2px 2px rgba(39,39,39,0.1)`, padding 20) anchored below the avatar, right-aligned to x 1342; entry text Roboto 500 16/24 in `#E05400`, the colour of the Figma "Logout" entry. The other Figma entries (My Profile, My Preference, Account Settings, Help) are not shown.]
- Esc or a second avatar activation closes the menu and returns focus to the avatar [ASSUMPTION].
- Activating `Logout` ends the Session and navigates to `/login`; afterwards, opening `/dashboard` redirects to `/login` (FR-56).

#### FR-55: Page-title strip
The system shows the page title "Dashboard" in its own strip under the Header. Realizes UJ-1.
**Source:** Figma `6215:59009` · addendum Part B §2.1, §2.3, §12, §16 item 18
**Consequences (testable):**
- Strip at y 64, 1366×68, background `#F3F4F4` (intentionally 2 units of blue off the page `#F3F4F6`; kept as drawn), padding 16 top / 20 bottom / 24 left and right.
- Text `Dashboard`: Roboto 600, 24 px, line-height 32 px, letter-spacing −0.6px, colour `#09090B`, single line with ellipsis; text box at x 24, y 80.

#### FR-56: Route protection (Session required)
Unauthenticated user is redirected to Login when opening the Dashboard and returned after signing in. Realizes UJ-1.
**Source:** brief Workflow 1 and 4 · SCRUM-27 (redirect target)
**Consequences (testable):**
- Opening `/dashboard` (with or without `?state=`) without a Session navigates to `/login`; no Dashboard content (Header, KPI strip, cards) is rendered before the redirect.
- After a successful sign-in from that redirect, the user lands on the originally requested URL including its query (e.g. `/dashboard?state=small`).
- The same protection applies to every placeholder route in FR-57.
- `/` navigates to `/dashboard` when a Session exists and to `/login` otherwise [ASSUMPTION].
- A Session survives a page reload in the same browser tab [ASSUMPTION: client-side dummy Session per brief Scope].

#### FR-57: "Coming soon" placeholder for out-of-scope destinations
User who follows a link to an out-of-scope page sees a "Coming soon" placeholder inside the app shell. Realizes UJ-1, UJ-1.
**Source:** brief Workflow 4 [ASSUMPTION in brief], brief Scope (Out: Equipment, Alerts, Profile pages)
**Consequences (testable):**
- The following routes render the placeholder (route shapes are [ASSUMPTION]): `/equipment`, `/equipment?type=<bins|piles|flats|tanks|dryers>`, `/equipment?status=<online|offline>`, `/alerts`, `/equipment/<deviceId>`, `/equipment/<deviceId>/hotspot`, `/equipment/<deviceId>/fans`, `/equipment/<deviceId>/connection`, `/equipment/<deviceId>/fan-switches`.
- The placeholder shows the Header (FR-51…FR-54) with the matching Nav tab active (Equipment for `/equipment…`, Alerts for `/alerts`), the page-title strip with the Nav tab's label as title, and the text `Coming soon` [ASSUMPTION: copy `Coming soon`, Roboto 700 16 `#111827`, centred in a `#F4F5F6` radius-12 block of 1318 px width, 24 px below the title strip].
- Browser Back from a placeholder returns to the Dashboard in the same Dashboard state (query preserved).

#### FR-58: Minimal hover and focus behaviour (not designed in Figma)
User can see which interactive element is under the pointer or has keyboard focus, without the at-rest appearance changing. Realizes UJ-1, UJ-1.
**Source:** brief fidelity rule 5, Open Questions 3 · addendum Part B §15 · SCRUM-38 AC4
**Consequences (testable):**
- Every interactive element (Nav tabs, bell, avatar, KPI tiles, Equipment rows, View All links, Alert rows, Action links, Notifications panel controls, Notification items) shows `cursor:pointer` and is reachable with Tab in visual order (left→right, top→bottom).
- [ASSUMPTION] Keyboard focus: 2px solid `#006A36` outline, offset 2px, shown only for keyboard focus (`:focus-visible`); never visible in at-rest screenshots.
- [ASSUMPTION] Hover on an Equipment row or Alert row: background `#F0FFF8` (`table/row/bg-selected`); hover on View All / Action link text: underline. No layout shift (no size, padding or border change).
- At-rest screenshots (no pointer over the page, no focus) must be identical with and without these rules (Fidelity check).

**Feature-specific NFRs:**
- Visual Fidelity check of the shell area (y 0–132) against each Reference render: ≤0.5% differing pixels, all measured elements within ±1 px (brief Success Criteria).
- All Header icons are inline/imported SVGs from `figma-assets/dashboard/`; only the avatar is raster.

**Notes:**
- Q-S1 (resolved): bottom space follows each Figma frame (16 / 28 / 24 px) so document heights equal the frames; AGI design may still want to normalise it in Figma.
- Q-S2: Header/card shadow blur — generated code 2 px vs `Shadow/2` token 4 px. This PRD uses 2 px (matches the Reference render).
- Q-S3 (resolved): the menu entry label is Figma's `Logout`; the other profile-menu entries are out of scope. Menu presentation remains [ASSUMPTION] until design confirms.

---

### 4.5 KPI Strip

**Description:** Directly below the page title, a single white strip summarises the account in five KPI tiles: equipment needing attention (with critical count), total Equipment with a per-type breakdown, Online, Offline and fans running. The strip is drawn identically in structure for the three Dashboard states, with three differences: All-good swaps the warning icon for a green tick and greys the attention label; breakdown sub-counts are Regular in Full but Bold in Small and All-good; and tile widths differ per state. Each KPI tile is a click target: Need attention → Alerts; total Equipment → Equipment; a type sub-count → that Equipment section; Online / Offline → Equipment with that status; Fans running → Equipment [ASSUMPTION]. Values are copied verbatim from the state file even where they contradict other cards. Realizes UJ-1.

**Functional Requirements:**

#### FR-59: KPI strip shell
The system shows the KPI strip as one white rounded panel. Realizes UJ-1.
**Source:** Figma `6337:55041` ("Section - Operation status") · addendum Part B §3, §1.5, §16 item 19
**Consequences (testable):**
- Position x 24, y 136; size 1318×90; background `#FFFFFF`.
- Visible corner radius 12 px with `box-shadow: 0px 2px 4px 0px rgba(39,39,39,0.15)` (Figma frame radius is 16 but the shadow rectangle that defines the visible shape is 12; render radius 12).
- Outer padding-y 6; inner container padding-y 4, `display:flex; align-items:flex-start`; Full and Small use `justify-content:center`; All-good uses `gap:20px` (no justify-content).
- Each KPI tile: `padding:12px 20px; display:flex; align-items:center; gap:14px`; tile content height 46 → tile height 70.
- Every KPI tile except the first has `border-left: 1px solid #E6E8EB`.

#### FR-60: KPI tile anatomy (icon tile and text block)
The system draws each KPI tile with a coloured icon tile and a number-over-label text block. Realizes UJ-1.
**Source:** addendum Part B §3, §12, §13 · Figma `6337:55047`, `6337:55059`, `6337:55100`, `6337:55110`, `6337:55121`, `6882:59666`
**Consequences (testable):**
- Icon wrapper 44×46 with padding-top 2, holding a 44×44 icon tile, border-radius 12, icon centred at 22×22 (All-good attention icon 20×20).
- Text block: column, gap 2. Number: Roboto 700, 22 px, line-height 25.3 px, `#111827`. Label: Roboto 400, 13.5 px, line-height normal, `#4B5563`.
- Icon tile backgrounds and icons:
  - Need attention (Full, Small): tile `#FDECEC`, icon `kpi_alert.svg` (`321dd.svg`, warning triangle) stroke `#C62828`, width 1.83.
  - Need attention (All-good): tile `#EAF8EF`, icon `kpi_tick.svg` (`2c2db.svg`, "AGI Icons / Operation Normal" tick-circle) 20×20, stroke `#005C2F`, width 1.6.
  - Equipment: tile `#EDE9FE`, icon `kpi_equip.svg` (`a2115.svg`, silo/garage) black at opacity 0.7.
  - Online: tile `#EAF8EF`, icon `kpi_online.svg` (`9dee1.svg`, wifi) stroke `#4B5563`.
  - Offline: tile `#F4F5F6`, icon `kpi_offline.svg` (`40eb7.svg`, wifi-off) stroke `#4B5563`.
  - Fans running: tile `#EFF6FF`, icon `kpi_fans.svg` (`e5347.svg`, fan) stroke `#4B5563`.

#### FR-61: Need attention KPI tile
User can see how many items need attention and the critical count. Realizes UJ-1.
**Source:** addendum Part B §3, §10, §14 · SCRUM-37 AC1
**Consequences (testable):**
- Width 264 px in all states; x 0 within the strip.
- Full: number `7`; label `Need attention · 2 critical` in Roboto 700 13.5 `#C62828` (node has `text-align:right` but hugs its text, so it renders left-aligned).
- Small: number `1`; label `Need attention · 1 critical`, Roboto 700 13.5 `#C62828`.
- All-good: number `0`; label `Need attention · all good`, Roboto 400 13.5 `#4B5563`; green tick icon tile per FR-60.
- The number is `kpi.attention.value` and the label `kpi.attention.label`, rendered verbatim (Full "7" is kept even though the cards show 5 alerts in the Health bars and 4 Alert rows).

#### FR-62: Equipment KPI tile with type breakdown
User can see total Equipment and the count per equipment type. Realizes UJ-1.
**Source:** addendum Part B §3, §10, §14, §16 item 20 · SCRUM-37 AC1
**Consequences (testable):**
- Structure: a 147 px block (icon tile + total number over label `Equipment`), then one sub-count block per type, gap 20 between blocks; each sub-count block is 40 px wide (`Tanks` block 50 px), number over label.
- Sub-count labels use the KPI label style (Roboto 400 13.5 `#4B5563`).
- Sub-count numbers: Full Roboto **400** 22/25.3 `#111827`; Small and All-good Roboto **700** 22/25.3 `#111827` (drift kept as drawn).
- Full: tile width 500 (fixed), x 264; total `20` `Equipment`; sub-counts `7` `Bins`, `3` `Piles`, `2` `Flats`, `6` `Tanks`, `2` `Dryers`.
- Small: width 308 (hug), x 264; total `2` `Equipment`; sub-counts `1` `Bin`, `1` `Dryer`.
- All-good: width 248 (hug), x 284; total `1` `Equipment`; sub-count `1` `Bin`.

#### FR-63: Online, Offline and Fans running KPI tiles
User can see online and offline equipment counts and how many fans are running. Realizes UJ-1.
**Source:** addendum Part B §3, §10, §14 · SCRUM-37 AC1
**Consequences (testable):**
- Labels verbatim: `Online`, `Offline`, `Fans running now`.
- Full: Online `16` (width 173, x 764); Offline `4` (width 173, x 937); Fans `7 of 24` (flex 1 = 208, x 1110).
- Small: Online `2`, Offline `0`, Fans `2 of 3`; each flex 1 = 248.67 px, at x 572, 820.67, 1069.33.
- All-good: Online `1`, Offline `0`, Fans `2 of 3`; the three tiles are wrapped in a 766 px group at x 552 with gap 20; each flex 1 = 242 px, at x 552, 814, 1076.
- Fans number is the display string `kpi.fans.value` (e.g. `7 of 24`) in the KPI number style.

#### FR-64: KPI tile navigation
User can open the matching page from each KPI tile. Realizes UJ-1.
**Source:** SCRUM-37 AC2 · brief Workflow 4 · addendum Part B §15 (Figma makes the whole strip one `<a>`)
**Consequences (testable):**
- Each KPI tile (and each Equipment sub-count block) is a separate link, reachable by Tab and activated by Enter; Figma's single strip link is replaced by per-tile links with no visual change.
- Targets [route shapes ASSUMPTION]: Need attention → `/alerts`; Equipment total → `/equipment`; sub-count `Bins`/`Bin` → `/equipment?type=bins`, `Piles` → `?type=piles`, `Flats` → `?type=flats`, `Tanks` → `?type=tanks`, `Dryers`/`Dryer` → `?type=dryers`; Online → `/equipment?status=online`; Offline → `/equipment?status=offline` (offline filter TBC in SCRUM-37); Fans running → `/equipment` [ASSUMPTION: no Jira target given].
- All targets render the FR-57 placeholder.

**Notes:**
- Q-K1: Full "7 Need attention" vs 5 alerts (Health bars) vs 4 Alert rows; Offline 4 vs 1 offline in the Health bars — kept verbatim (brief Open Question 1).
- Q-K2: Breakdown sub-count weight Regular (Full) vs Bold (Small, All-good) — kept as drawn; design to choose one.

---

### 4.6 Equipment Card

**Description:** The Equipment card ("Equipment (N)", "Health by type") lists one row per equipment type the account has. Each row shows the type name and count, a 474 px Health bar split into red alert, grey-hatched offline and green healthy Health segments, a caption such as "3 alerts · 1 offline · 3 healthy" and a chevron. Clicking a row opens Equipment at that type's section; View All opens Equipment. Segment widths come from the exact formula that reproduces Figma's pixel widths; captions are verbatim strings. Full shows 5 rows, Small 2, All-good 1. Realizes UJ-1.

**Functional Requirements:**

#### FR-65: Card shell and header (shared by all five cards)
The system draws each Dashboard card with the shared card shell. Realizes UJ-1.
**Source:** addendum Part B §4, §1.5, §16 item 21 · all five "alerts-activity-card" nodes
**Consequences (testable):**
- Card: background `#FFFFFF`; border 1px solid `#D1D5DB`; border-radius 12; padding 20; `filter: drop-shadow(0px 2px 2px rgba(39,39,39,0.1))`.
- Header ("Margin"): Equipment, Recent Alerts and Fan activity cards height 56 with padding-bottom 12; Grain On Hand and Liquid On Hand nominal height 33 with padding-bottom 12 (text needs 46 px and visibly overflows into the following 24 px gap — reproduce the visual result: ~46 px of header, then the summary 57 px below the header top).
- Header text column, gap 3: title SF stack 590, 20 px, line-height 1.25, `#1F2937`; subtitle SF stack 400, 12 px, line-height 1.5, colour rgba(0,0,0,0.8) on Equipment and Recent Alerts cards, `#4B5563` on Fan activity, Grain On Hand and Liquid On Hand cards.
- "View All" link (Equipment and Recent Alerts only), right side of the header: min-height 44, padding 13.5px 2px, inner gap 6; text `View All` SF stack 510, 14/1.25, `#005C2F`; followed by a right chevron drawn as SVG in a 12×16 box, colour `#006A36` (recreated; Figma uses an SF Symbol glyph).

#### FR-66: Equipment card header content
User can see how many equipment items the account has. Realizes UJ-1.
**Source:** addendum Part B §5, §14 · SCRUM-37 AC3
**Consequences (testable):**
- Card size 649×444 (Full), 649×240 (Small, All-good); position x 24, y 246.
- Title verbatim from `equipmentCard.title`: Full `Equipment (20)`, Small `Equipment (2)`, All-good `Equipment (1)`. Subtitle `Health by type`.

#### FR-67: Equipment row layout
User can see each equipment type with its count, Health bar, caption and chevron. Realizes UJ-1.
**Source:** Figma rows under `6215:58878` (e.g. "Item → Button - Bins, 7: 3 alerts, 1 offline, 3 healthy"), chevron `6337:54590/54591` · addendum Part B §5.1
**Consequences (testable):**
- List: Full height 344 with `justify-content:center` (5 rows: 68 + 4×69 = 344); Small and All-good auto height, top-aligned.
- Row: `display:flex; justify-content:space-between; align-items:center; min-height:58; padding:12px 0 8px`; height 68 (69 including a 1 px top border).
- Left column width 74, column, gap 1, padding-bottom 1: type name SF stack 590, 16/1.5, `#1F2937`; count SF stack 400, 14/1.25, `#374151`.
- Right group width 523, row, gap 32: bar block (width 474, column, gap 6: Health bar then caption), then the row chevron.
- Row chevron: 18×18 box; right-chevron glyph 12×16 at left 3, top 1, colour `#006A36` (recreated SVG).
- Rows in order of `equipmentCard.rows`: Full `Bins` 7, `Piles` 3, `Flats` 2, `Tanks` 6, `Dryers` 2; Small `Bin` 1, `Dryer` 1; All-good `Bin` 1.

#### FR-68: Row dividers per Dashboard state
The system separates rows with hairline dividers exactly as each frame draws them. Realizes UJ-1.
**Source:** addendum Part B §5.1, §16 item 24
**Consequences (testable):**
- Divider: `border-top: 1px solid #E6E8EB` on the row.
- Every row after the first has a top divider (Full rows 2–5; Small row 2 `Dryer`).
- The first row has no top divider when the list has 2 or more rows (Full, Small); when the list has exactly 1 row it has a top divider (All-good `Bin`).

#### FR-69: Health bar geometry and formula
User can see each type's health split proportionally into alert, offline and healthy Health segments. Realizes UJ-1.
**Source:** addendum Part B §5.2 · brief fidelity rule 2 · SCRUM-37 AC3, AC5
**Consequences (testable):**
- Health bar container 474×8, `border-radius:4px; overflow:hidden`; segments square-cornered, 8 px high, separated by 2 px gaps; rounding comes only from the container clip.
- Health segment order left→right: alert (`#C62828`), offline (hatch, FR-70), healthy (`#15803D`). Zero-count segments are omitted (no gap is reserved for them).
- Width formula (exact): `segment_px = (474 − 2·(k − 1)) × count / total`, where `total = alerts + offline + healthy` and `k` = number of non-zero Health segments. A single Health segment spans the full 474 px.
- Expected widths (x start → width), Full:
  - Bins (3/1/3, k=3): alert 0 → 201.43; offline 203.43 → 67.14; healthy 272.57 → 201.43.
  - Piles (1/0/2, k=2): alert 0 → 157.33; healthy 159.33 → 314.67.
  - Flats (0/0/2, k=1): healthy 0 → 474.
  - Tanks (1/0/5, k=2): alert 0 → 78.67; healthy 80.67 → 393.33.
  - Dryers (0/0/2, k=1): healthy 0 → 474.
- Small: Bin (1/0/0) alert 0 → 474 (solid red; Figma builds it from two red cells but it reads as one); Dryer (0/0/1) healthy 0 → 474.
- All-good: Bin (0/0/1) healthy 0 → 474.
- The numbers driving the bar are `rows[].alerts`, `rows[].offline`, `rows[].healthy` (numbers), never parsed from the caption.

#### FR-70: Offline hatch pattern
User can distinguish offline equipment by a grey diagonal hatch. Realizes UJ-1.
**Source:** addendum Part B §5.2 (node fill verbatim), §1.4, §16 (e)
**Consequences (testable):**
- Offline Health segment fill (verbatim): `linear-gradient(43.841deg, #9CA3AF 0%, #9CA3AF 5.8535%, #D1D5DB 5.8535%, #D1D5DB 11.707%, …)` — 17 hard-edged stripes of 5.8535% each, alternating and starting with `#9CA3AF` (stripe i covers i×5.8535%…(i+1)×5.8535%; even i `#9CA3AF`, odd i `#D1D5DB`), with `#D1D5DB` from 99.5095% to 100%.
- Resulting stripe pitch on the Full Bins offline segment (67.14 px) is ≈3.9–4 px; the approximation `repeating-linear-gradient(45deg, #9CA3AF 0 4px, #D1D5DB 4px 8px)` is acceptable only if it passes the Fidelity check.
- The offline Health segment appears only in Full Bins (Small and All-good have no offline units).

#### FR-71: Health caption
User can read the split as text under each Health bar. Realizes UJ-1.
**Source:** addendum Part B §5.1, §14 · SCRUM-37 AC3, AC4
**Consequences (testable):**
- Caption sits 6 px below the Health bar; Roboto 14 / line-height normal; every number Roboto 700 `#111827`; every word and separator Roboto 400 `#4B5563`.
- Caption text is `rows[].caption` rendered verbatim (numbers bolded by digit runs): Full `3 alerts · 1 offline · 3 healthy`, `1 alert · 2 healthy`, `2 healthy`, `1 alert · 5 healthy`, `2 healthy`; Small `1 alert`, `1 healthy`; All-good `1 healthy`.
- Separator is ` · ` (U+00B7 with one space each side); zero categories are absent and singular/plural are as written in the data (SCRUM-37 AC4 satisfied by the data).

#### FR-72: Row and View All navigation
User can open Equipment at a type's section from its row, or the full Equipment page from View All. Realizes UJ-1.
**Source:** SCRUM-37 AC6 · brief Workflow 4 · addendum Part B §15
**Consequences (testable):**
- The whole row is one button/link; accessible name format `<type>, <count>: <caption with " · " replaced by ", ">` (e.g. `Bins, 7: 3 alerts, 1 offline, 3 healthy`; Small `Bin, 1: 1 alert`).
- Activating a row navigates to `/equipment?type=<rows[].typeKey>` (`bins`, `piles`, `flats`, `tanks`, `dryers`) [route shape ASSUMPTION]; activating `View All` navigates to `/equipment`. Both render the FR-57 placeholder.
- Rows and View All are reachable by Tab in top-to-bottom order after the header link.

**Feature-specific NFRs:**
- Each Health segment width within ±1 px of the expected values above in a DOM measurement test.

**Notes:**
- Q-E1: Exact hatch stripe pitch is UNKNOWN (gradient length not exposed); ≈4 px assumed (addendum §16 (e)).
- Q-E2: Counting precedence (alert → offline → healthy) is TBC in SCRUM-37 AC5; this build only displays the file's numbers.

---

### 4.7 Recent Alerts Card

**Description:** The Recent Alerts card ("Most urgent first. Each item links to what to do next.") shows up to four Alert rows, each with a severity icon, title, "ID | location" meta line, severity label, relative time and an Action link (View Hotspot, Check Fans, Check Connection, Check Fan Switches). The Action link opens that screen for the equipment; clicking elsewhere on the Alert row opens the equipment detail page; View All opens Alerts. With no alerts (All-good) the card shows the Empty state "No Alerts Right Now". Figma's copy and order win over SCRUM-38 where they differ ("No Alerts Right Now" instead of "No active alerts"; times are verbatim strings that do not tick). Realizes UJ-1.

**Functional Requirements:**

#### FR-73: Card layout and header
User can see the Recent Alerts card next to the Equipment card. Realizes UJ-1.
**Source:** addendum Part B §6.1, §4 · SCRUM-38 AC1
**Consequences (testable):**
- Card at x 693 (24 + 649 + 20), y 246; 649×444 (Full) / 649×240 (Small, All-good); card shell per FR-65.
- Card is a column with gap 8: header (56) then the list "Alarms" (column, gap 12).
- Title `Recent Alerts`; subtitle `Most urgent first. Each item links to what to do next.` (rgba(0,0,0,0.8)); `View All` link per FR-65.

#### FR-74: Alert row content and typography
User can read each alert's severity, title, device and location, and how long ago it was raised. Realizes UJ-1.
**Source:** Figma "Detail" items in `6215:58878`, glyphs `6337:54670`, `6337:54715` · addendum Part B §6.1, §12, §13 · SCRUM-38 AC2
**Consequences (testable):**
- Alert row: `display:flex; gap:16px; align-items:flex-start`.
- Severity icon: wrapper padding-top 4, 20×20 circle. Critical: background `#DC2626`, padding 3.333, 15×15 white glyph `alert_crit.svg` (`a7e96.svg`, exclamation in circle, stroke 1.25). Warning: background `#FFA526`, padding 3.077, 13.846×13.846 white glyph `alert_warn.svg` (`0a6fd.svg`, triangle, stroke 1.154).
- Detail column: flex 1, gap 4, `padding-bottom:8px`, `border-bottom:1px solid rgba(30,42,44,0.15)` per FR-76.
- Top row `justify-content:space-between`. Left block width 204: title SF stack 590, 16/1.5, `#111827`, single line with ellipsis; meta SF stack 400, 12/1.5, rgba(0,0,0,0.8), format `<deviceId> | <location>` (space, U+007C, space).
- Right block: column, `align-items:flex-end`, padding-top 4, no wrap: severity label SF stack 590, 12/1.5 — `Critical` in `#DC2626`, `Warning` in `#D97706`; time SF stack 400, 12/1.5, rgba(0,0,0,0.7), right-aligned.
- Full rows in order (title · meta · severity · time · Action link):
  1. `HotSpot Detected` · `759 | Wheat Storage` · `Critical` · `30 mins ago` · `View Hotspot`
  2. `Static Pressure` · `757 | Oat Silo` · `Critical` · `2 hours ago` · `Check Fans`
  3. `No Communication` · `18086 | Pinto Storage` · `Warning` · `3 hours ago` · `Check Connection`
  4. `Missing Fan Switched` · `753 | Canola East` · `Warning` · `1 day ago` · `Check Fan Switches` (typo kept)
- Small: row 1 only (`HotSpot Detected` … `View Hotspot`).
- Times are the verbatim `time` strings; they do not update every minute and have no hover tooltip (SCRUM-38 AC6 not applicable to dummy data — see Notes).

#### FR-75: Action link
User can open the remedial screen for an alert from its Action link. Realizes UJ-1.
**Source:** addendum Part B §6.1, §13 (`6337:54689`) · SCRUM-38 AC3, AC4 · brief Workflow 4
**Consequences (testable):**
- Action link ("Button"): height 24, gap 6, padding-y 6, border-radius 6, overflow clip; text SF stack 510, 14/1.25, `#005C2F`; then `arrow_right.svg` (`75978.svg`, "AGI Icons / Arrow Right") 16×16, stroke `#005C2F`, width 1.33.
- Action link labels verbatim: `View Hotspot`, `Check Fans`, `Check Connection`, `Check Fan Switches`.
- Activating the Action link navigates to `/equipment/<deviceId>/<actionKey>` with `actionKey` ∈ {`hotspot`, `fans`, `connection`, `fan-switches`} [route shape ASSUMPTION]; e.g. row 1 → `/equipment/759/hotspot`. Target renders the FR-57 placeholder.
- Activating anywhere else on the Alert row navigates to `/equipment/<deviceId>` [route shape ASSUMPTION]. Activating the Action link must not also trigger the row navigation.
- Action links are reachable by Tab and activated by Enter; the Alert row is also focusable and activated by Enter.

#### FR-76: Alert row separators and ordering
The system separates Alert rows exactly as each frame draws them and shows at most four. Realizes UJ-1.
**Source:** addendum Part B §6.1, §16 item 24 · SCRUM-38 AC1
**Consequences (testable):**
- Every Alert row's detail column has the bottom border, except the last row of a list with 2 or more rows (Full: rows 1–3 bordered, row 4 none; Small: the single row is bordered).
- At most 4 Alert rows are rendered; rows appear in the file's order (the data is already Critical before Warning, newest first). No client re-sort [ASSUMPTION].
- `View All` navigates to `/alerts` (FR-57 placeholder).

#### FR-77: Empty state "No Alerts Right Now"
User with no alerts sees a reassuring Empty state instead of rows. Realizes UJ-1.
**Source:** Figma `6882:4705` ("div.empty") · addendum Part B §6.2, §14 · SCRUM-38 AC5 (Figma copy wins)
**Consequences (testable):**
- Shown when `recentAlerts.items` is empty (All-good); header and `View All` remain.
- Empty state: background `#F4F5F6`, border-radius 12, `padding:32px 18px`, column, `align-items:center; justify-content:center`, gap 10, full card-content width; measured height 134.
- Title `No Alerts Right Now`: Roboto 700, 16 px, line-height normal, `#111827`.
- Body `Everything is on track with your storage, dryers, and tanks. We’ll notify you as soon as anything needs attention.` (U+2019 in "We’ll"): Roboto 400, 14 px, line-height 20.3 px, `#4B5563`, centred, width 377 (wraps after "tanks." as in the Reference render).

**Notes:**
- Q-A1: Canonical alert data is `6215:58878` (brief); alternate frame `7833:12061` has different titles/severities — ignored.
- Q-A2: SCRUM-38 AC6 (relative time refresh every minute; full date on hover) needs an absolute timestamp and a tooltip design; neither exists. Not built; design/product to supply.
- Q-A3: "Missing Fan Switched" typo and mixed device-ID lengths (759 vs 18086) kept verbatim.

---

### 4.8 Fan Activity Card

**Description:** The Fan activity card ("All storage fans") shows three Stat tiles (Running Now, Runtime Today, Energy Today), a 7-day Runtime chart with an hour label above each bar and a day label below (today emphasised), and a two-line caption. The chart is identical in all three Dashboard states; Stat tile values differ only in All-good. Bar heights come from the formula `round(hours / max(hours) × 79)`. No Jira story covers this card; behaviour is display-only. Realizes UJ-1.

**Functional Requirements:**

#### FR-78: Fan activity card layout and header
User can see the Fan activity card first in row 2. Realizes UJ-1.
**Source:** addendum Part B §7, §4
**Consequences (testable):**
- Card 426×326 at x 24, y 710 (Full) / y 506 (Small, All-good) in page coordinates; shell per FR-65.
- Title `Fan activity`; subtitle `All storage fans` in `#4B5563`; header height 56.

#### FR-79: Stat tiles
User can see fans running now, runtime today and energy today. Realizes UJ-1.
**Source:** addendum Part B §7, §10, §14
**Consequences (testable):**
- Stat tile row: wrapper width 386, padding-bottom 12; row, gap 16; three Stat tiles, flex 1 (≈118 px each).
- Stat tile: background `#F4F5F6`, border-radius 8, padding 8px 10px; value SF stack 590, 16/1.5 in a fixed 20 px high box, `#111827`; label SF stack 400, 12/1.5 in a 17 px high box, rgba(0,0,0,0.8).
- Labels: `Running Now`, `Runtime Today`, `Energy Today`.
- Full and Small values: `7`, `86 h`, `410 kWh`. All-good values: `2 of 3`, `7 h 24 m`, `38 kWh` (verbatim, even where they contradict the KPI strip or chart).

#### FR-80: Runtime chart geometry and bar formula
User can compare fan runtime hours for the last 7 days. Realizes UJ-1.
**Source:** Figma frame "Img - Fan runtime hours for the last 7 days, from 62 to 90 hours" · addendum Part B §7, §1.4 · brief fidelity rule 2
**Consequences (testable):**
- Chart area 386×119 (Full) / 386×120 (Small, All-good); `display:flex; justify-content:space-between; align-items:flex-end`; no axis lines, gridlines or y-axis.
- 7 columns, each flex 1 (55.14 px), height 103, column direction, `justify-content:flex-end; align-items:center`; bar bottoms share one baseline.
- Bar: width 24 (max-width 30), border-radius 5px 5px 2px 2px (top 5, bottom 2); fill `#0B7A3B`; the `Today` bar `#0A5C30`.
- Bar x offsets within the chart (centred in each column): 15.57, 70.71, 125.86, 181.00, 236.14, 291.29, 346.43.
- Bar heights reproduce Figma's hand-placed heights exactly, supplied per bar in the data as `barPx`: Wed 54, Thu 61, Fri 66, Sat 72, Sun 68, Mon 79, Today 76 px (0 px tolerance). For any future data without `barPx`, the fallback is `bar_px = round(hours / max(hours) × 79)`.
- Chart data `fanActivity.chart` is identical in Full, Small and All-good: 62, 70, 74, 81, 77, 90, 86.
- Chart has the accessible name `Fan runtime hours for the last 7 days, from 62 to 90 hours`.

#### FR-81: Runtime chart labels
User can read each day's hours and day name, with today emphasised. Realizes UJ-1.
**Source:** addendum Part B §7, §12
**Consequences (testable):**
- Value label: absolutely positioned 18 px above the bar top (`top:-18px`), horizontally centred (inset ≈16.5% each side); Roboto 400 12 / normal, `#4B5563`; format `<hours>h` → `62h`, `70h`, `74h`, `81h`, `77h`, `90h`, `86h`.
- Day label below the bar with padding-top 5: Roboto 400 12, `#4B5563`: `Wed`, `Thu`, `Fri`, `Sat`, `Sun`, `Mon`; the last label `Today` in Roboto 700 12, `#111827`.

#### FR-82: Chart caption
User can read what the chart shows. Realizes UJ-1.
**Source:** addendum Part B §7, §14
**Consequences (testable):**
- Caption padding-top 12; SF stack 400, 12/1.5, rgba(0,0,0,0.8); wraps to 2 lines.
- Text verbatim: `Runtime hours, last 7 days. Higher this week as Auto modes used the cool nights.`

**Notes:**
- Q-N1: Small and All-good fan values contradict their KPI strip ("7 / 86 h / 410 kWh" vs "2 of 3"; "7 h 24 m" vs chart "Today 86h") — kept verbatim.
- Q-N2: Bar formula vs Figma heights differ by 1 px on Fri/Sat/Today; design to confirm formula or hand values.

---

### 4.9 Grain On Hand Card

**Description:** The Grain On Hand card ("All grain inventory") shows a summary line ("1.40M bu of 1.78M bu · 79% full"), a fill label ("79% Fill"), a segmented Fill bar split by Commodity with a remaining-capacity track, and a two-column legend of Legend items (colour swatch, Commodity name, "340k bu · 1 unit"). Segment widths come from the Figma-reproducing formula `seg_px ≈ amount_k × 0.21386`, rounded to 1.25 px, with 3.75 px gaps; Small and All-good draw one Wheat segment 321 px wide. Readings are verbatim even where the bar fill (83.2%) differs from the label (79%). Hovering a segment shows a minimal tooltip (SCRUM-39 AC3) [ASSUMPTION style]. Realizes UJ-1.

**Functional Requirements:**

#### FR-83: Card layout and header
User can see the Grain On Hand card in the middle of row 2. Realizes UJ-1.
**Source:** addendum Part B §8, §4
**Consequences (testable):**
- Card 426×326 at x 470 (24 + 426 + 20) in page coordinates, same y as Fan activity; shell per FR-65.
- Card column gap 20: [top group, gap 24: header (33 nominal, ~46 visible) + summary], then the legend.
- Title `Grain On Hand`; subtitle `All grain inventory` in `#4B5563`.

#### FR-84: Summary line and fill label
User can see total grain against capacity and the fill percentage. Realizes UJ-1.
**Source:** addendum Part B §8, §14 · SCRUM-39 AC1
**Consequences (testable):**
- Summary block ("LSN & Grain Variety") height 45, column gap 10: text row then Fill bar.
- Text row: `justify-content:space-between; align-items:flex-end; white-space:nowrap`.
- Left paragraph colour `#374151`: bold span `summaryBold` + one space in SF stack 700, 16/1.3; then `summaryRest` in SF stack 400, 16/1.3.
- Right: `fillLabel` in SF stack 510, 16/1.5, `#111827`.
- Full: `1.40M bu` + ` ` + `of 1.78M bu · 79% full`; right `79% Fill`.
- Small and All-good: `21,050 bu` + ` ` + `of 25,000 bu · 79% full`; right `84% Fill` (contradiction kept verbatim).

#### FR-85: Grain Fill bar segments and formula
User can see grain inventory split by Commodity with unused capacity as track. Realizes UJ-1.
**Source:** addendum Part B §8 (segments table), §1.4 · brief fidelity rule 2 · SCRUM-39 AC2, AC7
**Consequences (testable):**
- Fill bar: width 386, height 10, border-radius 8.75, `overflow:hidden`; segments absolutely positioned, height 10.
- Width formula: `seg_px = round_to_1.25(amount_k × 0.21386)` (0.21386 = 298.75 px / 1397 k bu). Gaps: 3.83 px after segment 1, 3.75 px after each later segment.
- Expected Full segments (left → width): Canola `#E3C341` 0 → 72.5 (340k); Corn `#E07B39` 76.33 → 67.5 (314k); Soybeans `#6F8F4F` 147.58 → 57.5 (268k); Wheat `#C98F2E` 208.83 → 47.5 (224k); Barley `#8FB36B` 260.08 → 30 (140k); Oats `#B9A47A` 293.83 → 23.75 (111k).
- Remaining-capacity track `#EEF1EF` at left 321.33, width 81.25 (overflows 386 by 16.58 px and is clipped; visible 64.67 px). Coloured extent 321.33 px = 83.2% of the bar while the label says 79% (kept).
- Small and All-good: a single Wheat segment `#C98F2E`, left 0, width 321, top −0.5 px (Figma nudge); track at left 321.33, width 81.25. The width 321 is taken from `items[].segmentPx` because the k-bu formula would give 4.50 px [ASSUMPTION: override field; see Notes Q-G1].
- Segment colours come from one Commodity colour map (Canola `#E3C341`, Corn `#E07B39`, Soybeans `#6F8F4F`, Wheat `#C98F2E`, Barley `#8FB36B`, Oats `#B9A47A`), the same in every state (SCRUM-39 AC7).

#### FR-86: Segment tooltip
User can hover a Commodity segment to see its name, amount and share of capacity. Realizes UJ-1.
**Source:** SCRUM-39 AC3 · brief fidelity rule 5, Open Questions 3 (tooltip not designed)
**Consequences (testable):**
- [ASSUMPTION] On pointer hover (or keyboard focus) of a coloured segment, a tooltip shows `<name> · <amountLabel> · <share>% of capacity`, where share = round(amountBu / capacityBu × 100); e.g. Full Canola `Canola · 340k bu · 19% of capacity`; Small Wheat `Wheat · 21,050 bu · 84% of capacity`.
- [ASSUMPTION] Tooltip style: background `#111827`, text `#FFFFFF` Roboto 400 12/18, padding 4px 8px, radius 6, no arrow, centred 4 px above the segment; not present in at-rest screenshots. The track shows no tooltip.

#### FR-87: Legend
User can read each Commodity's colour, name, amount and unit count in two columns. Realizes UJ-1.
**Source:** addendum Part B §8 (Legend), §12, §16 item 23 · SCRUM-39 AC4
**Consequences (testable):**
- Full: 3 rows, column gap 16, width 386; each row `justify-content:space-between` with 2 Legend items, each 188 wide; order (row-major): Canola, Corn / Soybeans, Wheat / Barley, Oats (file order = largest first).
- Legend item: swatch 12.5×12.5, radius 3.75, colour = segment colour, absolute at top 12.81; text block at left 24: name SF stack 590, 16/1.5, `#111827`; sub SF stack 400, 12/1.5, rgba(0,0,0,0.8), absolutely placed at top 36 with `translateY(-50%)`; item height ≈42–45 (exact value UNKNOWN).
- Corn Legend item (Figma `6337:54860`, a scaled copy) is kept as drawn: swatch 11.368, radius 3.41, top 11.65; text at left 22; name 14.551 px; sub 10.913 px; item height 40.
- Full sub-labels verbatim: `340k bu · 1 unit`, `314k bu · 1 unit`, `268k bu · 1 unit`, `224k bu · 1 unit`, `140k bu · 1 unit`, `111k bu · 1 unit`.
- Small and All-good: one Legend item, name `Wheat`, sub `21,050 bu · 1 unit · Wheat Storage`.

**Notes:**
- Q-G1: Small/All-good Wheat segment (321 px) is not reproducible by the k-bu formula (4.50 px) or by 84% × 386 (324.24 px); this PRD reproduces Figma via a data override. Design to confirm the intended rule.
- Q-G2: Corn legend scaled values (14.551 / 10.913) kept per brief fidelity rule 1; the addendum suggested normalising — design to confirm.
- Q-G3: "79% full" vs "84% Fill" (Small/All-good) and 83.2% bar vs 79% label (Full) kept verbatim.
- SCRUM-39 AC5/6/8 (metric units, "Other" grouping beyond 6 Commodities, hide card with no storage) are not exercised by the three state files; Figma shows the card in all states.

---

### 4.10 Liquid On Hand Card

**Description:** The Liquid On Hand card ("All liquid storage tanks") mirrors the Grain card for Liquid products: a Roboto summary line ("83k gal of 100k gal · 83% full"), an Inter "83% Fill" label, a 9.375 px segmented Fill bar using the exact formula `seg_px = amount_k × 3.515625`, and a 2-column legend with the scaled 14.551 / 10.913 px text. When the account has no tanks (Small, All-good) the card shows the Empty state "No Tanks Monitored Yet" — Figma wins over SCRUM-40's "card is hidden". Hover tooltip per SCRUM-40 [ASSUMPTION style]. Realizes UJ-1.

**Functional Requirements:**

#### FR-88: Card layout and header
User can see the Liquid On Hand card at the right of row 2. Realizes UJ-1.
**Source:** addendum Part B §9, §4
**Consequences (testable):**
- Card 426×326 at x 916 (24 + 2×(426 + 20)) in page coordinates; shell per FR-65.
- Title `Liquid On Hand`; subtitle `All liquid storage tanks` in `#4B5563`.
- Full: column gap 20: [top group, gap 24: header (33 nominal, ~46 visible) + "Capacity and fill" block (height 42.188, column gap 9.375, overflow clip)], then the legend.

#### FR-89: Summary line and fill label (Full)
User can see total liquid against capacity and the fill percentage. Realizes UJ-1.
**Source:** addendum Part B §9, §1.3, §14 · SCRUM-40 AC1
**Consequences (testable):**
- Row `justify-content:space-between`. Left colour `#374151`: bold span `83k gal` + one space in Roboto 700 16/1.3; then `of 100k gal · 83% full` in Roboto 400 16/1.3.
- Right: `83% Fill` in Inter 500, 16/1.5, `#111827` (the only Inter text on the page).

#### FR-90: Liquid Fill bar segments and formula
User can see liquid volume split by Liquid product with available capacity as track. Realizes UJ-1.
**Source:** addendum Part B §9 ("Segmented fill bar"), §1.4 · brief fidelity rule 2 · SCRUM-40 AC2
**Consequences (testable):**
- Fill bar: width 386, height 9.375, border-radius 8.203, flex row, gap 3.516, `overflow:hidden`.
- Width formula (exact): `seg_px = amount_k × 3.515625` (= 9 / 2.56).
- Expected Full segments (left → width): Propane `#0EA5E9` 0 → 70.313 (20k); Fuel Oil `#00B156` 73.828 → 63.281 (18k); Water `#84CC16` 140.625 → 56.25 (16k); Kerosene `#14B8A6` 200.391 → 35.156 (10k); Gasoline `#A855F7` 239.063 → 28.125 (8k); Diesel `#6366F1` 270.703 → 38.672 (11k).
- "Available capacity" track `#EEF1EF`, width 73, height 10 (clipped to the 9.375 bar), starting at 312.891 after the 6th gap.
- Coloured extent 309.38 px = 80.2% of 386 while the label says 83% (kept).
- Hover/focus tooltip on a segment: same [ASSUMPTION] format and style as FR-86, `<name> · <amountLabel> · <share>% of capacity`, share = round(amountGal / capacityGal × 100) (e.g. `Propane · 20k gal · 20% of capacity`).

#### FR-91: Legend (Full)
User can read each Liquid product's colour, name, volume and tank count. Realizes UJ-1.
**Source:** addendum Part B §9 ("Liquid categories"), §12, §16 item 23 · SCRUM-40 AC3
**Consequences (testable):**
- Legend column gap 16, overflow clip; 3 rows; each row holds 2 Legend items (flex 1) with gap 16.406 between them; each Legend item height 44.531, gap 10.547 between marker and text, `align-items:center`.
- Marker 11.719×11.719, radius 3.516, colour = segment colour.
- Name SF stack 590, 14.551/1.5, `#111827`; sub SF stack 400, 10.913/1.5, rgba(0,0,0,0.8) (scaled values kept).
- Order (row-major) and copy verbatim: `Propane` `20k gal · 4 tanks`, `Fuel Oil` `18k gal · 3 tanks` / `Water` `16k gal · 4 tanks`, `Kerosene` `10k gal · 2 tanks` / `Gasoline` `8k gal · 2 tanks`, `Diesel` `11k gal · 2 tanks`.

#### FR-92: Empty state "No Tanks Monitored Yet"
User with no tanks sees an Empty state in the card. Realizes UJ-1.
**Source:** Figma `6882:59806` ("div.empty"), header wrapper `6882:59794` · addendum Part B §9, §14 · SCRUM-40 AC5 (Figma wins: card shown, not hidden)
**Consequences (testable):**
- Shown when `liquid.items` is empty (Small, All-good); header block is 46 high (instead of 33 + 24), then gap 20, then the Empty state.
- Empty state: background `#F4F5F6`, border-radius 12, height 220, padding 18px 18px 0, column, centred, gap 10.
- Title `No Tanks Monitored Yet`: Roboto 700 16, `#111827`.
- Body `Keep an eye on propane, diesel and water levels here, and get an alert before a tank runs low.`: Roboto 400 14/20.3, `#4B5563`, centred, width 222 (3 lines, as in the Reference render).

**Notes:**
- Q-Q1: 6 tanks (KPI) vs 17 tanks in the legend kept verbatim.
- Q-Q2: Addendum states the bar children sum to 389.4 px; with the stated values (6 segments + 73 track + 6 gaps of 3.516) the sum is 385.89 px. Builds use the stated values; Fidelity check decides.
- Q-Q3: SCRUM-40 "unknown product in grey", litres unit — not exercised by the dummy data.

---

### 4.11 Dashboard States & Data Loading

**Description:** The Dashboard is driven entirely by one local JSON file per Dashboard state — `dashboard.full.json`, `dashboard.small.json`, `dashboard.allgood.json` — selected by the URL query `?state=full|small|allgood` (default `full`). Display strings are rendered verbatim; numeric fields drive only the chart formulas. While the file loads, the KPI strip and each card show placeholders; if loading fails, each shows an error with Retry without blocking the Header or other sections (SCRUM-37 AC8; styling [ASSUMPTION]). Realizes UJ-1.

**Functional Requirements:**

#### FR-93: Dashboard state selection
User (tester) can select the Dashboard state with a URL query. Realizes UJ-1.
**Source:** brief Solution table and §The Solution (`?state=`), [ASSUMPTION] default from `users.json`
**Consequences (testable):**
- `/dashboard?state=full` loads `dashboard.full.json` and must match Figma frame `6215:58878`; `?state=small` → `dashboard.small.json` / `6864:4514`; `?state=allgood` → `dashboard.allgood.json` / `6879:15603`.
- Without `?state`, the state is the signed-in dummy account's default state from `users.json` [ASSUMPTION per brief]; if none, `full`.
- Any other `?state` value falls back to the same default [ASSUMPTION].
- Changing the query and reloading switches the state; no other UI exposes the switch.

#### FR-94: Verbatim readings rule
The system renders every reading exactly as stored, without recomputing or reformatting. Realizes UJ-1.
**Source:** brief fidelity rule 2, Open Questions 1 · addendum Part B §14, §16
**Consequences (testable):**
- Every display string (titles, labels, captions, summaries, fill labels, Legend sub-labels, times, Stat tile values, Empty state copy) is rendered character-for-character from the state file, including U+00B7, U+2019 and `Missing Fan Switched`.
- Numeric display values (`kpi.*.value`, `rows[].count`) render as their plain integer with no separators or formatting.
- Numeric chart inputs (`alerts`, `offline`, `healthy`, `hours`, `amountK`, `segmentPx`) are used only by the formulas in FR-69, FR-80, FR-85 and FR-90; no displayed text is derived from them, so contradictions (e.g. Full "7" vs 5 alerts; Small "79% full" vs "84% Fill") are preserved.
- Data shape follows Addendum B (Dummy data contract).

#### FR-95: Loading placeholders
User sees placeholders while the Dashboard data loads, with no layout shift when data arrives. Realizes UJ-1.
**Source:** SCRUM-37 AC8 · brief fidelity rule 5
**Consequences (testable):**
- Header and page-title strip render immediately (they need no state data except the bell badge, which renders once loaded).
- [ASSUMPTION] While loading, the KPI strip shell (1318×90, FR-59) and each card shell (FR-65) render at the final size for the requested Dashboard state, with titles hidden and the body replaced by a `#F4F5F6` block, radius 8, filling the content box; no animation.
- When data arrives, content replaces the placeholders without any element moving (positions in FR-50 unchanged).

#### FR-96: Load error with Retry
User can retry when Dashboard data fails to load, without losing the rest of the page. Realizes UJ-1.
**Source:** SCRUM-37 AC8 · brief fidelity rule 5
**Consequences (testable):**
- If the state file request fails (network error, non-2xx or invalid JSON), the Header and page-title strip remain usable (Nav tabs, bell, avatar work).
- [ASSUMPTION] The KPI strip and each card show, centred in their shell, the text `Couldn’t load this section.` (Roboto 400 14/20.3 `#4B5563`) and a `Retry` button styled as an Action link (SF stack 510 14/1.25 `#005C2F`). The bell badge is hidden.
- Activating any `Retry` re-requests the state file; on success all sections render their content (FR-95 placeholders shown during the retry).
- Testable by intercepting the JSON request in the Fidelity/E2E test harness.

**Notes:**
- Q-T1: Loading and error visuals are not designed; copy `Couldn’t load this section.` and styling are placeholders for design.

---

### 4.12 Notifications Panel

**Description:** Activating the bell opens the Notifications panel: a 290 px white panel anchored to the right edge at full viewport height, with no scrim [ASSUMPTION per brief]. It shows the title "Notifications" with a close ✕, an "Unread Only" toggle (on by default), Filter chips All / App / Equipment / Promotions, and a scrollable list of Notification items, each with a message, a coloured tag and a verbatim timestamp. The toggle and Filter chips filter the list from `notifications.json`. ✕ or Esc closes the panel. Realizes UJ-1.

**Functional Requirements:**

#### FR-97: Open and close
User can open the Notifications panel from the bell and close it with ✕ or Esc. Realizes UJ-1.
**Source:** Figma `8270:44312`, close `8270:44316` · addendum Part B §11, §15 · brief Workflow 5
**Consequences (testable):**
- Panel: fixed position, right 0, top 0, width 290, height 100% of the viewport (768 at a 768 px viewport), above the Header and page content; no scrim, no shadow, no border (as drawn) [ASSUMPTION: presentation; Figma exposes no overlay data].
- Opening does not change or dim the Dashboard; page behind stays scrollable [ASSUMPTION].
- No open/close animation [ASSUMPTION].
- Close button: 24×24 button with `n_close.svg` (`6905e.svg`), colour `#1E2A2C`, accessible name `Close notifications` [ASSUMPTION]. Activating it, or pressing Esc while the panel is open, closes the panel and returns focus to the bell.
- On open, focus moves to the close button [ASSUMPTION]. Clicking outside the panel does not close it.
- Each opening starts with Unread Only ON and Filter chip `All` active [ASSUMPTION].

#### FR-98: Panel container and title row
User can see the panel title. Realizes UJ-1.
**Source:** addendum Part B §11, §1.4, §12
**Consequences (testable):**
- Container: background `#FFFFFF`, padding 20 (content width 250), column, gap 16.
- Title row: `display:flex; justify-content:space-between`; `border-bottom:1px solid rgba(175,195,188,0.4)`; padding-bottom 12.
- Title `Notifications`: Roboto 600, 24/26, letter-spacing −0.48px, `#09090B`.

#### FR-99: Unread Only toggle
User can show only unread Notification items or all of them. Realizes UJ-1.
**Source:** Figma `I8270:44317;617:5109` · addendum Part B §11, §13
**Consequences (testable):**
- Toggle row: gap 8; switch 32×20 then label `Unread Only` (Roboto 400 14/20, `#000000`).
- ON (default): `n_toggle.svg` (`2e1e7.svg`) — track `#006A36`, white knob on the right.
- [ASSUMPTION] OFF: same 32×20 shape with track `#CFD0D0` (`brand/gray/300`) and white knob on the left (not designed).
- The switch has role switch, accessible name `Unread Only`, toggled by click, Space or Enter.
- ON shows only items with `unread: true`; OFF shows all items. With the supplied data all 6 items are unread, so the list is the same in both positions.

#### FR-100: Filter chips
User can filter Notification items by type with Filter chips. Realizes UJ-1.
**Source:** Figma "Tablist - Notification type" · addendum Part B §11, §1.5
**Consequences (testable):**
- Tablist: `border-bottom:1px solid #D9DCD6; padding:8px 0 16px; overflow:hidden`; chips in a 250 px row, gap 12, padding-left 1; chip height 24.
- Filter chips in order: `All` (w 66), `App` (w 66, padding 2), `Equipment` (w 100), `Promotions` (hug, padding 3px 14px); `Promotions` is clipped beyond 250 px at rest and the row scrolls horizontally to reveal it.
- Active chip (default `All`): background `#FFFFFF`, border 0.5px rgba(0,0,0,0.16), radius 99, `filter: drop-shadow(0 3px 4px rgba(0,0,0,0.12)) drop-shadow(0 3px 0.5px rgba(0,0,0,0.04))`, Roboto 500 14/20 `#000000`.
- Inactive chip: background rgba(120,120,128,0.1), radius 65, Roboto 400 14/20 `#000000`.
- [ASSUMPTION] Activating a chip moves the active style to it (chip widths unchanged); exactly one chip is active.
- Filtering (combined with FR-99): `All` → all items; `App` → tag `App` (items 1, 2); `Equipment` → tag `Equipment` (items 5, 6); `Promotions` → tag `Promotion` (items 3, 4). Chips are a tablist navigable by Left/Right arrows [ASSUMPTION].

#### FR-101: Notification items
User can read each notification's message, type tag and time. Realizes UJ-1.
**Source:** addendum Part B §11 (List, Data), §1.4, §12
**Consequences (testable):**
- List: 250 wide, height 563 at a 768 px viewport (fills the remaining panel height [ASSUMPTION for other heights]), `overflow-y:auto; overflow-x:clip`, column, gap 16.
- Notification item (a button): `border-bottom:1px solid #D9DCD6; padding:8px 0 16px`; gap 16 between message and footer; the last visible item has no border.
- Message: Roboto 500 16/24, `#1D1F1C`.
- Footer: `justify-content:space-between; align-items:center`. Tag: padding 2px 7px, radius 4, Roboto 600 11 / normal — `App` bg `#E6F2EA` text `#17703A`; `Promotion` bg `#FDF1DC` text `#8A5A00`; `Equipment` bg `#E3EEF8` text `#1F5B8F`. Timestamp: Roboto 400 12/18, `#666666`, right side.
- Items in file order, verbatim (message · tag · timestamp):
  1. `SureTrack app version 3.2 is available with offline field logging. Update now.` · `App` · `Feb 25 | 11:20 am`
  2. `Your farm profile is 80% complete. Add your land records.` · `App` · `Feb 25 | 11:20 am`
  3. `Get 15% off on drip irrigation kits this week. Offer ends Feb 28, 2026` · `Promotion` · `Feb 25 | 3:20 pm`
  4. `Free soil testing for your first field` ⏎ `when you book on Mar 5, 2026.` (hard line break kept) · `Promotion` · `Feb 24 | 3:20 am`
  5. `Tractor TR-02 is due for service in 3 days (engine hours: 248 of 250).` · `Equipment` · `Feb 25 | 8:40 am`
  6. `Your rental of Harvester HV-11 ends on Feb 27, 2026. Extend or schedule return.` · `Equipment` · `Feb 24 | 3:20 am` (below the fold at 768 px; reached by scrolling)
- Timestamps are verbatim strings, not re-sorted or reformatted.
- Accessible name of each item: `Unread: <message>` when unread.
- [ASSUMPTION] Activating a Notification item has no effect in this build (no destination designed; read state is not changed).

**Notes:**
- Q-P1: Panel presentation (scrim, shadow, top offset vs full height, animation) is UNKNOWN in Figma; brief assumes right-anchored, full height, no scrim.
- Q-P2: Badge "2" vs 6 unread items; chip `Promotions` vs tag `Promotion`; unordered timestamps — kept verbatim.
- Q-P3: Toggle OFF visual, chip active-state transfer, item click destination and empty filter result are not designed.

## 5. Non-Goals (Explicit)

- We are **not redesigning** anything. Where Figma looks inconsistent (three different reds, numbers that don't add up, mixed fonts), the build reproduces it as drawn. Fixes come from AGI design through a new Figma revision, never from developers.
- We are **not "fixing" the data.** The dummy readings copy Figma exactly, including contradictions (§10), so the screens match the Reference renders.
- We are **not building a real authentication system.** Sign-in checks the bundled `users.json`; there are no passwords on a server, no tokens and no SSO.
- We are **not integrating the SureTrack API** in this release. The JSON contracts in the addendum are shaped so an API can replace them later without changing any screen.
- We are **not designing missing states.** Hover, focus, error and loading visuals that Figma lacks get minimal **Design token**-based defaults (`[ASSUMPTION]`) until AGI design supplies them.

## 6. MVP Scope

### 6.1 In Scope

- **Login page** (`6026:60111`): full visual fidelity; validation, dummy sign-in and every error outcome in SCRUM-27 and SCRUM-28; Privacy Policy and Terms of Service links (SCRUM-31).
- **Forgot Password modal** (`6026:62907`): open, validate, submit and confirm, then close (SCRUM-29).
- **Dashboard** in all three **Dashboard states** (`6215:58878`, `6864:4514`, `6879:15603`), switchable with `?state=full|small|allgood`.
- **Header** with the Dashboard **Nav tab** active, bell and badge, and an avatar with Logout.
- **Notifications panel** (`8270:44312`) with the Unread Only toggle and **Filter chips**.
- **Dummy data:** `users.json`, `dashboard.full.json`, `dashboard.small.json`, `dashboard.allgood.json` and `notifications.json`.
- **Navigation targets:** routes for Equipment, Alerts, equipment detail and alert action screens, each rendering a "Coming soon" placeholder.
- **Automated Fidelity check:** the screenshot-comparison suite in §8.

### 6.2 Out of Scope for MVP

- **Tablet and phone layouts.** Only 1366 px is designed. SCRUM-27 AC2 and SCRUM-37 AC7 are deferred until AGI design supplies breakpoints. `[NOTE FOR PM]` The approved Jira stories ask for these, so tell AGI this is deferred, not dropped.
- **Reset Password page** (SCRUM-30). No Figma design exists.
- **Equipment, Alerts, Profile, hotspot and equipment-detail screens.** They exist in Figma but belong to later releases; this release renders placeholders only.
- **Profile menu entries** other than Logout (Figma `6026:52937`).
- **Chart hover tooltips** (SCRUM-39 AC3, SCRUM-40 AC2). Figma has no tooltip design, so they are deferred until designed.
- **Hidden Figma layers:** "Remember Me", the register link, the "Farm Test" switcher, the breadcrumb and back arrow, and the modal's Select field.
- **Real API, real authentication, analytics and i18n.**

## 7. Cross-Cutting Non-Functional Requirements

- **NFR-1. Reference viewport.** Every screen is designed for, and verified at, a 1366 px wide desktop viewport.
  - **Login page:** verified at 1366×768.
  - **Dashboard:** verified at 1366 px wide and the frame's full height (1052 / 860 / 856).
  - **Wider viewports:** content keeps Figma's left alignment and margins and must not stretch. `[ASSUMPTION]`
- **NFR-2. Fonts.**
  - **Roboto 400/500/600/700/800** (every weight the frames use) is self-hosted (WOFF2), with `font-display: block` so the first paint never shows a fallback font.
  - **SF Pro** text uses `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, sans-serif`. Apple's licence does not allow self-hosting SF Pro.
  - **Inter** is self-hosted for the single Inter text style.
- **NFR-3. Icons and images.**
  - **Icons:** every icon, the logo and the decorative vector shapes are the exported Figma SVGs, unmodified (`figma-assets/`). The one exception is the right chevron, rebuilt as an SVG.
  - **Rasters:** no raster icons. The only rasters are the silo photo, optimised to about 2,700 px wide (WebP with JPEG fallback, ≤ 600 KB), and the avatar.
- **NFR-4. Performance.** On a 2020-class laptop with a local build:
  - **Login page:** Largest Contentful Paint ≤ 1.5 s.
  - **Dashboard:** renders from JSON in ≤ 300 ms after navigation.
  - **Layout shift:** CLS = 0 on both screens, because fonts and images reserve their sizes. `[ASSUMPTION]`
- **NFR-5. Accessibility (beyond the pixels).** Accessibility must never change the at-rest look.
  - **Semantics:** links and buttons use the correct elements (Figma's `<div>` Submit becomes a real button).
  - **Labels:** inputs have labels; status changes use `aria-live`; the modal and panel trap focus and close on Esc; icons have text alternatives or `aria-hidden`.
  - **Keyboard:** everything clickable is reachable in the Jira tab orders.
- **NFR-6. Browser support.**
  - **Supported:** the latest two versions of Chrome, Edge, Safari and Firefox on desktop.
  - **Fidelity check baseline:** Chrome on macOS (NFR-2).
- **NFR-7. Data isolation.** The screens read data only through one data-access module (addendum §C), so replacing the JSON files with API calls changes no screen code.
- **NFR-8. Code health.** `npm run build` and `npm run lint` pass with zero errors, and there are no console errors or warnings in any Dashboard state.

## 8. Pixel-Fidelity Acceptance (Fidelity check)

A screen is accepted only when all four checks pass for every frame in the table.

| Screen | Figma frame | Reference render | Viewport |
|---|---|---|---|
| Login page | `6026:60111` | `figma-reference/login-6026-60111.png` | 1366×768 |
| Forgot Password modal (over the Login page) | `6026:62907` | `figma-reference/forgot-password-6026-62907.png` | 1366×768, modal region compared |
| Dashboard, Full | `6215:58878` | `figma-reference/dashboard-full-6215-58878.png` | 1366×1052 |
| Dashboard, Small | `6864:4514` | `figma-reference/dashboard-small-6864-4514.png` | 1366×860 |
| Dashboard, All-good | `6879:15603` | `figma-reference/dashboard-allgood-6879-15603.png` | 1366×856 |
| Notifications panel | `8270:44312` | `figma-reference/notifications-8270-44312.png` | 290×768 panel region |

1. **Automated pixel diff.** Playwright screenshots at device scale factor 1 in Chrome on macOS, compared with the Reference render re-exported from Figma at exactly 1× with no shadow overflow.
   - **Pass:** no more than 0.5% of pixels differ (per-pixel threshold 0.1, anti-aliasing ignored).
   - **Masked areas:** the silo photo and avatar rasters are masked from the diff.
   - `[ASSUMPTION — threshold to be agreed with AGI QA]`
2. **Measurement audit.** For every element listed in §4, the rendered bounding box (x, y, w, h) is within **±1 px** of the stated value. Colours, radii, borders and font properties match **exactly** (computed style).
3. **Copy audit.** Every string matches the §4 and addendum copy character for character, including `·` (U+00B7), `’` (U+2019) and the design's own typos.
4. **Chart audit.** Each Health segment, Runtime chart bar and Fill bar segment matches the pixel value computed by its formula in §4, within ±1 px.

**Sign-off.** QA attaches the diff report to the release. AGI design signs off the Fidelity check per screen, and the Manager approves the release in Markdown Studio.

## 9. Success Metrics

**Primary**
- **SM-1. Fidelity pass rate:** 6 of 6 frames in §8 pass all four checks on the first AGI design review. Validates every visual FR in §4.
- **SM-2. Behaviour pass rate:** 100% of the testable consequences in §4 pass in the QA test run, covering login outcomes, modal flows, navigation targets, Dashboard states and the Notifications panel.

**Secondary**
- **SM-3. Design-review rounds:** at most one round of AGI design feedback before sign-off. The baseline expectation for a loosely matched build is 3 or more rounds.
- **SM-4. API-readiness:** connecting the real API (a later release) needs changes only in the data-access module (NFR-7). Measured as zero diff to screen components in that later release.

**Counter-metrics (do not optimise)**
- **SM-C1. Don't "improve" the design to pass review faster.** Changing spacing, colours or readings to look better or "correct" would raise subjective approval while breaking SM-1. Any deviation needs a Figma change first. Counterbalances SM-3.
- **SM-C2. Don't over-fit the pixel diff.** Hard-coding absolute positions or rasterising text to hit 0.5% would pass SM-1 but break accessibility (NFR-5) and API-readiness (SM-4). Text stays live and layout stays data-driven. Counterbalances SM-1.

## 10. Open Questions

The build does not wait for these: it reproduces Figma as drawn and uses the stated `[ASSUMPTION]` until AGI answers.

1. **Contradictory readings (Full state).**
   - `7` Need attention vs 5 alert Health segments vs 4 Alert rows.
   - Offline `4` vs 1 offline segment.
   - `6` Tanks vs 17 in the Liquid legend.
   - 6 grain units vs 12 grain storages.
   - Fill bar fills (83% and 81%) vs their labels (79% and 83%).
2. **Contradictory readings (Small and All-good states).**
   - `79% full` vs `84% Fill`.
   - Stat tiles `7 / 86 h / 410 kWh` vs `2 of 3` fans running (Small).
   - `7 h 24 m` vs the Runtime chart's `Today 86h` (All-good).
   - The bell badge shows `2` in every state.
   - Notifications: 6 unread items vs badge `2`; timestamps out of order; `Promotions` chip vs `Promotion` tag.
3. **Style drift.**
   - **Colours:** three reds (`#C62828`, `#DC2626`, `#FF0000`); `#F3F4F6` vs `#F3F4F4`.
   - **Fonts:** KPI sub-counts are Regular in Full but Bold in Small and All-good; SF Pro, Roboto and Inter are mixed.
   - **Radius:** 4 px Login inputs vs 8 px modal input.
   - Is any of this intentional?
4. **Missing designs.**
   - **Fields and buttons:** focus, error, disabled and loading states.
   - **Hover states:** Nav tab, row and link hover.
   - **Login feedback:** login error and session-expired banners (SCRUM-28 AC8).
   - **Other gaps:** the forgot-password confirmation view, chart tooltips, and the Notifications panel's position, scrim and animation.
5. **Destinations.** URLs for Privacy Policy and Terms of Service; whether `SureTrack Coach (855) 293-5607` is a `tel:` link.
6. **Leftover Figma items.**
   - The invisible modal close ✕ (kept invisible).
   - The stray 9×13 px green triangle on the Login page (kept).
   - The alternate Dashboard frame `7833:12061` (not used; `6215:58878` is canonical).
   - The typo `Missing Fan Switched` (kept).
7. **SF Pro rendering on Windows.** The Fidelity check runs on macOS. Does AGI accept the Inter fallback that Windows users will see for SF Pro text?

## 11. Assumptions Index

*Every `[ASSUMPTION]` in this document, for explicit confirmation by AGI and the Manager. Location is the section or FR where it appears.*

- **2.3** — persona drafted from Jira SCRUM-27/37/38; confirm with AGI
- **2.3** — persona drafted from Jira SCRUM-29
- **2.3** — persona drafted from Figma frame 6879:15603
- **FR-4** — Inter is self-hosted at the weights needed for that string and for the SF Pro fallback (400, 500, 600, 700).
- **FR-9** — Keyboard focus is shown only for keyboard-initiated focus (`:focus-visible` semantics) on buttons and links, so mouse clicks do not leave rings that change the 
- **FR-9** — Focus indicator: a 2px (`border-width/md`) solid outline offset 2px; colour `#ffffff` on the green Login panel and `#006a36` (`brand/primary/500`) inside the Fo
- **FR-9** — Hover on links and buttons changes only the cursor to `pointer`; no colour, underline or background change.
- **FR-10** — threshold to be agreed with QA, carried from the brief
- **FR-10** — NFR-2: The silo photo asset is ≤ 600 KB.
- **4.2** — Behaviour comes from SCRUM-27, SCRUM-28 and SCRUM-31. Credentials are checked client-side against the Dummy accounts in `users.json` (addendum A); a successful 
- **FR-11** — With no Session, opening `/` redirects to `/login`.
- **FR-11** — Only same-origin, in-app paths are remembered; any other value is discarded and FR-25 falls back to `/dashboard`.
- **FR-17** — Roboto Regular 400, 16px / 24px (`Body/md/Regular`), colour `#ffffff`, caret `#ffffff`, horizontal padding 16px (`input/spacing/padding-x`).
- **FR-17** — Focus: the border colour and width stay as drawn; a 2px `#ffffff` outline offset 2px appears around the focused input.
- **FR-17** — Browser autofill does not change the input background or text colour (no yellow/blue autofill fill).
- **FR-18** — Hover changes only the cursor to `pointer` (FR-9).
- **FR-20** — placeholder URLs until the client supplies the real ones; see addendum A.
- **FR-20** — Each link is keyboard reachable and shows the FR-9 focus ring (2px `#ffffff`, offset 2px) on keyboard focus.
- **FR-21** — the at-rest Fidelity check is taken with focus removed
- **FR-22** — An inline message clears as soon as the user types into its field.
- **FR-22** — Inline message style: Roboto Regular 400, 12px / 16px, `#ffffff`, 4px (`space/2`) below the input; the input border changes to `#dc2626` (`component/input/borde
- **FR-22** — While an inline message shows, the elements below it move down by the message height; the column's top stays at y 127.039.
- **FR-23** — After a valid submit, the Login button keeps its size, background `#ffffff` and label `Login`, and shows a 16×16 spinner (stroke 2px `#004b27`) left of the labe
- **FR-23** — The dummy check resolves after the simulated latency defined in `users.json` (`policy.simulatedLatencyMs`) so the loading state is observable.
- **FR-24** — Username matching is case-insensitive after trimming; password matching is exact and case-sensitive.
- **FR-24** — account-status messages are revealed only after a correct password, so the page never discloses whether a username exists
- **FR-25** — per brief Solution
- **FR-27** — exact wording; SCRUM-28 gives only the content
- **FR-27** — {time}` is `lockedUntil` in the browser's local time, formatted `h:mm A` if today and `MMM D, YYYY h:mm A` otherwise (e.g. `3:45 PM`, `Jan 1, 2027 9:00 AM`).
- **FR-27** — Username stays; password stays as typed; the counter is not incremented.
- **FR-28** — The counter is not incremented.
- **FR-29** — link wording
- **FR-29** — The link inside the banner is Roboto Medium 500, underlined, in the banner text colour.
- **FR-30** — counted per browser, not per username
- **FR-30** — When the count reaches `policy.maxFailedAttempts` (5), a lockout starts for `policy.lockoutMinutes` (15) from that failure, and this fifth failure shows the too
- **FR-30** — wording
- **FR-30** — During the lockout the Login button is disabled (not focusable/activatable, exposed as disabled; visually opacity 0.5 and cursor `not-allowed` ), Enter does not
- **FR-31** — wording
- **FR-31** — wording
- **FR-31** — The timeout path is testable with the Dummy account `slow`, whose `simulatedLatencyMs` exceeds the timeout.
- **FR-32** — When shown, the banner sits below the `Login` title and above the `Username` label, 16px (`space/6`) below the title and 24px above the label, full column width
- **FR-32** — Banner style: background `#ffffff`, border 1px solid `#dc2626`, radius 8px, padding 8px 16px, text Roboto Regular 400, 14px / 20px, `#111827`.
- **FR-32** — Only one banner shows at a time; a new submit clears it before the next result.
- **FR-34** — 480 minutes; see addendum A
- **FR-35** — timing
- **FR-35** — NFR-11: The Login page reaches a stable, fully rendered state (fonts and background loaded) within 2 s on a desktop broadband connection.
- **4.3** — Behaviour comes from SCRUM-29. Submit stays disabled until the email is well formed; submitting shows a loading state and then the same confirmation for any ema
- **FR-36** — position UNKNOWN in Figma
- **FR-36** — backdrop UNKNOWN in Figma
- **FR-36** — animation UNKNOWN
- **FR-36** — Each time the modal opens it starts empty: Email blank, no error, no confirmation.
- **FR-39** — The control has the accessible name `Close` and is in the modal's tab order; on keyboard focus only, it shows at opacity 1 with the FR-9 focus ring (2px `#006a3
- **FR-41** — Typed text: Roboto Regular 400, 16px / 24px, `#111827` (`component/input/text/default`).
- **FR-41** — Focus: border stays 1px `#d1d5db`; a 2px `#006a36` outline offset 2px appears.
- **FR-42** — text TBC in SCRUM-29
- **FR-42** — Tooltip style: background `#111827`, text Roboto Regular 400, 12px / 16px, `#ffffff`, padding 8px 12px, radius 8px, max width 240px, positioned above the icon.
- **FR-42** — The tooltip hides on pointer leave or blur; the icon is keyboard focusable, has the accessible name `Email help`  and the tooltip text is its accessible descrip
- **FR-43** — satisfies SCRUM-29 AC7 on phones without changing the at-rest look
- **FR-45** — An email is valid when, after trimming spaces, it has exactly one `@`, a non-empty local part without spaces, and a domain containing at least one `.` with a fi
- **FR-45** — Error style: text Roboto Regular 400, 12px / 16px, `#dc2626`, 4px below the field; field border 1px `#dc2626` (`component/input/border/error`); the body and mod
- **FR-46** — required so the at-rest Fidelity check passes
- **FR-46** — Pressing Enter in a valid Email field submits.
- **FR-47** — After Submit, Submit keeps its size and colour and shows a 16×16 spinner (stroke 2px `#ffffff`) left of the label with an 8px gap; further Submit activations ar
- **FR-47** — In the confirmation state the intro copy and Email field are replaced by the confirmation text (Roboto Regular 400, 14px / 22px, `#374151`); the help text stays
- **FR-48** — If Esc is pressed while the tooltip (FR-42) is visible, the modal closes.
- **FR-49** — On open, focus moves to the Email field.
- **FR-49** — order follows document order
- **FR-49** — In the confirmation state the order is Close X → SureTrack Coach number → Cancel, and focus moves to the confirmation text container or Cancel on entry.
- **4.4** — styling per brief fidelity rule 5
- **FR-53** — Figma gives no label
- **FR-54** — The avatar is a button; accessible name `Account menu` .
- **FR-54** — menu presentation — a white panel (`#FFFFFF`, 1px `#D1D5DB` border, radius 12, card drop-shadow `0 2px 2px rgba(39,39,39,0.1)`, padding 20) anchored below the avatar, right-aligned to x 1342; entry text Roboto 500 16/24 
- **FR-54** — Esc or a second avatar activation closes the menu and returns focus to the avatar .
- **FR-56** — /` navigates to `/dashboard` when a Session exists and to `/login` otherwise .
- **FR-56** — client-side dummy Session per brief Scope
- **FR-57** — in brief
- **FR-57** — The following routes render the placeholder (route shapes are ): `/equipment`, `/equipment?type=<bins|piles|flats|tanks|dryers>`, `/equipment?status=<online|off
- **FR-57** — copy `Coming soon`, Roboto 700 16 `#111827`, centred in a `#F4F5F6` radius-12 block of 1318 px width, 24 px below the title strip
- **FR-58** — Keyboard focus: 2px solid `#006A36` outline, offset 2px, shown only for keyboard focus (`:focus-visible`); never visible in at-rest screenshots.
- **FR-58** — Hover on an Equipment row or Alert row: background `#F0FFF8` (`table/row/bg-selected`); hover on View All / Action link text: underline. No layout shift (no siz
- **FR-58** — Q-S3 (resolved): the menu entry label is Figma's `Logout`; the other profile-menu entries are out of scope. Menu presentation remains  until design confirms.
- **4.5** — Description:** Directly below the page title, a single white strip summarises the account in five KPI tiles: equipment needing attention (with critical count), 
- **FR-64** — no Jira target given
- **FR-76** — At most 4 Alert rows are rendered; rows appear in the file's order (the data is already Critical before Warning, newest first). No client re-sort .
- **4.9** — style
- **FR-85** — override field; see Notes Q-G1
- **FR-86** — On pointer hover (or keyboard focus) of a coloured segment, a tooltip shows `<name> · <amountLabel> · <share>% of capacity`, where share = round(amountBu / capa
- **FR-86** — Tooltip style: background `#111827`, text `#FFFFFF` Roboto 400 12/18, padding 4px 8px, radius 6, no arrow, centred 4 px above the segment; not present in at-res
- **4.10** — style
- **FR-90** — Hover/focus tooltip on a segment: same  format and style as FR-86, `<name> · <amountLabel> · <share>% of capacity`, share = round(amountGal / capacityGal × 100)
- **4.11** — Description:** The Dashboard is driven entirely by one local JSON file per Dashboard state — `dashboard.full.json`, `dashboard.small.json`, `dashboard.allgood.j
- **FR-93** — Source:** brief Solution table and §The Solution (`?state=`),  default from `users.json
- **FR-93** — per brief
- **FR-93** — Any other `?state` value falls back to the same default .
- **FR-95** — While loading, the KPI strip shell (1318×90, FR-59) and each card shell (FR-65) render at the final size for the requested Dashboard state, with titles hidden a
- **FR-96** — The KPI strip and each card show, centred in their shell, the text `Couldn’t load this section.` (Roboto 400 14/20.3 `#4B5563`) and a `Retry` button styled as a
- **4.12** — per brief
- **FR-97** — presentation; Figma exposes no overlay data
- **FR-97** — Opening does not change or dim the Dashboard; page behind stays scrollable .
- **FR-97** — No open/close animation .
- **FR-97** — Close button: 24×24 button with `n_close.svg` (`6905e.svg`), colour `#1E2A2C`, accessible name `Close notifications` . Activating it, or pressing Esc while the 
- **FR-97** — On open, focus moves to the close button . Clicking outside the panel does not close it.
- **FR-97** — Each opening starts with Unread Only ON and Filter chip `All` active .
- **FR-99** — OFF: same 32×20 shape with track `#CFD0D0` (`brand/gray/300`) and white knob on the left (not designed).
- **FR-100** — Activating a chip moves the active style to it (chip widths unchanged); exactly one chip is active.
- **FR-100** — Filtering (combined with FR-99): `All` → all items; `App` → tag `App` (items 1, 2); `Equipment` → tag `Equipment` (items 5, 6); `Promotions` → tag `Promotion` (
- **FR-101** — for other heights
- **FR-101** — Activating a Notification item has no effect in this build (no destination designed; read state is not changed).
- **5** — We are **not designing missing states.** Hover, focus, error and loading visuals that Figma lacks get minimal **Design token**-based defaults (``) until AGI des
- **7** — Wider viewports:** content keeps Figma's left alignment and margins and must not stretch.
- **7** — Layout shift:** CLS = 0 on both screens, because fonts and images reserve their sizes.
- **8** — threshold to be agreed with AGI QA
- **10** — The build does not wait for these: it reproduces Figma as drawn and uses the stated `` until AGI answers.
- **12** — | Open questions in §10 | AGI design | Answers or Figma revision; until then, the `` defaults stand |

## 12. Stakeholders and Approvals

| Stage | Who | Approves |
|---|---|---|
| PRD (this document) | Manager (ACL Digital) | In Markdown Studio, before UX, architecture or epics start |
| Open questions in §10 | AGI design | Answers or Figma revision; until then, the `[ASSUMPTION]` defaults stand |
| Fidelity check (§8) | ACL QA, then AGI design | Per-screen diff report and visual sign-off |
| Release | Manager (ACL Digital), then AGI product owner | Final acceptance |

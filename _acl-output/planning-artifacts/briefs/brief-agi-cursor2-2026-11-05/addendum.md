---
title: "Addendum: AGI SureTrack Farm Web — Figma Design Specification (Login & Dashboard)"
project_type: greenfield
status: In Review
created: "2026-11-05"
updated: "2026-11-05"
---

# Addendum: Figma Design Specification — Login & Dashboard

This addendum holds the build-level detail behind `brief.md`. Every value below was read from the Figma file
`js9ue0LTQDFIxAsxEuM8Wx` (page "🎨 Demo", node 6026:48590) with the Figma MCP tools on 2026-11-05. Nothing was changed in Figma.

- **Assets** (exported 2026-11-05; Figma's own asset links expire after ~7 days): `figma-assets/login/`, `figma-assets/dashboard/`.
- **Reference renders** (the pixel-comparison baselines, 1366 px wide): `figma-reference/`.
- **Rule of precedence** (see brief, "Fidelity rules"): Figma values win for anything visible. The approved Jira ACs define behaviour Figma does not draw. Where they conflict, Figma wins for appearance and the conflict is logged in brief §Open Questions for Design.

**Contents.** Section numbers restart in each part; a bare § reference points to a section in the same part.

- **Part A — Login & Forgot Password:** 1 Design tokens · 2 Login frame layout · 3 Forgot Password modal · 4 Typography · 5 Assets · 6 States, interactions and prototype flow · 7 Copy deck · 8 Open questions and inconsistencies
- **Part B — Dashboard & Notifications:** 1 Design tokens · 2 Page shell · 3 KPI strip · 4 Card shell · 5 Equipment card · 6 Recent Alerts card · 7 Fan activity card · 8 Grain On Hand card · 9 Liquid On Hand card · 10 Differences between the three states · 11 Notifications side panel · 12 Typography summary · 13 Assets · 14 Data readings · 15 Interactions and prototype · 16 Inconsistencies and open questions

---

## Part A — Login & Forgot Password

- Source: Figma file `js9ue0LTQDFIxAsxEuM8Wx`, read on 2026-11-05 (read-only).
- Nodes: Login frame `6026:60111` (1366×768), Forgot Password modal `6026:62907` (600×374).
- Tools used: `get_design_context` (on 60111, 62907, 60153, 62915), `get_variable_defs` (on 60111 and 62907), `get_screenshot` (on the image layers), and a page-level `get_metadata` dump. The assets were downloaded to `figma-assets/login/`.
- All coordinates are in px and relative to the top-left of the frame in question, unless stated otherwise.
- Values marked "derived" were calculated from Figma's percentage-based crop values, which the tool rounds to 2 decimals. Treat them as accurate to about ±0.1 px.

---

### 1. Design tokens (Figma variables, from `get_variable_defs`)

#### Login frame (6026:60111)

| Variable | Value | Used by |
|---|---|---|
| `primitives/color/base/white` | `#ffffff` | Login button background, legal text color |
| `brand/primary/200` | `#a4dfbb` | Username/Password input border |
| `brand/primary/700` | `#004b27` | Login button label |
| `primitives/color/alpha-white/50` | `#ffffff80` (rgba(255,255,255,0.5)) | the " \| " separator in the legal text |
| `weight/regular` | `400` | legal text |

#### Forgot Password modal (6026:62907)

| Variable | Value | Used by |
|---|---|---|
| `semantic/color/bg/white` | `#ffffff` | modal surface |
| `semantic/color/bg/primary` | `#ffffff` | email field background |
| `semantic/color/text/primary` | `#111827` | modal title |
| `semantic/color/text/secondary` | `#374151` | body copy, label, help text |
| `semantic/color/text/placeholder` | `#6b7280` | email placeholder |
| `semantic/color/fg/quaternary` | `#6b7280` | (defined; close-icon stroke uses the same hex) |
| `semantic/color/text/white` | `#ffffff` | Submit label |
| `semantic/color/border/primary` | `#d1d5db` | dividers |
| `table/row/border` | `#d1d5db` | email field border (an odd token name for an input border) |
| `component/input/text/default` | `#111827` | Cancel label |
| `component/badge/text/error` | `#dc2626` | required asterisk (the code hardcodes `#dc2626`) |
| `brand/primary/500` | `#006a36` | Submit background |
| `brand/gray/50` | `#fbfbfb` | modal body background |
| `space/0` | 0 | — |
| `space/2` | 4 | input label→field gap |
| `space/4` | 8 | header gap, field gap |
| `space/5` | 12 | footer button gap |
| `space/6` | 16 | body gap, footer vertical padding |
| `space/7` | 20 | header vertical padding |
| `space/8` | 24 | header/body/footer horizontal padding, body padding |
| `input/spacing/padding-x` | 16 | email field horizontal padding |
| `sm` / `md` / `xl` / `lg` | 8 / 10 / 16 / 8 | button gap / button padding-y / button padding-x / button radius |
| `radius/none` | 0 | — |
| `radius/md` | 8 | Cancel radius |
| `brand/radius/md` | 8 | email field radius |
| `radius/xl` | 16 | modal radius |
| `border-width/hairline` | 1 | email field border |
| `border-width/sm` | 1.5 | (defined; matches the login-input border and the icon strokes) |
| `border-width/md` | 2 | (defined; not seen applied — possibly the focus border, UNKNOWN) |
| `body/sm` | 14 | body text size |
| `label/md` | 12 | label size |
| `line-height/body-sm/content` | 22 | body text line-height |
| `line-height/label/md` | 16 | label line-height |
| `line-height/body/md` | 24 | placeholder line-height |
| `line-height/heading/md` | 24 | title line-height |
| `Size/Text - sm` / `Line Height/Text - sm` | 14 / 20 | button labels |
| `weight/regular` | 400 | — |

#### Text styles (Figma named styles)

| Style | Definition |
|---|---|
| `Heading/md/Semibold` | Roboto SemiBold 600, 20px, line-height 24, letter-spacing −1% (the code emits `-0.2px`) |
| `Label/md/Semibold` | Roboto SemiBold 600, 12px, line-height 16, letter-spacing 0 |
| `Body/md/Regular` | Roboto Regular 400, 16px, line-height 24, letter-spacing 0 |

#### Effect style

| Style | Definition | CSS |
|---|---|---|
| `Shadow/Lg` | DROP_SHADOW, color `#27272726`, offset (0, 12), radius 20, spread −2 | `box-shadow: 0 12px 20px -2px rgba(39,39,39,0.15);` |

Note: the generated code emitted `drop-shadow-[0px_12px_10px_rgba(39,39,39,0.15)]`, which is a filter version that halves the blur and drops the spread. Use the `box-shadow` above.

#### Hard-coded colors (no variable attached)

| Hex | Where |
|---|---|
| `#009926` → `#006633` | green panel linear gradient, at fill-opacity 0.9 |
| `#02A45B` @ 40% | right-edge "Subtract" overlay (6026:60119), almost entirely off-canvas |
| `#ffffff` | Login title, labels, Forgot link (Tailwind `text-white`, no token) |
| `#6B7280` | close "X" stroke |
| `#9CA3AF` | "?" help-icon stroke |

---

### 2. Login frame — layout (6026:60111, 1366×768, frame bg `#ffffff`, clips content)

Layer stack, bottom to top (from the metadata order, which matches the generated code order):

| # | Node | Name | Visible? | Notes |
|---|---|---|---|---|
| 1 | 6026:60112 / 60113 | BG Image / "Transformation 1" | **No** (fully covered) | PNG 1400×988 RGBA (`fdfae.png`). Rect 0,0 1366×768; image fill crop: w 114.38%, h 116.28%, left −14.38%, top −5.55% |
| 2 | 6026:60114 | `484584386_…_n 1` | **No** (covered) | JPEG 2048×922 (`aa532.png`). Rect x −471, y −19, 2435×1096, object-cover |
| 3 | 6026:60115 | `swiss-pasta-emea 1` | **No** (covered) | Green barley-field photo, 2 stacked fills: JPEG 2048×1153 (`951ae.png`, crop w130.5% h130.68% left 0.01% top −2.68%) and JPEG 4096×2731 (`f4d3a.png`, object-cover). Rect 0,0 1366×768 |
| 4 | 6026:60116 | `barley-young-crop-…-0b 1` | **YES — the main visible photo (right side)** | see 2.1 |
| 5 | 6026:60117 | `barley-young-crop-…-0b 3` | **YES — under the green panel only** (x 0–513) | see 2.1 |
| — | 6026:60118 | `barley-…-0b 2` | hidden (`hidden="true"`) | ignore |
| 6 | 6026:60119 | Subtract (right) | 9×13 px sliver at the bottom-right corner | see 2.3 |
| 7 | 6026:60121 | Group 1000002881 (692×768) | YES | green panel and form |

Layers 1–3 sit completely under layers 4 and 5. Both of those are opaque JPEGs and together cover x −634…1957 and y ≤ −249…≥ 798. The tool output shows no opacity or blend mode on any of them, so they render at 100% and layers 1–3 are never seen. **Do not ship them.**

#### 2.1 Visible background photo (silos)
Both visible layers use the **same raster**: `981df.png`, which is actually a JPEG, 4096×2732. It shows a steel grain-silo photo, despite the "barley" layer name. Both layers are **mirrored horizontally**. In Figma terms they are rotated 180° and flipped vertically (`-scale-y-100 rotate-180`), which equals `transform: scaleX(-1)`.

| Layer | Container (clip box) in frame coords | Image fill inside the container (pre-flip %) | Resulting image rect in frame coords (derived, after the flip) |
|---|---|---|---|
| 60116 "…0b 1" | x −157, y −89, w 1651, h 1101 (metadata reports the flipped origin x=1494) | w 95.16%, h 95.21%, left −28.07%, top −14.57% | x **386.34**, y **−249.42**, w **1571.09**, h **1048.26** (right edge 1957.44, bottom 798.85) |
| 60117 "…0b 3" | x −1197, y −117, w 1710, h 1140 (metadata x=513) → visible clip x 0…513 | same % | x −634.24, y −283.10, w 1627.24, h 1085.39. **Clipped by its container at x = 513** |

- Layer 60116 leaves frame x 0…386 empty, which is transparent in that layer. Layer 60117 fills x 0…513 on top of it, so there is no gap.
- Region x 0…386: only layer 60117 shows (under the 90% green panel).
- Region x 386…513: layer 60117 sits above 60116. This region is entirely under the green panel.
- Region x > 513: layer 60116.
- The image aspect is 1.4993, and the placed rect is 1571.09/1048.26 = 1.4988, so there is no distortion.
- **Build recommendation:** for pixel-perfection, export the composited background (layers 4 and 5, inside the frame clip) as a single 1366×768 asset at @2x (WebP or JPEG). Alternatively, rebuild it with two absolutely positioned `<img>` elements using the numbers above and `transform: scaleX(-1)`.
- The 17.6 MB source JPEG must be resized and compressed before it ships.
- The only part of layer 60117 that shows through is under the panel, at 10% (the panel is 90% opaque). The photo detail under the panel is barely visible in the render.

#### 2.2 Green angled panel — 6026:60122 "Subtract" (boolean of vector 6026:60123 "Rectangle 3332")
- Bounds: x 0, y 0, 692×768.
- Polygon (exact, taken from the exported SVG path `M519.958 768H0V0H692L519.958 768Z`): `(0,0) → (692,0) → (519.958,768) → (0,768)`.
- CSS: `clip-path: polygon(0 0, 692px 0, 519.958px 768px, 0 768px);`
- The angled edge runs from top x = 692 to bottom x = 519.958, a horizontal run of 172.042 px over 768 px of height. It is **12.6265° from vertical**, leaning left toward the bottom.
- Fill: `linear-gradient`, with SVG coordinates `x1=636.115 y1=768` (stop 0 `#009926`) → `x2=305.824 y2=260.485` (stop 1 `#006633`), `gradientUnits=userSpaceOnUse`, and `fill-opacity: 0.9`.
  - CSS equivalent (derived): `linear-gradient(326.94deg, #009926 2.99%, #006633 62.28%)` on a 692×768 box, at opacity 0.9. Everything past 62.28% is solid `#006633`.
  - The safest option is to inline or ship the exported SVG `f4626.svg`.
- The group 6026:60121 also contains the form column.

#### 2.3 Right overlay — 6026:60119 "Subtract"
- Bounds: x 1356.833, y −55, 1824.10×823. Path `M1824.1 823H0L595.167 0H1824.1V823Z`, fill `#02A45B` at opacity 0.4 (a mirrored, mostly off-canvas parallelogram).
- Inside the 1366 frame, only a triangle is visible: (1356.83,768) → (1366,768) → (1366,755.32), i.e. **9.17 × 12.68 px** in the bottom-right corner.
- This looks like a leftover. See the open questions.

#### 2.4 Form column — 6026:60124 "Frame 1984077732"
- Auto-layout, vertical, gap **32**, items centered.
- x **90**, y **127.039** (vertically centered: (768 − 513.922)/2), w **392.4285**, h **513.922**.

Element table, absolute in frame coords:

| Node | Element | x | y | w | h | Styles |
|---|---|---|---|---|---|---|
| 6026:60125 / 60126 | inner stacks | 90 | 127.04 | 392.43 | 417.92 | 60125: vertical, gap 24. 60126: vertical, gap **40**, items start |
| 6026:60127 | **Logo** "Group 624577" (vector) | 90 | 127.04 | 392.4305 | 24 | white fill (`#ffffff`), SVG `e34ba.svg`. See Assets |
| 6026:60133 / 60134 | wrappers | 90 | 191.04 | 392.43 | 353.92 | 60134: vertical, gap 33 (it has only one visible child, so the gap has no effect) |
| 6026:60135 | "capella icon 1" | — | — | 152 | 152 | **hidden**, ignore |
| 6026:60138 | Title "Login" | 90 | 191.04 | 67.32 | 30 | Roboto SemiBold 600, 20px / 30px, `#ffffff` |
| 6026:60140 | Username field group | 90 | 253.04 | 392.43 | 66 | vertical, gap **6** |
| 6026:60141 | label "Username" | 90 | 253.04 | 64 | 20 | Roboto Regular 400, 14px / 20px, `#ffffff`, nowrap |
| 6026:60142 | Username input (Rectangle 321) | 90 | 279.04 | 392.43 | 40 | **no fill (transparent)**, border **1.5px solid `#a4dfbb`** (`brand/primary/200`), radius **4px**. The design has no placeholder, padding or text style; see open questions |
| 6026:60143 | Password field group | 90 | 343.04 | 392.43 | 66 | vertical, gap 6. The 24 px gap below the Username input comes from a top offset of 90 (60140 top + 90) |
| 6026:60144 | label "Password" (layer is misnamed "Username") | 90 | 343.04 | 62 | 20 | same as the Username label |
| 6026:60145 | Password input | 90 | 369.04 | 392.43 | 40 | same as the Username input |
| 6026:60153 | **Login button** (instance "Button") | 90 | 450.04 | 392 (99.89%) | 40 | bg `#ffffff`, radius **8px**, padding-x 16, gap 8, content centered. 41 px gap below the Password input |
| I6026:60153;23:2941 | button label "Login" | centered | | | 24 | Roboto SemiBold 600, 16px / 24px, `#004b27` |
| 6026:60146 / 60147 | **"Forgot Password or Username?"** (layer "Forgot Password?") | **199** (left offset 109 = 27.78%) | **524.96** | 197 (50.2%) | 20 | Roboto Medium 500, 14px / 20px, `#ffffff`, underline (solid, thickness and offset from-font, skip-ink none), **left-aligned** inside a 197 box. Exported as a `<button>` |
| 6026:60148 | "Remember Me" + tick-square | — | — | — | — | **hidden**, ignore |
| 6026:60154 | "Don't have an account yet? Click here to register." | — | — | 194 | 48 | **hidden**, ignore |
| 6026:60155 | **Legal text** | **126.21** (offset 36.214) | **576.96** | 320 | 64 | center-aligned. Line 1 "By clicking login, you hereby agree to our " then a hard line break. Line 2 "Privacy Policy" (underlined) " | " "Terms of Service" (underlined). Roboto 14px / 24px. See Typography |

Vertical rhythm: logo 24, gap 40, title 30, 32 → username label 20, 6, input 40, 24 → password label 20, 6, input 40, 41 → button 40, 34.92 → forgot link 20, gap 32 → legal text 64.

---

### 3. Forgot Password modal — 6026:62907 (600×374)

- Container: bg `#ffffff`, radius **16px**, shadow `Shadow/Lg` (`0 12px 20px -2px rgba(39,39,39,0.15)`).
- Auto-layout vertical, gap 0, padding 0. The children span the full width.
- The modal sits on the canvas as a **standalone frame** at page coordinates (−95028, 87), below the Login frame. **There is no frame showing it over the Login page and no backdrop/scrim defined.**

| Node | Element | x | y | w | h | Styles |
|---|---|---|---|---|---|---|
| 6026:62908 | Header | 0 | 0 | 600 | 72 | horizontal, gap 8, padding 20 24, items center, overflow clip |
| 6026:62909 | Title | 24 | 24 | 532 | 24 | `Heading/md/Semibold`: Roboto 600, 20px / 24px, letter-spacing −0.2px (−1%), `#111827`, flex 1 |
| 6026:62910 / 62911 | Close button / X vector | 564 | 20 | 12 | 32 | X glyph 12×12 at y +10 (i.e. 30 in the modal), stroke `#6B7280` 1.5 px, round caps. **The group has opacity 0, so the X is INVISIBLE in the design** |
| 6026:62912 | Divider | 0 | 72 | 600 | 1 | `#d1d5db` |
| 6026:62913 | Body | 0 | 73 | 600 | 228 | bg `#fbfbfb`, padding 24, vertical gap 16, overflow clip |
| 6026:62914 | Body copy | 24 | 97 (body +24) | 392 | 44 | Roboto Regular 400, 14px / 22px, `#374151`. Wraps to 2 lines at the fixed 392 width |
| 6026:62915 | Input (instance) | 24 | 157 (body +84) | 320 | 60 | vertical, gap 4 |
| I…;4324:43401 | Label row | 24 | 157 | auto | 16 | horizontal, gap 4, items center |
| I…;215:1978 | "Email " + "*" | | | | 16 | `Label/md/Semibold`: Roboto 600, 12px / 16px, `#374151`; the asterisk is `#dc2626` |
| I…;4324:43402 | Help icon ("Label Icon") | | | 16 | 16 | The SVG is 35.001×35.001, placed at −8.5, −8.5 inside the 16 box (overflow visible). The circle has r 7.5 and center (9,9) relative to the 16 box, stroke `#9CA3AF` 1.5, round caps |
| I…;215:1979 | Field | 24 | 177 | 320 | 40 | bg `#ffffff`, border 1px `#d1d5db`, radius 8, padding 0 16, gap 8, items center, overflow clip |
| I…;215:1981 | Placeholder | | | flex 1 | 24 | `Body/md/Regular`: Roboto 400, 16px / 24px, `#6b7280` |
| 6026:62916 | Help text | 24 | 233 (body +160) | 552 | 44 | line 1 "Need additional help?" Roboto Regular 14px / 22px `#374151`, then a line break; line 2 "SureTrack Coach (855) 293-5607" Roboto **Medium 500** 14px / 22px `#374151` |
| 6026:62917 | Select (instance) | 24 | body +220 | 320 | 60 | **hidden**, ignore |
| 6026:62918 | Divider | 0 | 301 | 600 | 1 | `#d1d5db` |
| 6026:62919 | Footer | 0 | 302 | 600 | 72 | horizontal, justify end, items center, gap 12, padding 16 24, overflow clip |
| 6026:62920 | Cancel button | 364 | 318 (footer +16) | 100 | 40 | transparent bg, padding 10 16, gap 8, radius 8. Label Roboto SemiBold 600, 14px / 20px, `#111827` |
| 6026:62921 | Submit button | 476 | 318 | 100 | 40 | bg `#006a36`, padding 10 16, gap 8, radius 8. Label Roboto SemiBold 600, 14px / 20px, `#ffffff` |

Height check: 72 + 1 + 228 (24+44+16+60+16+44+24) + 1 + 72 = 374. ✓

---

### 4. Typography

The only font family is **Roboto**. The code also emits `font-variation-settings: "wdth" 100`, which is the default width, so static Roboto at weights 400, 500 and 600 is fine. Roboto **SemiBold 600** is needed, so load a Roboto build that includes 600 (Google Fonts' variable Roboto does).

The legal-text root `<p>` declares `Inter Regular` at 0px, but every span overrides it with Roboto, so **Inter is not actually rendered**.

| Usage | Node | Family / weight | Size / line-height | Letter-spacing | Color | Decoration / transform |
|---|---|---|---|---|---|---|
| Login title | 6026:60138 | Roboto SemiBold 600 | 20 / 30 | 0 | `#ffffff` | none |
| Field labels (Username, Password) | 60141, 60144 | Roboto Regular 400 | 14 / 20 | 0 | `#ffffff` | none |
| Login input text | — | **UNKNOWN** (no text node in the inputs) | — | — | — | — |
| Login button | I6026:60153;23:2941 | Roboto SemiBold 600 | 16 / 24 | 0 | `#004b27` | none |
| Forgot link | 6026:60147 | Roboto Medium 500 | 14 / 20 | 0 | `#ffffff` | underline, solid, from-font thickness and offset, skip-ink none |
| Legal sentence | 6026:60155 span 1 | Roboto Regular 400 | 14 / 24 | 0 | `#ffffff` | center-aligned |
| Privacy Policy / Terms of Service | 6026:60155 | Roboto Medium 500 | 14 / 24 | 0 | `#ffffff` | underline (as above) |
| Separator " \| " | 6026:60155 | Roboto Regular 400 | 14 / 24 | 0 | `rgba(255,255,255,0.5)` | none. The space before it is Regular and the space after it is Medium |
| Modal title | 6026:62909 | Roboto SemiBold 600 | 20 / 24 | −0.2px (−1%) | `#111827` | none |
| Modal body copy | 6026:62914 | Roboto Regular 400 | 14 / 22 | 0 | `#374151` | none |
| Modal label "Email" | I6026:62915;215:1978 | Roboto SemiBold 600 | 12 / 16 | 0 | `#374151`, asterisk `#dc2626` | none |
| Modal placeholder | I6026:62915;215:1981 | Roboto Regular 400 | 16 / 24 | 0 | `#6b7280` | none |
| Help line 1 | 6026:62916 | Roboto Regular 400 | 14 / 22 | 0 | `#374151` | none |
| Help line 2 (phone) | 6026:62916 | Roboto Medium 500 | 14 / 22 | 0 | `#374151` | none (not underlined, not a link in the design) |
| Cancel | I6026:62920;2331:4175 | Roboto SemiBold 600 | 14 / 20 | 0 | `#111827` | none |
| Submit | I6026:62921;2331:3891 | Roboto SemiBold 600 | 14 / 20 | 0 | `#ffffff` | none |

No text uses text-transform.

---

### 5. Assets

Downloaded copies are in `figma-assets/login/`.

The URLs below are temporary (they expire about 7 days after 2026-11-05):
- Login assets: `https://www.figma.com/api/mcp/asset/7b2b67fe-7d42-4cea-af5d-86e710f92547/<file>`
- Modal assets: `https://www.figma.com/api/mcp/asset/d1094981-1a58-49f3-9544-f67f09ea9546/<file>`

#### Raster images

| File | Real format and size | Layer(s) | Used? | Recommendation |
|---|---|---|---|---|
| `981df.png` | JPEG 4096×2732, 17.6 MB | 6026:60116, 6026:60117 (silo photo) | **YES** | Export the composited 1366×768 background at @2x as WebP or JPEG (about 2732×1536), or resize the source to about 2000 px wide for the two-layer rebuild. Apply mirroring with `scaleX(-1)` |
| `f4d3a.png` | JPEG 4096×2731 | 6026:60115 (fill 2) | no (occluded) | do not ship |
| `951ae.png` | JPEG 2048×1153 | 6026:60115 (fill 1) | no (occluded) | do not ship |
| `aa532.png` | JPEG 2048×922 | 6026:60114 | no (occluded) | do not ship |
| `fdfae.png` | PNG 1400×988 RGBA | 6026:60113 | no (occluded) | do not ship |

#### Vectors (export and use as SVG)

| File | Node | Size | Colors | Notes |
|---|---|---|---|---|
| `e34ba.svg` | 6026:60127 "Group 624577" (vectors 60128–60132) | 392.429×24 | all `#ffffff` | **AGI SureTrack Farm logo**, made of 3 parts: "AGI" letterforms (64.07×24), a striped field/flag mark (28.5×22.93 plus 16.21×2.68), and the "SURETRACKFARM" wordmark (295.13×23.36). Use the SVG as-is; do not redraw it |
| `f4626.svg` | 6026:60122 "Subtract" | 692×768 | gradient `#009926`→`#006633`, fill-opacity 0.9 | green angled panel (or rebuild it in CSS per 2.2) |
| `321e0.svg` | 6026:60119 "Subtract" | 1824.1×823 | `#02A45B` at 40% | right overlay; only a 9×13 px corner is visible (see the open questions) |
| `0d4fd.svg` | 6026:62910 "Close Button" | 32×32 viewBox (node box 12×32) | stroke `#6B7280` 1.5, round caps | the X glyph; **its group opacity is 0** |
| `16936.svg` | I6026:62915;4324:43402;5759:52232 | 35.001×35.001 (shown in a 16×16 slot at offset −8.5) | stroke `#9CA3AF` 1.5, round caps | "?" help icon (a circle and question mark, Heroicons/Untitled-style outline) |

---

### 6. States, interactions and prototype flow

- **Prototype data: NOT available.** The Figma MCP tools in use (`get_design_context`, `get_metadata`, `get_variable_defs`, `get_screenshot`) do not expose `reactions`, transitions, overlay settings or flow starting points. No interaction or flow data was found in any output.
  - Unconfirmed: "Forgot Password or Username?" opens the Forgot Password modal.
  - Unconfirmed: Cancel or the X closes the modal.
  - Unconfirmed: Submit sends a reset link.
  - Unconfirmed: Login navigates to the Dashboard. There is a "Dashboard" section label at page y=792, below the modal.
  - The overlay position, backdrop color and animation are all **UNKNOWN**.
- **Semantic hints from the generated code:** the Login button is emitted as an `<a>` (cursor pointer), the Forgot link as a `<button>`, and Cancel as a `<button>`. Submit is a `<div>`, which is inconsistent.
- **Input states (Login page):** only the default (empty) state is drawn. Focus, filled, error and disabled states are **not in the design**. The token `border-width/md = 2` exists and may hint at a focus border, but this is UNKNOWN.
- **Button states:** only the default state exists. Hover, pressed, disabled and loading are **not in the design**. The variant properties of the Button and Input component instances are not exposed by the tools.
- **Link hover:** not defined.
- **Modal Email input:** only the default state with a placeholder is drawn. The required asterisk implies validation, but no error state or message is designed.
- **Help "?" icon:** a tooltip is implied, but no tooltip content is designed (UNKNOWN).
- **Hidden layers that hint at future features:**
  - "Remember Me" checkbox (6026:60148)
  - "Don't have an account yet? Click here to register." (6026:60154)
  - "capella icon 1" (6026:60135)
  - a Select field in the modal (6026:62917)
  - a third barley image (6026:60118)

---

### 7. Copy deck (verbatim)

**Login page**
- (Logo) AGI SURETRACKFARM. This is vector artwork, not live text. Use alt text "AGI SureTrack Farm".
- `Login` (title)
- `Username`
- `Password`
- `Login` (button)
- `Forgot Password or Username?`
- `By clicking login, you hereby agree to our ` ⏎ `Privacy Policy` ` | ` `Terms of Service`
  - Layer name: "By clicking login, you hereby agree to our  Privacy Policy  | Terms of Service".

**Forgot Password modal**
- `Forgot Your Password or Username?`
- `Forgot your password or username? Enter your email address, and we’ll send you a link to reset your password.` (uses a typographic apostrophe ’)
- `Email ` `*`
- `Eg. example@mail.com` (placeholder)
- `Need additional help?` ⏎ `SureTrack Coach (855) 293-5607`
- `Cancel`
- `Submit`

**Hidden (not rendered):** `Remember Me`, and `Don’t have an account yet?  Click here to register.`

---

### 8. Open questions and inconsistencies

1. **Close "X" is invisible.** The modal's Close Button group (6026:62910) has opacity 0. Should the modal show a close X? Its box is 12×32 at (564, 20) with a `#6B7280` stroke.
2. **No prototype or flow data** (see Part A §6). Confirm these:
   - the Forgot-link → modal trigger
   - the modal backdrop color and opacity, and whether it is centered over the 1366×768 page
   - the Cancel, Submit and X behaviour, and Esc / click-outside
   - Login → Dashboard navigation and its route
   - what happens after Submit (a success toast or confirmation screen is not designed)
3. **Forgot link is off-center.** Its 197 px box is offset 109 px into the 392.43 column, so the box center is 11.3 px right of the column center. The text inside is left-aligned, and its rendered width is likely narrower than 197. Was it meant to be centered under the button?
4. **Login inputs are bare rectangles.** They have no placeholder, no text style, no padding, no fill, and a 4 px radius. The modal input uses an 8 px radius, a 1 px border and 16 px padding. What are the typed-text style, padding, caret color and password-mask/visibility toggle? Is the 4 px vs 8 px radius difference intentional?
5. **No error, focus or disabled states** for the login fields, Login button or modal Email field. There is also no "invalid credentials" message design.
6. **Right-edge overlay 6026:60119.** A `#02A45B` 40% shape is positioned almost entirely off-canvas, leaving a 9×13 px green triangle at the bottom-right corner. Is it a leftover, or should it be dropped?
7. **Unused photo layers.** `Transformation 1`, `484584386_…`, `swiss-pasta-emea 1` (2 fills), and hidden `barley … 2` are fully covered. Confirm they can be dropped. Their names also mislead: the visible silo photo is named "barley-young-crop…", and the barley photo is named "swiss-pasta-emea".
8. **Legal text box.** It is 64 px tall but holds 2 lines × 24 = 48 px; the 16 px slack is presumably at the bottom (top-aligned). The separator spacing is mixed weight: Regular space, " | ", Medium space.
9. **Responsiveness is undefined.** Only a 1366×768 frame exists. Several behaviours are UNKNOWN: whether the green panel scales with height, how the photo crops at other aspect ratios, and how the form column stays vertically centered (it is centered via `top: 50%` in the design).
10. **Layer misname.** The Password label layer is named "Username" (6026:60144). This is cosmetic.
11. **Token oddities.** The modal input border uses `table/row/border`. The Login-page white text colors are not bound to tokens. The help-icon (`#9CA3AF`) and close-icon (`#6B7280`) colors are hardcoded in the SVGs.
12. **Phone number is plain text** in the design. Should it be a `tel:` link?
13. **Privacy Policy / Terms of Service destinations** are not specified (URLs UNKNOWN).

---

## Part B — Dashboard & Notifications

- Figma fileKey: `js9ue0LTQDFIxAsxEuM8Wx` (page "🎨 Demo", canvas `6026:48590`), read-only; nothing was changed in Figma.
- Target frames:
  - **A** `6215:58878`: FULL account, 1366×1052.
  - **B** `6864:4514`: SMALL account with 1 alert, 1366×860.
  - **C** `6879:15603`: ALL-GOOD account, 1366×856.
  - **N** `8270:44312`: Notifications panel, 290×768.
- Sources: `get_design_context` for every card and section, `get_variable_defs`, `get_metadata` layer dump, and screenshots. Working screenshots taken while reading the file (not stored with this addendum; the comparison baselines are in `figma-reference/`): `full.png`, `dash_small.png`, `dash_good.png`, `dash_notif.png`, `dash_alt.png`, `dash_profile.png`, `dash_menu.png`. The downloaded icon SVGs and PNGs are in `figma-assets/dashboard/`.
- Units are CSS px at a 1366 px wide viewport. Figma fractional values are kept as they are.
- `UNKNOWN` means the tools did not expose the value. The reason is given each time.

---

### 1. Design tokens

#### 1.1 Figma variables (`get_variable_defs` on 6215:58878, verbatim)

| Token | Value |
|---|---|
| `font/family` | **"SF Pro"** |
| `font/weight/regular` / `medium` / `semibold` | Regular (400) / Medium (510) / Semibold (590) |
| `heading/font-size/md` | 20 |
| `heading/font-size/xs` | 14 |
| `text/font-size/md` | 16 |
| `text/font-size/xs` | 12 |
| `type-heading/24/size` | 24 |
| `semantic/color/fg/brand-primary` | #005c2f |
| `brand/primary/50` | #eaf8ef |
| `brand/primary/500` | #006a36 |
| `brand/primary/600` | #005c2f |
| `brand/primary/700` | #004b27 |
| `brand/secondary/500` | #00b156 |
| `brand/gray/200` | #e4e5e4 |
| `brand/gray/300` | #cfd0d0 |
| `semantic/color/text/primary` | #111827 |
| `semantic/color/text/secondary` | #374151 |
| `semantic/color/fg/primary` | #111827 |
| `semantic/color/border/secondary` | #9ca3af |
| `component/input/text/default` | #111827 |
| `component/input/border/error` | #dc2626 |
| `component/nav/text/default` | #374151 |
| `component/button/secondary/icon` | #111827 |
| `content/content-primary` | #09090b |
| `table/row/bg-selected` | #f0fff8 |
| `primitives/color/alpha-black/80` | #000000cc (rgba(0,0,0,0.8)) |
| `primitives/color/alpha-black/70` | #000000b2 (rgba(0,0,0,0.7)) |
| `primitives/color/amber/600` | #d97706 |
| `primitives/color/sky/500` | #0ea5e9 |
| `primitives/color/lime/500` | #84cc16 |
| `primitives/color/indigo/500` | #6366f1 |
| `primitives/color/violet/100` | #ede9fe |
| `primitives/color/blue/50` | #eff6ff |
| `primitives/color/base/white` / `black` | #ffffff / #000000 |
| `border-width/hairline` | 1 |
| `xs` / `md` (spacing and radius) | 6 / 6 |
| `icons/16px` | 1.33 (stroke width) |
| `Shadow/2` | DROP_SHADOW #2727271A, offset (0,2), radius 4, spread 0 |

These variables appear only in the empty-state nodes (from a second library):

| Token | Value |
|---|---|
| `color/grey/96` | #f4f5f6 |
| `color/azure/11` | #111827 |
| `color/azure/34` | #4b5563 |
| `corner-radius/12` | 12 |
| `item-spacing/10` | 10 |
| `item-spacing/14` | 14 (used as a font size) |
| `font-size/16` | 16 |
| `line-height/20_3` | 20.3 |
| `font-family/font-1` | Roboto |

#### 1.2 Named text styles in the file

- **NativeBase Typography** (family = `font/family` = SF Pro):

  | Style | Weight / size / line-height |
  |---|---|
  | Heading/Semibold/md | 590 / 20 / 1.25 |
  | Heading/Medium/xs | 510 / 14 / 1.25 |
  | Heading/Regular/xs | 400 / 14 / 1.25 |
  | Text/Semibold/md | 590 / 16 / 1.5 |
  | Text/Semibold/xs | 590 / 12 / 1.5 |
  | Text/Regular/xs | 400 / 12 / 1.5 |
  | `Text/Regular/xs: 12px` | SF Pro 400 / 12 / 1.5 |

- **Roboto styles**:

  | Style | Weight / size / line-height | Letter-spacing |
  |---|---|---|
  | Body/lg/Semibold | 600 / 18 / 26 | 0 |
  | Body/md/Semibold | 600 / 16 / 24 | 0 |
  | Body/md/Medium | 500 / 16 / 24 | 0 |
  | Body/sm/Regular | 400 / 14 / 20 | 0 |
  | Body/sm/Medium | 500 / 14 / 20 | 0 |
  | Body/xs/Regular | 400 / 12 / 18 | 0 |
  | Display/xs/Semibold | 600 / 24 / 26 | -2% (-0.48px) |
  | Heading/md/Medium | 500 / 20 / 24 | -1% |
  | Roboto/Bold | 700 / 16 / 100% (normal) | 0 |
  | Roboto/Regular | 400 / 14 / 20.3 | 0 |

#### 1.3 Font families actually used

1. **SF Pro** (the value of the `font/family` variable). It covers card titles, subtitles, equipment row labels, alert texts, View All links, fan stat tiles, fan caption, grain summary and grain legend, and liquid legend.
   - Weights used: 400, **510**, **590**, 700. These are non-standard weights from the SF variable font.
   - Every node carries `font-variation-settings: "wdth" 100`.
2. **Roboto** covers:
   - header nav, page title and KPI strip (all numbers and labels);
   - the health-bar caption line ("**3** alerts · …");
   - fan chart value and day labels;
   - the liquid summary line;
   - empty states, Notifications panel and profile menu.
   - Weights used: 400, 500, 600 (SemiBold), 700, 800 (ExtraBold, only in the bell badge).
3. **Inter** appears only as the wrapper font of the liquid summary line (node 6337:54903, whose spans override it to Roboto) and of the "83% Fill" text (6337:54904, `Inter:Medium` 500).

> Resolved in brief.md, fidelity rule 4: SF Pro is an Apple system font and cannot be self-hosted for the web, so SF Pro text uses the stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"` with Inter as fallback (renders true SF Pro on macOS/iOS); Roboto is self-hosted for the Roboto styles. Pixel-comparison tests run on macOS.

#### 1.4 Colour palette (all hard-coded and tokenised colours used on the Dashboard)

**Surfaces**

| Use | Value |
|---|---|
| Page background (sampled from render) | **#F3F4F6** |
| Page Title strip background (node fill) | **#F3F4F4**. Differs from the page by 2 units of blue (see §16). |
| Card / header / panel background | #FFFFFF |
| Card border | 1px **#D1D5DB** |
| Divider inside cards (health rows), KPI vertical dividers | **#E6E8EB** |
| Alert row separator | rgba(30,42,44,0.15) |
| Stat tile and empty-state background | **#F4F5F6** |

**Text**

| Use | Value |
|---|---|
| Card title | **#1F2937** (hard-coded) |
| Primary | #111827 |
| Secondary | #374151 |
| Muted | #4B5563 |
| Body 80% | rgba(0,0,0,0.8) |
| Body 70% | rgba(0,0,0,0.7) |
| Page title | #09090B |

**Brand and links**

| Use | Value |
|---|---|
| Links and action text | #005C2F (`brand/primary/600`) |
| Arrow-right icon stroke | #005C2F |
| Chevrons (sampled) | #006A36 |
| Active nav underline and Dashboard icon | **#006A36** |
| Active nav background | **#F0FFF8** |

**Semantic colours**

| Use | Value |
|---|---|
| Critical / alert red on health bars, KPI "Need attention" label, KPI alert icon stroke | **#C62828** |
| KPI alert icon tile | **#FDECEC** |
| Critical severity text and critical alert icon circle | **#DC2626** (`component/input/border/error`) |
| Warning severity text | **#D97706** (`amber/600`) |
| Warning alert icon circle | **#FFA526** |
| Healthy green (health bars) | **#15803D** |
| Healthy KPI tile / all-good tile | #EAF8EF (`brand/primary/50`) |
| All-good tick icon stroke | #005C2F |
| Offline hatch stripes | **#9CA3AF** and **#D1D5DB**. Pattern definition in §5.2. |
| Info / fans KPI tile | #EFF6FF (`blue/50`) |
| Equipment KPI tile | #EDE9FE (`violet/100`) |
| Offline KPI tile | #F4F5F6 |
| Online / Offline / Fans KPI icon stroke | #4B5563 |
| Equipment KPI icon | black at 0.7 opacity |
| Bell badge | **#FF0000** (pure red, hard-coded `bg-[red]`) with white text |

**Fan chart**

| Use | Value |
|---|---|
| Normal bar | **#0B7A3B** |
| "Today" bar | **#0A5C30** |
| Value and day labels | #4B5563 |
| "Today" day label | #111827, bold |

**Grain commodities** (swatch = segment colour)

| Commodity | Colour |
|---|---|
| Canola | **#E3C341** |
| Corn | **#E07B39** |
| Soybeans | **#6F8F4F** |
| Wheat | **#C98F2E** |
| Barley | **#8FB36B** |
| Oats | **#B9A47A** |
| Remaining-capacity track | **#EEF1EF** |

**Liquid products**

| Product | Colour |
|---|---|
| Propane | **#0EA5E9** (sky/500) |
| Fuel Oil | **#00B156** (brand/secondary/500) |
| Water | **#84CC16** (lime/500) |
| Kerosene | **#14B8A6** |
| Gasoline | **#A855F7** |
| Diesel | **#6366F1** (indigo/500) |
| Available-capacity track | **#EEF1EF** |

**Notifications panel**

| Use | Value |
|---|---|
| Title divider | rgba(175,195,188,0.4) |
| List and tablist dividers | #D9DCD6 |
| Item text | #1D1F1C |
| Timestamp | #666666 |
| Tag "App" | bg #E6F2EA, text #17703A |
| Tag "Promotion" | bg #FDF1DC, text #8A5A00 |
| Tag "Equipment" | bg #E3EEF8, text #1F5B8F |
| Chip inactive background | rgba(120,120,128,0.1) |
| Toggle track | #006A36 |
| Close icon | #1E2A2C |

**Profile menu**

| Use | Value |
|---|---|
| "Logout" text | #E05400 |
| Title | #374151 |

#### 1.5 Elevation

| Element | Shadow |
|---|---|
| Header | drop-shadow 0 2px 2px rgba(39,39,39,0.1) in the generated code. The `Shadow/2` token says blur radius 4. |
| Cards (all 5) | `filter: drop-shadow(0px 2px 2px rgba(39,39,39,0.1))` |
| KPI strip | `box-shadow: 0px 2px 4px 0px rgba(39,39,39,0.15)` on an absolutely positioned inner rectangle with radius 12. The outer frame has radius 16 (see §16). |
| Notifications "All" chip | `drop-shadow(0 3px 4px rgba(0,0,0,0.12)), drop-shadow(0 3px 0.5px rgba(0,0,0,0.04))` |

---

### 2. Page shell

#### 2.1 Page layout (vertical positions)

The page has no max-width container: the frame is 1366 wide, with 24 px side gutters, so content is 1318 wide.

| Element | x | y | w × h | Notes |
|---|---|---|---|---|
| Header (instance 6227:63670) | 0 | 0 | 1366×64 | |
| Page Title (6215:59009) | 0 | 64 | 1366×68 | bg #F3F4F4, padding 16 top / 20 bottom / 24 sides |
| KPI strip (6337:55041) | 24 | 136 | 1318×90 | 4 px below the title strip |
| Content (6227:66459) | 24 | 246 | 1318×… | 20 px below the KPI strip |
| Row 1 | 0 | 0 | 1318×444 (A) / 240 (B, C) | 2 cards, each 649 wide, column gap **20** |
| Row 2 | 0 | 464 (A) / 260 (B, C) | 1318×326 | 3 cards, each 426 wide, column gap **20**; row gap **20** |
| Bottom space to frame edge | | | | A: 16 px, B: 28 px, C: 24 px. These are inconsistent; use 24. |

Grid widths: 649 + 20 + 649 = 1318, and 426 × 3 + 20 × 2 = 1318.

#### 2.2 Header (component instance; master symbol `6194:35398` "Dashboard")

**Container**
- `display: flex; justify-content: space-between; align-items: center; padding: 0 24px; height: 64px; background: #FFF`, with the shadow from §1.5.

**Left block** (w 193, gap 16, h 64)
- Logo "SURETRACKFARM" is one vector group, **176.895×14**, fill #111827. Asset `d61ab.svg` (`figma-assets/dashboard/logo.svg`).
- A vertical divider follows: a 24 px line rotated 90°, stroke #9CA3AF (`e73a1.svg`).
- A hidden group sits after it, at opacity 0: "Farm Test" (Roboto SemiBold 18/26, #111827) plus an Alt-Arrow-Down icon (24, #111827). It is reserved for a farm switcher and is **not visible** in any state.

**Nav tabs** (3 tabs, no gap between them)
- Each tab: **154×64**, `display:flex; gap 8; align/justify center`, `border-bottom: 4px solid`.
- **Active tab** (Dashboard):
  - background **#F0FFF8**, border-bottom **4px #006A36**;
  - icon "AGI Icons / Widget 5" 24 px, fill #006A36;
  - label Roboto SemiBold 16/24, #111827.
- **Inactive tabs** (Equipment, Alerts):
  - background #FFF, border-bottom 4px #FFF, so the height stays stable;
  - the label (Roboto SemiBold 16/24, #374151) **and** the icon sit at **opacity 0.7**;
  - icons: Garage (24, black with an inner 0.7 opacity) and vuesax/linear/danger (24, black stroke 1.5).
- The tab group's horizontal position comes from `space-between`, so it is *not* exactly centred. With a 193 px left block and roughly 68 px right block, the tabs start at x = 514.5.

**Right block** (`Icon action Header`, gap 20, h 64)
- Bell: "AGI Icons / Bell", 20×20, fill #111827, a `<button>`.
- Avatar: a 48×48 holder with `justify-end`, holding a 32 px circular masked photo. There are 3 stacked raster layers (`764eb.png` 4096² JPEG, `28197.png` 1024² PNG, `543ac.png` 256² JPEG) plus a #1C447E fallback disc. Build it as one 32 px round `<img>`. The bell-to-avatar spacing works out to about 16 px.
- Bell badge:
  - absolute at left 9, top 18 of the action container, so it overlaps the bell's top-right;
  - **14×14**, radius 100, bg **#FF0000**;
  - text "2", Roboto **ExtraBold 9px**, white, letter-spacing -0.5px, centred;
  - the node has padding `pt10 pb11 px8`, which is larger than the box, so the text is just centred in practice.

**Header variants found** (master symbols, same size 1366×64):
- `3649:36786` "Header" (base)
- `6194:35398` "Dashboard" (Dashboard tab active)
- `6229:37003` "Equipment" (Equipment active)
- `6223:34415` "Alerts" (Alerts active)
- `7241:84825` "Profile"

No hover state for the nav tabs exists anywhere in the file.

#### 2.3 Page title

- "Dashboard": Roboto SemiBold **24/32**, letter-spacing **-0.6px**, color #09090B, single line with ellipsis.
- The node also contains hidden children (not rendered): a breadcrumb (`Bread Crumbs/Default`), "Linear/Arrows/Arrow Left", "AGI Icons/Alt Arrow Down", and a 327×36 right-side frame `Frame 1984077346`. None of these is visible in A, B or C.

---

### 3. KPI strip ("Section - Operation status")

**Shell**
- `<a>` (the whole strip is clickable, `cursor:pointer`), 1318×90, bg #FFF.
- Frame radius 16, padding-y 6. An absolute inner rectangle (radius **12**) carries `box-shadow 0 2px 4px rgba(39,39,39,0.15)`; the visible corner radius is 12.
- Inner Container: `padding-y 4`, `display:flex`, `align-items:flex-start`. It uses `justify-content:center` in A and B. In C it has no justify-content and uses `gap:20`.

**Each segment**
- `padding: 12px 20px; display:flex; align-items:center; gap:14px`.
- Every segment except the first has `border-left: 1px solid #E6E8EB`.

**Icon tile**
- A 44×46 wrapper with `padding-top 2`, holding a 44×44 tile, radius 12, centred 22×22 icon.
- In C the "all good" tile holds a 20×20 icon.

**Text block** (column, gap 2)
- Number: Roboto **Bold 22 / 25.3**, #111827.
- Label: Roboto **Regular 13.5 / normal**, #4B5563.
- Attention label in A and B: Roboto **Bold 13.5**, **#C62828**, with `text-align:right` set on the node (renders left because the node hugs its text).
- Attention label in C: Regular #4B5563.

**Equipment segment**
- A 147-wide block (icon tile + "20 Equipment"), then the sub-count blocks, with gap **20**.
- Each sub-count block is 40 wide (Tanks: 50), with a number over a label.
- In **A**, sub-count numbers are **Roboto Regular** 22. In **B and C** they are **Roboto Bold** 22 (see §16).

| Segment | A width | B width | C width | Icon | Tile bg | Icon colour |
|---|---|---|---|---|---|---|
| Need attention | 264 | 264 | 264 | warning triangle (`321dd.svg`) / C: tick-circle (`2c2db.svg`, "AGI Icons / Operation Normal" 6882:59666) | #FDECEC / C: #EAF8EF | stroke #C62828 w1.83 / C: #005C2F w1.6 |
| Equipment + breakdown | 500 (fixed) | 308 (hug) | 248 (hug) | silo/garage (`a2115.svg`) | #EDE9FE | black, opacity 0.7 |
| Online | 173 | flex 1 (248.67) | flex 1 (242) | wifi (`9dee1.svg`) | #EAF8EF | stroke #4B5563 |
| Offline | 173 | flex 1 (248.67) | flex 1 (242) | wifi-off (`40eb7.svg`) | #F4F5F6 | stroke #4B5563 |
| Fans running | flex 1 (208) | flex 1 (248.67) | flex 1 (242) | fan (`e5347.svg`) | #EFF6FF | stroke #4B5563 |

Segment x positions in C: 0 / 284 / 552 (the last 3 are wrapped in frame 6916:11719, 766 wide, gap 20).

---

### 4. Card shell (shared by all 5 cards)

- `background:#FFF; border:1px solid #D1D5DB; border-radius:12px; padding:20px; filter:drop-shadow(0 2px 2px rgba(39,39,39,0.1))`. All 5 card layers are named "alerts-activity-card".

**Card header** ("Margin")
- Row 1 cards (Equipment, Recent Alerts) and Fan activity: height **56**, padding-bottom 12.
- Grain and Liquid: height **33**, pb 12. The header text actually needs 46 px and overflows into the following 24 px gap. Reproduce the visual result: about 46 px of header, then the summary.
- Contents (column, gap 3):
  - Title: SF Pro 590, 20 px, line-height 1.25, **#1F2937**.
  - Subtitle: SF Pro 400, 12 px, lh 1.5. Colour is rgba(0,0,0,0.8) in Equipment and Alerts, and **#4B5563** in Fan, Grain and Liquid (see §16).

**"View All" link** (Equipment and Alerts only, right side)
- min-height 44, padding 13.5 2.
- Inner gap 6: text SF Pro 510, 14/1.25, #005C2F, then a chevron.
- The chevron is an SF Symbol text glyph `chevron.left` rotated 180° in a 12×16 box, colour **#006A36** (sampled from the render). Export it as an SVG chevron-right.

---

### 5. Equipment card ("Equipment (N) · Health by type")

#### 5.1 Layout (A: 649×444; B and C: 649×240)

- The List sits below the header. In A it is h 344 with `justify-content:center`. In B and C it is auto height, top-aligned.

**Row**
- `display:flex; justify-content:space-between; align-items:center; min-height:58; padding:12px 0 8px; height 68`.
- In A, rows 2–4 are wrapped in an "Item" with `border-top:1px solid #E6E8EB`, height 69. The last row is 68 plus 1 px border.
- First-row divider:
  - A and B: the first row has **no** top border.
  - C: the single row **has** a top border.

**Left column** (w **74**, column, gap 1, pb 1)
- Type name: SF Pro 590, 16/1.5, #1F2937.
- Count: SF Pro 400, 14/1.25, #374151.

**Right group** (w 523, row, gap **32**)
- Bar block (w **474**, column, gap **6**): the health bar, then the caption.
- Caption: Roboto 14 / normal.
  - Numbers: **Bold #111827**.
  - Words: Regular #4B5563.
  - Pattern: "`3` alerts · `1` offline · `3` healthy". Middle dot with spaces; "alert"/"alerts" singular and plural.
- Row chevron: an 18×18 box with a text-glyph chevron 12×16 at left 3, top 1, colour #006A36. There is also a 4.5×9 vector inside (6337:54590).

#### 5.2 Health bar geometry

- Container: **474 × 8**, `border-radius:4px; overflow:hidden`. CSS grid, one row of 8 px, **column gap 2 px**. Segments are square-cornered; the rounding comes only from the container clip.
- Segment order (left to right): **alerts (red #C62828)**, **offline (hatched)**, **healthy (green #15803D)**. Zero-count segments are omitted. A single-segment bar is a flex row with one child at full width.
- Mapping (from the grid `fr` values):

  `segment_px = (474 − 2·(k−1)) · count / total`, where k = number of non-zero segments.

  Bins example (3 / 1 / 3, total 7, k = 3): 470/7 = 67.1429, giving red 201.43, hatch 67.14, green 201.43.

- The fraction values in the file:

  | Row | Grid template |
  |---|---|
  | Bins | `3fr 1fr 3fr` |
  | Piles | `1fr 2fr` |
  | Tanks | `1fr 5fr` |
  | Flats, Dryers | single 100% green |
  | B Bin | 100% red (built as 2 red cells: a 453 px span-2 cell plus a col-3 cell, so it reads as solid red) |
  | B Dryer, C Bin | 100% green |

- **Offline hatch definition** (verbatim from the node): `linear-gradient(43.841deg, #9CA3AF 0%, #9CA3AF 5.8535%, #D1D5DB 5.8535%, #D1D5DB 11.707%, … repeating …, #D1D5DB 100%)`. That is 17 hard-edged alternating stripes of 5.8535% each, starting with #9CA3AF.
  - Equivalent CSS: `repeating-linear-gradient(45deg, #9CA3AF 0 4px, #D1D5DB 4px 8px)`, about 4 px stripes on a 67 px segment.
  - The exact stripe width in px depends on the gradient length. That length is not given; it is about 3.9–4 px for this segment.

---

### 6. Recent Alerts card

#### 6.1 Layout (A: 649×444; B and C: 649×240)

- The card is a column with **gap 8**: header (56), then the list "Alarms" (column, **gap 12**).

**Alert item** ("Detail")
- `display:flex; gap:16; align-items:flex-start`.
- **Severity icon**: a wrapper with padding-top 4 holding a **20×20 circle**.
  - Critical: bg #DC2626, padding 3.333, holding a 15×15 white glyph (`a7e96.svg`, exclamation in a circle, white stroke 1.25).
  - Warning: bg #FFA526, padding 3.077, holding a 13.846×13.846 white warning-triangle glyph (`0a6fd.svg`, stroke 1.154).
- **Detail column** (flex 1, gap 4): `border-bottom:1px solid rgba(30,42,44,0.15); padding-bottom:8`.
  - In A the **last item has no border**. In B the single item **has** one.
- **Top row**: `justify-content:space-between`.
  - Left (w **204**):
    - Title: SF Pro 590, 16/1.5, #111827, single line with ellipsis.
    - Meta: SF Pro 400, 12/1.5, rgba(0,0,0,0.8), format `"<deviceId> | <location>"`.
  - Right (column, `align-items:flex-end`, pt 4, nowrap):
    - Severity: SF Pro 590, 12/1.5. Critical is #DC2626; Warning is #D97706.
    - Time: SF Pro 400, 12/1.5, rgba(0,0,0,0.7), right-aligned.
- **Action link** ("Button"): height 24, gap 6, padding-y 6, radius 6, overflow clip.
  - Text: SF Pro 510, 14/1.25, #005C2F.
  - Icon: "AGI Icons / Arrow Right" 16×16, stroke #005C2F, width 1.33 (`75978.svg`).

#### 6.2 Empty state (C, node 6882:4705 "div.empty")

- bg #F4F5F6, radius 12, `padding:32px 18px`, column, `align/justify center`, gap 10, full width. Measured height 134 (card 240).
- Title "No Alerts Right Now": Roboto Bold 16 / normal, #111827.
- Body: Roboto Regular 14 / **20.3**, #4B5563, centred, width **377**.

---

### 7. Fan activity card (426×326, all states)

**Header**: title "Fan activity", subtitle "All storage fans" (#4B5563).

**Stat tiles** (wrapper w 386, pb 12; row, gap **16**)
- 3 tiles, flex 1 (about 118 each), bg **#F4F5F6**, radius **8**, padding **8px 10px**.
- Value: SF Pro 590, 16/1.5 in a fixed 20 px tall box, #111827.
- Label: SF Pro 400, 12/1.5 in a 17 px box, rgba(0,0,0,0.8).

**Chart** (frame "Img - Fan runtime hours for the last 7 days, from 62 to 90 hours")
- 386 × **119** (A) / 120 (B, C). `display:flex; justify-content:space-between; align-items:flex-end`.
- 7 columns, each `flex:1` (386/7 = **55.14 px**), height **103**, column direction, `justify-content:flex-end`, `align-items:center`.
- **Bar**: width **24** (max-width 30); radius **top 5 px, bottom 2 px**.
  - Fill **#0B7A3B**; the "Today" bar is **#0A5C30**.
- **Value label**: absolute, top **-18px** over the bar, horizontally centred (left/right inset about 16.5%). Roboto Regular 12 / normal, #4B5563, format `"62h"`.
- **Day label**: below the bar, padding-top **5**. Roboto Regular 12, #4B5563. "Today" is **Roboto Bold 12, #111827**.
- Baseline: the bottoms of all bars align (`justify-end`). The day label (about 14 px text + 5 px padding) sits under the baseline. There are no axis lines, gridlines or y-axis.
- **Measured bar heights** (hours → px):

  | Day | Hours | Bar height (px) |
  |---|---|---|
  | Wed | 62 | 54 |
  | Thu | 70 | 61 |
  | Fri | 74 | 66 |
  | Sat | 81 | 72 |
  | Sun | 77 | 68 |
  | Mon | 90 | 79 |
  | Today | 86 | 76 |

- **Mapping**: `bar_px ≈ hours × 0.878`, i.e. `round(hours / 90 × 79)`, so the max value of 90 h gives 79 px. The heights were placed by hand: the formula is within ±1 px (Fri 65 vs 66, Sat 71 vs 72).
  - Recommended rule: `bar_px = round(hours / max(hours) × 79)`.

**Caption**: padding-top 12, SF Pro 400, 12/1.5, rgba(0,0,0,0.8), wraps across 2 lines.

---

### 8. Grain On Hand card (426×326)

**Layout**
- The card is a column with gap **20**: [top group (gap **24**): header (33 nominal) + summary], then the legend.

**Summary** ("LSN & Grain Variety", h **45**, column gap **10**)
- Text row: `justify-content:space-between; align-items:flex-end`, nowrap.
  - Left: one paragraph in colour #374151.
    - Bold span "1.40M bu ": **SF Pro Bold 16 / 1.3**.
    - Regular span "of 1.78M bu · 79% full": SF Pro 400, 16/1.3.
  - Right: "79% Fill", SF Pro 510, 16/1.5, #111827.
- **Segmented bar**: width 386 (full), height **10**, radius **8.75**, `overflow:hidden`, segments absolutely positioned, height 10.

**Segments (A)**

| # | Commodity | left (px) | width (px) | Amount (k bu) | px per k |
|---|---|---|---|---|---|
| 1 | Canola | 0 | 72.5 | 340 | 0.2132 |
| 2 | Corn | 76.33 | 67.5 | 314 | 0.2150 |
| 3 | Soybeans | 147.58 | 57.5 | 268 | 0.2146 |
| 4 | Wheat | 208.83 | 47.5 | 224 | 0.2121 |
| 5 | Barley | 260.08 | 30 | 140 | 0.2143 |
| 6 | Oats | 293.83 | 23.75 | 111 | 0.2140 |
| — | track #EEF1EF | 321.33 | 81.25 | (remaining) | — |

- Gaps: 3.83 after segment 1, then **3.75** after each of the others.
- **Mapping**: `seg_px ≈ amount_k × 0.21386`, which is (298.75 px / 1397 k). Values are rounded to multiples of 1.25 px, with **3.75 px gaps**.
  - Total coloured width is 298.75 + 5 × 3.75 + 3.83 = 321.33 px, or 83.2% of 386. That does **not** match "79%" (see §16).
  - The track starts at 321.33 and is 81.25 wide, so it overflows 386 by 16.58 px and is clipped.
  - Recommended rule: `seg_px = (amount / capacity) × (386 − gaps)`, with a remaining-capacity track filling the rest. This is not what Figma does exactly.
- **B / C**: one Wheat segment, **#C98F2E**, width **321**, at top -0.5 (Figma nudge). Track at left 321.33, width 81.25.

**Legend**
- A: 3 rows, column gap **16**, width 386. Each row is `justify-content:space-between` with 2 items, each item **188** wide.
- Swatch: **12.5×12.5**, radius **3.75**, absolute at top 12.81.
- Text block at left **24**:
  - Name: SF Pro 590, 16/1.5, #111827.
  - Sub: SF Pro 400, 12/1.5, rgba(0,0,0,0.8), absolutely placed at top 36 with translateY(-50%), format `"340k bu · 1 unit"`.
  - Item height about 42–45.
- **Exception, Corn** (6337:54860): swatch **11.368**, radius 3.41, top 11.65; text at left **22**; name **14.551 px**; sub **10.913 px**; item height 40. This is a scaled copy. Normalise it to the others.
- B / C: one item, "Wheat" / "21,050 bu · 1 unit · Wheat Storage".

---

### 9. Liquid On Hand card (426×326)

**Layout (A)**
- Column gap 20: [top group gap 24: header (33) + "Capacity and fill" (h **42.188**, column gap **9.375**, overflow clip)], then the legend.

**Summary row** (space-between)
- Left: bold span "83k gal " in **Roboto Bold 16/1.3**, then "of 100k gal · 83% full" in **Roboto Regular 16/1.3**. Colour #374151; the wrapper is set to Inter Bold.
- Right: "83% Fill" in **Inter Medium 16/1.5**, #111827.

**Segmented bar** ("Segmented fill bar")
- Width 386, height **9.375**, radius **8.203**, flex row, **gap 3.516**, overflow hidden.

| Product | Width (px) | Amount (k gal) |
|---|---|---|
| Propane #0EA5E9 | 70.313 | 20 |
| Fuel Oil #00B156 | 63.281 | 18 |
| Water #84CC16 | 56.25 | 16 |
| Kerosene #14B8A6 | 35.156 | 10 |
| Gasoline #A855F7 | 28.125 | 8 |
| Diesel #6366F1 | 38.672 | 11 |
| "Available capacity" #EEF1EF | 73 (h **10**) | — |

- **Mapping (exact)**: `seg_px = amount_k × 3.515625`, which equals 9/2.56, so 20k gives 70.3125.
  - Coloured width is 291.8 + 5 gaps × 3.516 = 309.4 px, or **80.2%** of 386 (81.1% including the 6th gap). The label says **83%**.
  - Sum of all children is 389.4, more than 386, so the track overflows and is clipped.

**Legend** ("Liquid categories", column gap **16**, overflow clip)
- 3 rows, each row gap **16.406**; 2 items per row, each flex 1, height **44.531**, gap **10.547**, `align-items:center`.
- Marker: **11.719** square, radius **3.516**.
- Name: SF Pro 590, **14.551**/1.5, #111827.
- Sub: SF Pro 400, **10.913**/1.5, rgba(0,0,0,0.8), format `"20k gal · 4 tanks"`.
- These are scaled values (×0.9094 of 16/12). Grain uses 16/12 (see §16).

**Empty state (B, C; node 6882:59806 "div.empty")**
- bg #F4F5F6, radius 12, **height 220**, padding **18px 18px 0** (top and sides only), column, centred, gap 10.
- Title "No Tanks Monitored Yet": Roboto Bold 16, #111827.
- Body: Roboto 14/20.3, #4B5563, centred, width **222**.
- The card header block here is h 46 (wrapper 6882:59794), instead of 33 + 24.

---

### 10. Differences between the three states

| Area | A: FULL (6215:58878) | B: SMALL (6864:4514) | C: ALL-GOOD (6879:15603) |
|---|---|---|---|
| Frame height | 1052 | 860 | 856 |
| KPI attention | icon warning, tile #FDECEC, "7", "Need attention · 2 critical" (bold red) | "1", "Need attention · 1 critical" (bold red) | tick-circle 20 px, tile #EAF8EF, "0", "Need attention · all good" (regular grey) |
| KPI equipment | "20 Equipment", then 7 Bins, 3 Piles, 2 Flats, 6 Tanks, 2 Dryers (sub-numbers Regular) | "2 Equipment", then 1 Bin, 1 Dryer (Bold) | "1 Equipment", then 1 Bin (Bold) |
| KPI online / offline / fans | 16 / 4 / "7 of 24" | 2 / 0 / "2 of 3" | 1 / 0 / "2 of 3" |
| Row 1 height | 444 | 240 | 240 |
| Equipment card | 5 rows | 2 rows (Bin all red, Dryer all green) | 1 row (Bin green) with a top border |
| Recent Alerts | 4 items | 1 item (HotSpot) | Empty state "No Alerts Right Now" |
| Fan tiles | 7 / 86 h / 410 kWh | 7 / 86 h / 410 kWh | "2 of 3" / "7 h 24 m" / "38 kWh" |
| Fan chart | 62, 70, 74, 81, 77, 90, 86 | identical | identical |
| Grain | 6 commodities | 1 (Wheat) | 1 (Wheat), same as B |
| Liquid | 6 products | Empty "No Tanks Monitored Yet" | Empty, same as B |
| Bell badge | 2 | 2 | 2 |

---

### 11. Notifications side panel (8270:44312, 290×768)

**Placement**
- It sits on the canvas next to state C (x −90566 vs C's right edge at −90711). It is **not** overlaid on a dashboard frame.
- Overlay behaviour is `UNKNOWN` because no prototype data is exposed: right-anchored or drawer, scrim, shadow and animation are all unspecified.
- The panel node itself has no shadow or border. Recommended build: a right-side drawer below the 64 px header, 290 wide.

**Container**
- bg #FFF, padding 20, column, gap **16**.

**Title row**
- `border-bottom:1px solid rgba(175,195,188,0.4); padding-bottom 12; space-between`.
- "Notifications": Roboto SemiBold **24/26**, letter-spacing **-0.48px**, #09090B.
- Close: 24×24 `<button>`, icon `6905e.svg` (#1E2A2C).

**Toggle row** (gap 8)
- Switch graphic 32×20 (`2e1e7.svg`): track #006A36 with a white knob, **ON**.
- Label "Unread Only": Roboto Regular 14/20, black.

**Tablist** ("Tablist - Notification type")
- `border-bottom:1px solid #D9DCD6; padding:8px 0 16px; overflow:hidden`. Chips sit in a 250 wide row, gap **12**, pl 1.
- Chip height 24.
- **Active "All"**: w 66, bg #FFF, border 0.5px rgba(0,0,0,0.16), radius 99, shadow from §1.5, Roboto **Medium** 14/20, black.
- Inactive chips: Roboto Regular 14/20, black, bg rgba(120,120,128,0.1), radius 65.

  | Chip | Width / padding |
  |---|---|
  | "App" | w 66, p 2 |
  | "Equipment" | w 100 |
  | "Promotions" | hug, px 14, py 3; clipped past 250 px, so a horizontal-scroll chip row is implied |

**List**
- 250 × **563**, `overflow-y:auto; overflow-x:clip`, column, gap **16**.
- Item (a button):
  - `border-bottom:1px solid #D9DCD6; padding:8px 0 16px; gap 16`; the last item has no border.
  - Message: Roboto **Medium 16/24**, **#1D1F1C**.
  - Footer (space-between, centre):
    - Tag: padding 2 7, radius 4, Roboto **SemiBold 11** / normal.
    - Timestamp: Roboto Regular **12/18**, **#666666**, format `"Feb 25 | 11:20 am"`.

**Data (verbatim)**

| # | Message | Tag | Time |
|---|---|---|---|
| 1 | SureTrack app version 3.2 is available with offline field logging. Update now. | App | Feb 25 \| 11:20 am |
| 2 | Your farm profile is 80% complete. Add your land records. | App | Feb 25 \| 11:20 am |
| 3 | Get 15% off on drip irrigation kits this week. Offer ends Feb 28, 2026 | Promotion | Feb 25 \| 3:20 pm |
| 4 | Free soil testing for your first field / when you book on Mar 5, 2026. (hard line break) | Promotion | Feb 24 \| 3:20 am |
| 5 | Tractor TR-02 is due for service in 3 days (engine hours: 248 of 250). | Equipment | Feb 25 \| 8:40 am |
| 6 | Your rental of Harvester HV-11 ends on Feb 27, 2026. Extend or schedule return. (below the fold) | Equipment | Feb 24 \| 3:20 am |

**Related panel: avatar menu "MY PROFILE"** (`6026:52937`, 290×768; copies at 6904:60715, 6915:82269, 7055:8891, 7178:66371)
- Container: padding 20, gap 32.
- Title "My Profile": Roboto Medium 20/24, -0.2px, #374151. Close is 12×24.
- User block: 48 px avatar, gap 16.
  - "Henry Jones": Roboto SemiBold 20/30, -0.4px, #111827.
  - "Global Storage": Roboto 14/20, #374151.
- Menu: links in a column, gap 12, each a 24 px icon plus text with gap 16. Text is Roboto Medium 16/24, black.
  - Items: My Profile, My Preference, Account Settings, Help, and **Logout in #E05400**.
  - Under each item: a 198 px divider at y 35.5 (238 px for Help).
- The tools do not say which control opens it. Most likely it is the avatar.

---

### 12. Typography summary

| Role | Family | Weight | Size | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|
| Nav tab label | Roboto | 600 | 16 | 24 | 0 | active #111827 / inactive #374151 @0.7 |
| Bell badge | Roboto | 800 | 9 | normal | -0.5px | #FFFFFF |
| Page title | Roboto | 600 | 24 | 32 | -0.6px | #09090B |
| KPI number | Roboto | 700 (A sub-counts 400) | 22 | 25.3 | 0 | #111827 |
| KPI label | Roboto | 400 | 13.5 | normal | 0 | #4B5563 |
| KPI attention label | Roboto | 700 | 13.5 | normal | 0 | #C62828 (C: 400, #4B5563) |
| Card title | SF Pro | 590 | 20 | 1.25 | 0 | #1F2937 |
| Card subtitle | SF Pro | 400 | 12 | 1.5 | 0 | rgba(0,0,0,.8) or #4B5563 |
| View All / action link | SF Pro | 510 | 14 | 1.25 | 0 | #005C2F |
| Equipment type name | SF Pro | 590 | 16 | 1.5 | 0 | #1F2937 |
| Equipment type count | SF Pro | 400 | 14 | 1.25 | 0 | #374151 |
| Health caption number / word | Roboto | 700 / 400 | 14 | normal | 0 | #111827 / #4B5563 |
| Alert title | SF Pro | 590 | 16 | 1.5 | 0 | #111827 (ellipsis, w 204) |
| Alert meta | SF Pro | 400 | 12 | 1.5 | 0 | rgba(0,0,0,.8) |
| Alert severity | SF Pro | 590 | 12 | 1.5 | 0 | #DC2626 / #D97706 |
| Alert time | SF Pro | 400 | 12 | 1.5 | 0 | rgba(0,0,0,.7) |
| Fan tile value | SF Pro | 590 | 16 | 1.5 (20 px box) | 0 | #111827 |
| Fan tile label | SF Pro | 400 | 12 | 1.5 | 0 | rgba(0,0,0,.8) |
| Chart value / day label | Roboto | 400 | 12 | normal | 0 | #4B5563 |
| Chart "Today" label | Roboto | 700 | 12 | normal | 0 | #111827 |
| Fan caption | SF Pro | 400 | 12 | 1.5 | 0 | rgba(0,0,0,.8) |
| Grain summary bold / rest | SF Pro | 700 / 400 | 16 | 1.3 | 0 | #374151 |
| Grain / Liquid "% Fill" | SF Pro 510 / Inter 500 | | 16 | 1.5 | 0 | #111827 |
| Liquid summary bold / rest | Roboto | 700 / 400 | 16 | 1.3 | 0 | #374151 |
| Grain legend name / sub | SF Pro | 590 / 400 | 16 / 12 (Corn 14.551 / 10.913) | 1.5 | 0 | #111827 / rgba(0,0,0,.8) |
| Liquid legend name / sub | SF Pro | 590 / 400 | 14.551 / 10.913 | 1.5 | 0 | #111827 / rgba(0,0,0,.8) |
| Empty-state title | Roboto | 700 | 16 | normal | 0 | #111827 |
| Empty-state body | Roboto | 400 | 14 | 20.3 | 0 | #4B5563 |
| Notif title | Roboto | 600 | 24 | 26 | -0.48px | #09090B |
| Notif toggle / chip | Roboto | 400 (active chip 500) | 14 | 20 | 0 | #000000 |
| Notif message | Roboto | 500 | 16 | 24 | 0 | #1D1F1C |
| Notif tag | Roboto | 600 | 11 | normal | 0 | per tag |
| Notif timestamp | Roboto | 400 | 12 | 18 | 0 | #666666 |

---

### 13. Assets

Everything below is a vector unless marked raster. Files were downloaded to `figma-assets/dashboard/`. Asset URLs are short-lived (7 days); export from Figma for production.

| Asset | Node id(s) | Size | Colour | File / URL suffix |
|---|---|---|---|---|
| Logo "SURETRACKFARM" | I6227:63670;6194:35224 | 176.895×14 | #111827 | `d61ab.svg` → `logo.svg` |
| Header vertical divider | I6227:63670;6194:35226 | 24 line | #9CA3AF | `e73a1.svg` |
| Alt Arrow Down (hidden) | I6227:63670;6194:35229 | 24 | #111827 | `c9efd.svg` |
| Nav Dashboard "Widget 5" | I6227:63670;6194:35372 | 24 | #006A36 | `b36bd.svg` → `widget5.svg` |
| Nav Equipment "Garage" | I6227:63670;6194:35376 | 24 | black @0.7 | `b9a88.svg` → `garage.svg` |
| Nav Alerts "vuesax/linear/danger" | 3062:32562 | 24 | black stroke 1.5 | `9f013.svg` → `nav_danger.svg` |
| Bell | I6227:63670;6194:35257 | 20 | #111827 | `4f90a.svg` → `bell.svg` |
| Avatar photo (**raster**) | I6227:63670;6194:35269/35270/35277 | 32 circle | — | `764eb.png` (JPEG 4096²), `28197.png` (PNG 1024²), `543ac.png` (JPEG 256²); masks `df602.svg`, `9c520.svg` |
| KPI alert triangle | 6337:55047 | 22 | stroke #C62828 | `321dd.svg` |
| KPI equipment (silo) | 6337:55059 | 22 | black @0.7 | `a2115.svg` |
| KPI online (wifi) | 6337:55100 | 22 | stroke #4B5563 | `9dee1.svg` |
| KPI offline (wifi-off) | 6337:55110 | 22 | stroke #4B5563 | `40eb7.svg` |
| KPI fans | 6337:55121 | 22 | stroke #4B5563 | `e5347.svg` |
| KPI all-good tick-circle | 6882:59666 | 20 | stroke #005C2F | `2c2db.svg` |
| Alert critical glyph | 6337:54670 | 15 in a 20 circle #DC2626 | white | `a7e96.svg` |
| Alert warning glyph | 6337:54715 | 13.846 in a 20 circle #FFA526 | white | `0a6fd.svg` |
| Arrow Right (action links) | 6337:54689 | 16 | stroke #005C2F, 1.33 | `75978.svg` |
| Chevron right (View All, rows) | 6337:54574, 6337:54591 | 12×16 glyph | #006A36 | SF Symbol text glyph, so no asset is exported. Recreate it as an SVG. |
| Notif close | 8270:44316 | 24 | #1E2A2C | `6905e.svg` |
| Notif toggle (ON) | I8270:44317;617:5109 | 32×20 | #006A36 / #FFF | `2e1e7.svg` |

Asset URL prefixes returned, all under `https://www.figma.com/api/mcp/asset/`:

| Prefix | Used for |
|---|---|
| `d9ca7e81-1e92-4409-a72d-ba58c8892f5a/` | header |
| `f1c7e9a6-ac7c-40a5-be70-cfb9886b859e/` | KPI A |
| `71546f38-…/` | KPI B |
| `4a1d5510-1982-4e85-a5af-a02722cd1ccc/` | KPI C |
| `187c8fbe-b0c1-4ecd-8054-d0862e659e6e/` | alerts A |
| `e11f869e-…/` | alerts B |
| `0712090d-0483-42f8-996e-bab7adaad126/` | notifications |
| `8cb4b41a-…/` | profile menu |

---

### 14. Data readings (verbatim, ready for JSON)

```json
{
  "stateA_full": {
    "header": { "activeTab": "Dashboard", "tabs": ["Dashboard","Equipment","Alerts"], "bellBadge": 2 },
    "pageTitle": "Dashboard",
    "kpi": {
      "attention": { "value": 7, "label": "Need attention · 2 critical", "critical": 2 },
      "equipment": { "value": 20, "label": "Equipment",
        "breakdown": [ {"value":7,"label":"Bins"},{"value":3,"label":"Piles"},{"value":2,"label":"Flats"},{"value":6,"label":"Tanks"},{"value":2,"label":"Dryers"} ] },
      "online": { "value": 16, "label": "Online" },
      "offline": { "value": 4, "label": "Offline" },
      "fans": { "value": "7 of 24", "running": 7, "total": 24, "label": "Fans running now" }
    },
    "equipmentCard": { "title": "Equipment (20)", "subtitle": "Health by type", "link": "View All",
      "rows": [
        {"type":"Bins","count":7,"alerts":3,"offline":1,"healthy":3,"caption":"3 alerts · 1 offline · 3 healthy"},
        {"type":"Piles","count":3,"alerts":1,"offline":0,"healthy":2,"caption":"1 alert · 2 healthy"},
        {"type":"Flats","count":2,"alerts":0,"offline":0,"healthy":2,"caption":"2 healthy"},
        {"type":"Tanks","count":6,"alerts":1,"offline":0,"healthy":5,"caption":"1 alert · 5 healthy"},
        {"type":"Dryers","count":2,"alerts":0,"offline":0,"healthy":2,"caption":"2 healthy"}
      ] },
    "recentAlerts": { "title": "Recent Alerts", "subtitle": "Most urgent first. Each item links to what to do next.", "link": "View All",
      "items": [
        {"title":"HotSpot Detected","deviceId":"759","location":"Wheat Storage","severity":"Critical","time":"30 mins ago","action":"View Hotspot"},
        {"title":"Static Pressure","deviceId":"757","location":"Oat Silo","severity":"Critical","time":"2 hours ago","action":"Check Fans"},
        {"title":"No Communication","deviceId":"18086","location":"Pinto Storage","severity":"Warning","time":"3 hours ago","action":"Check Connection"},
        {"title":"Missing Fan Switched","deviceId":"753","location":"Canola East","severity":"Warning","time":"1 day ago","action":"Check Fan Switches"}
      ] },
    "fanActivity": { "title": "Fan activity", "subtitle": "All storage fans",
      "tiles": [ {"value":"7","label":"Running Now"},{"value":"86 h","label":"Runtime Today"},{"value":"410 kWh","label":"Energy Today"} ],
      "chart": [ {"day":"Wed","hours":62},{"day":"Thu","hours":70},{"day":"Fri","hours":74},{"day":"Sat","hours":81},{"day":"Sun","hours":77},{"day":"Mon","hours":90},{"day":"Today","hours":86,"isToday":true} ],
      "caption": "Runtime hours, last 7 days. Higher this week as Auto modes used the cool nights." },
    "grain": { "title": "Grain On Hand", "subtitle": "All grain inventory",
      "summaryBold": "1.40M bu", "summaryRest": "of 1.78M bu · 79% full", "fillLabel": "79% Fill",
      "totalBu": 1400000, "capacityBu": 1780000, "fillPct": 79,
      "items": [
        {"name":"Canola","amountLabel":"340k bu","units":1,"color":"#E3C341"},
        {"name":"Corn","amountLabel":"314k bu","units":1,"color":"#E07B39"},
        {"name":"Soybeans","amountLabel":"268k bu","units":1,"color":"#6F8F4F"},
        {"name":"Wheat","amountLabel":"224k bu","units":1,"color":"#C98F2E"},
        {"name":"Barley","amountLabel":"140k bu","units":1,"color":"#8FB36B"},
        {"name":"Oats","amountLabel":"111k bu","units":1,"color":"#B9A47A"}
      ] },
    "liquid": { "title": "Liquid On Hand", "subtitle": "All liquid storage tanks",
      "summaryBold": "83k gal", "summaryRest": "of 100k gal · 83% full", "fillLabel": "83% Fill",
      "items": [
        {"name":"Propane","amountLabel":"20k gal","tanks":4,"color":"#0EA5E9"},
        {"name":"Fuel Oil","amountLabel":"18k gal","tanks":3,"color":"#00B156"},
        {"name":"Water","amountLabel":"16k gal","tanks":4,"color":"#84CC16"},
        {"name":"Kerosene","amountLabel":"10k gal","tanks":2,"color":"#14B8A6"},
        {"name":"Gasoline","amountLabel":"8k gal","tanks":2,"color":"#A855F7"},
        {"name":"Diesel","amountLabel":"11k gal","tanks":2,"color":"#6366F1"}
      ] }
  },
  "stateB_small": {
    "kpi": { "attention": {"value":1,"label":"Need attention · 1 critical"},
      "equipment": {"value":2,"breakdown":[{"value":1,"label":"Bin"},{"value":1,"label":"Dryer"}]},
      "online": {"value":2}, "offline": {"value":0}, "fans": {"value":"2 of 3"} },
    "equipmentCard": { "title": "Equipment (2)", "rows": [
      {"type":"Bin","count":1,"alerts":1,"offline":0,"healthy":0,"caption":"1 alert"},
      {"type":"Dryer","count":1,"alerts":0,"offline":0,"healthy":1,"caption":"1 healthy"} ] },
    "recentAlerts": { "items": [ {"title":"HotSpot Detected","deviceId":"759","location":"Wheat Storage","severity":"Critical","time":"30 mins ago","action":"View Hotspot"} ] },
    "fanActivity": { "tiles": [ {"value":"7","label":"Running Now"},{"value":"86 h","label":"Runtime Today"},{"value":"410 kWh","label":"Energy Today"} ], "chart": "same as A" },
    "grain": { "summaryBold": "21,050 bu", "summaryRest": "of 25,000 bu · 79% full", "fillLabel": "84% Fill",
      "items": [ {"name":"Wheat","subLabel":"21,050 bu · 1 unit · Wheat Storage","color":"#C98F2E"} ] },
    "liquid": { "empty": { "title": "No Tanks Monitored Yet", "body": "Keep an eye on propane, diesel and water levels here, and get an alert before a tank runs low." } },
    "bellBadge": 2
  },
  "stateC_allGood": {
    "kpi": { "attention": {"value":0,"label":"Need attention · all good","allGood":true},
      "equipment": {"value":1,"breakdown":[{"value":1,"label":"Bin"}]},
      "online": {"value":1}, "offline": {"value":0}, "fans": {"value":"2 of 3"} },
    "equipmentCard": { "title": "Equipment (1)", "rows": [ {"type":"Bin","count":1,"alerts":0,"offline":0,"healthy":1,"caption":"1 healthy"} ] },
    "recentAlerts": { "items": [], "empty": { "title": "No Alerts Right Now", "body": "Everything is on track with your storage, dryers, and tanks. We’ll notify you as soon as anything needs attention." } },
    "fanActivity": { "tiles": [ {"value":"2 of 3","label":"Running Now"},{"value":"7 h 24 m","label":"Runtime Today"},{"value":"38 kWh","label":"Energy Today"} ], "chart": "same as A" },
    "grain": "same as B",
    "liquid": "same as B (empty)",
    "bellBadge": 2
  }
}
```

Notes on the strings:
- The curly apostrophe in "We’ll" is U+2019.
- The middle dot "·" is U+00B7, always with a space on each side.

---

### 15. Interactions and prototype

- **Prototype reactions (on-click, navigate, overlay, hover) are not exposed** by the available Figma MCP tools (`get_design_context`, `get_metadata`, `get_screenshot`, `get_variable_defs`). No transition, overlay or trigger data could be read. Everything below is inferred from layer semantics.
- **Elements marked clickable** in the generated code (`<a>`, `<button>`, `cursor:pointer`):
  - the entire KPI strip (`<a>`);
  - nav tabs Equipment and Alerts (`<a>`);
  - the bell `<button>` and the avatar `<button>`;
  - "View All" links (layers named "Link");
  - equipment rows (layers named "Item → Button - Bins, 7: 3 alerts, 1 offline, 3 healthy", which are accessible-name style);
  - alert action buttons ("Button");
  - notification items (named "Button - Unread: …");
  - notification chips and the close button;
  - profile menu entries (`<a>`).
- **Nav**: an active-tab variant exists per page (header symbols 6194:35398, 6229:37003, 6223:34415, 7241:84825). **There is no hover variant.** The only hover component in the file is `Menu_Dropdown` (6026:58941, variants default / `Property 1=hover` 6026:58944 / selected), a "Test Bin" pill: white, then #EAF8EF-like, then #006A36 with white text. It is not part of the Dashboard.
- **Row hover, link hover, focus states**: none designed (`UNKNOWN`).
- **Bell → Notifications panel**: inferred only. The panel exists as a standalone frame, 8270:44312.
- **Avatar → profile menu**: inferred only. The menu is frame 6026:52937 "MY PROFILE".
- **Chart tooltips**: none exist. A search for "tooltip" or "hover" found only `Assigned Card_Tooltip` 6026:59898 (inside an unrelated frame 6026:59881) and `co2_hover 2` 6775:71143 (Analytics). Neither belongs to the Dashboard.
- **Other Dashboard-related frames** found on the page:
  - **`7833:12061` "Dashboard"** (1366×1052): an **alternate or older version** of state A with different alert data:
    - "No Communication · 759 | Wheat Storage · Critical (amber icon) · 30 mins ago · Check Connection"
    - "Low Static Pressure · 757 | Oat Silo · Critical · 2 hours ago · Check Fans"
    - "Hotspot Detected · 18086 | Pinto Storage · Critical · 3 hours ago · Learn About This"
    - "Missing Fan Switches · 753 | Canola East · Warning · 1 day ago · Check Fan Switches"

    Confirm which one is canonical.
  - "10 · All good - guides + Know your alerts": 7833:12658, 8333:15816, 8333:16215. These are later "all good" concepts, not inspected.

---

### 16. Inconsistencies and open questions

**Data, state A**

1. **"7 Need attention · 2 critical"** does not match the other counts:
   - the health bars total **5 alerts** (Bins 3 + Piles 1 + Tanks 1), or 6 with the offline unit;
   - Recent Alerts shows **4** (2 critical + 2 warning).

   Only "2 critical" matches.
2. **Offline 4** (KPI) vs **1 offline** in the health bars. Online 16 + Offline 4 = 20 does match "20 Equipment".
3. **Tanks 6** (KPI and Equipment card) vs the Liquid legend total of **17 tanks** (4+3+4+2+2+2).
4. Grain lists **6 units** (1 each) vs **12** grain storages (7 Bins + 3 Piles + 2 Flats).
5. Grain bar: the coloured fill is **83.2%** of the bar, but the label says **79%**.
   - The label itself is right: 1.40M / 1.78M = 78.65%.
   - The commodity sum is 1,397k, which displays as 1.40M ✓.
   - Segment widths are only roughly proportional (0.212–0.215 px per k).
6. Liquid bar: the coloured fill is about **80–81%** vs the **83%** label. The product sum of 83k matches ✓.
7. Fan bar heights are not exactly linear to hours (±1 px).
8. Device-ID formats differ (3-digit 759/757/753 vs 5-digit 18086).
9. "Missing Fan Switched" is probably a typo for "Missing Fan Switch(es)". The alternate frame says "Missing Fan Switches".

**Data, states B and C**

10. **B grain text says "79% full" but "84% Fill"**. 21,050 / 25,000 = 84.2%; the 79% is a leftover copy. The same applies to C.
11. **B fan tiles show "7 Running Now / 86 h / 410 kWh"** while the B KPI says **"2 of 3"** fans, on an account with 2 equipment.
12. **C "Runtime Today 7 h 24 m"** vs the chart's "Today 86h". The chart is identical across A, B and C.
13. B and C keep Grain "Wheat Storage · 1 unit" while equipment is Bin + Dryer (B) or Bin (C). That is plausible, but C has 1 Bin and no Wheat-storage alert context.
14. **The bell badge shows "2" in all 3 states**, including all-good, and does not match the alert counts.
15. The **Notifications panel** has "Unread Only" ON and 6 items all labelled "Unread", but the badge says 2. Item timestamps are not in order (Feb 25 11:20 am, Feb 25 11:20 am, Feb 25 3:20 pm, Feb 24 3:20 am, Feb 25 8:40 am, Feb 24 3:20 am). The chip says "Promotions" while the tag says "Promotion".
16. The alternate Dashboard frame **7833:12061** has different alert titles, IDs, severities and actions from 6215:58878. Its "No Communication" is marked Critical but uses the warning (amber) icon.

**Visual and style**

17. Two different critical reds: **#C62828** (KPI label, health bars, KPI icon) vs **#DC2626** (alert severity text and icon). The bell badge uses a third red, **#FF0000**.
18. Page background **#F3F4F6** vs the Page-Title strip **#F3F4F4**.
19. KPI strip frame radius 16 vs its shadow rectangle radius 12. Card radius is 12.
20. KPI breakdown numbers are **Regular** in A but **Bold** in B and C.
21. Card subtitle colour is rgba(0,0,0,0.8) on Equipment and Alerts but #4B5563 on Fan, Grain and Liquid.
22. Font mixing: Grain summary in SF Pro, Liquid summary in Roboto, "83% Fill" in Inter. KPI strip and chart in Roboto, card text in SF Pro.
23. Scaled odd sizes:
    - Corn legend and all Liquid legend text: 14.551 / 10.913 px.
    - Liquid swatches 11.719 vs Grain swatches 12.5.
    - Liquid bar 9.375 h, radius 8.203 vs Grain bar 10 h, radius 8.75.
    - Liquid track 10 h inside a 9.375 bar.
24. Equipment card first-row divider: none in A and B, but C has a top border on its only row. The B single alert keeps a bottom border, while the A last alert has none.
25. Page bottom padding is 16 (A) / 28 (B) / 24 (C). The content frame in B and C is 582 high, but its children extend to 586.
26. Grain/Liquid header frames are 33 px but contain 46 px of text (overflow).
27. Layer names are stale, for example B's Bin row is still named "Bins, 7: 3 alerts, 1 offline, 3 healthy".
28. Hidden header and title elements ("Farm Test" switcher, breadcrumb, back arrow, right-side 327×36 frame) exist but are invisible. Confirm they are out of scope.

**Open questions for the brief**

- (a) Font choice: SF Pro licensing, or normalise everything to Roboto.
- (b) Which alert dataset is canonical: 6215:58878 or 7833:12061.
- (c) Notification panel presentation (overlay, scrim, position, width 290, height 768 or full viewport).
- (d) Hover and focus states, and any chart tooltips: none are designed.
- (e) Exact hatch stripe pitch (about 4 px assumed).
- (f) Whether the bar-fill math should follow the labels (recommended) or the Figma pixel widths.

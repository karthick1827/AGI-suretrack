---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T10:48:06.459Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
---

# PRD Quality Review — AGI SureTrack Farm: Web Login & Dashboard

- **PRD:** `_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05/prd.md` (+ `addendum.md`)
- **Rubric:** `.claude/skills/acl-prd/assets/prd-validation-checklist.md`
- **Reviewer:** rubric walker (Reviewer Gate), 2026-11-05
- **Calibration:** client build contract (ACL Digital → AGI), chain-top (feeds architecture → epics → stories), brownfield repo. Exact px/hex/font values in FR consequences are the product here and are not flagged as implementation detail.

## Overall verdict

This PRD is in good shape for a pixel-exact client build. The vision is specific, the precedence rules (Figma, then Jira, then log the inconsistency in §10) settle most arguments before they start, and FR-1..FR-101 are contiguous and unique, each with a testable consequence list. I re-ran the geometry (Login vertical rhythm, the modal's 374 px stack, page heights 1052/860/856, KPI tile widths, and the Health bar, Grain and Liquid formulas) and every figure adds up. The risk is in a handful of **internal contradictions** that leave some consequences impossible to satisfy together:
- chart tooltips are in scope in FR-86/FR-90 but out of scope in §6.2;
- the Roboto weights in FR-4 conflict with NFR-2;
- the hover rules in FR-9 conflict with FR-58;
- the Session contract in addendum A conflicts with addendum C;
- the Runtime chart acceptance in FR-80 conflicts with §8.

Add a broken Assumptions Index and colliding NFR IDs, and the PRD needs one tidy-up pass before the Manager approves it. There are no critical findings. **Gate verdict: conditional pass: fix the 4 high findings and re-run.**

## Decision-readiness — adequate

Decisions are stated as decisions. "For anything visible, the Figma frame wins" (§0), "Figma wins over SCRUM-40's 'card is hidden'" (§4.10) and "Figma's copy and order win over SCRUM-38" (§4.7) are named trade-offs with the losing side identified. §10 Open Questions are real, and the opening line ("The build does not wait for these") is an honest operating rule. Per-feature Notes (Q-S2, Q-N2, Q-G1, Q-Q2) surface genuine tensions with numbers attached.

The gap is escalation. Only one `[NOTE FOR PM]` exists (§6.2, tablet/phone), yet several **approved** Jira ACs are deferred or overridden quietly inside feature Notes or Out-of-Scope lines:
- SCRUM-38 AC6 (relative-time refresh and hover date, Q-A2);
- SCRUM-29 AC5 (resend after 60 s);
- SCRUM-40 AC5 (card hidden vs Empty state);
- SCRUM-38 AC5 (empty-state copy);
- SCRUM-39 AC5/6/8.

In a client delivery, each of these is a conversation AGI needs to have. Separately, the ~95 `[ASSUMPTION]` tags are all presented to AGI with equal weight. Nothing separates the ones that change behaviour from the ones that only change undesigned styling.

### Findings
- **medium** Deferred or overridden Jira ACs are not escalated (§4.3 Out of Scope, §4.7 Notes Q-A2, §4.9 Notes, §4.10 description, §6.2). Approved client stories are being partly unbuilt or contradicted, but only SCRUM-27 AC2 / SCRUM-37 AC7 carry a `[NOTE FOR PM]`. *Fix:* in §6.2, add one line per deferred or overridden AC (SCRUM-29 AC5, SCRUM-38 AC5, SCRUM-38 AC6, SCRUM-39 AC5/6/8, SCRUM-40 AC5), each tagged `[NOTE FOR PM]` with "deferred, not dropped" or "overridden by Figma, AGI to confirm".
- **medium** The assumption load is not triaged (§11, §12). About 95 assumptions go to AGI for "explicit confirmation" with equal weight. Behaviour-affecting ones get lost among focus-ring colours. Examples: lockout counted per browser (FR-30), the check order that prevents account enumeration (FR-24), the 480-minute Session TTL (FR-34), every route shape (FR-57/64/72/75) and the default Dashboard state (FR-93). *Fix:* split §11 into "A. Behaviour / contract assumptions (AGI product must confirm)" and "B. Undesigned-state styling (AGI design may replace)". §12 then points AGI product at list A only.

## Substance over theater — strong

There is no furniture to speak of. The Vision (§1) could only belong to this product: it names the four things the Dashboard answers and why fidelity matters ("so design review doesn't reopen settled decisions"). The three personas are lightweight and each maps to one Dashboard state or flow. NFRs carry product-specific bounds (LCP ≤ 1.5 s, CLS = 0, silo photo ≤ 600 KB, 0.5% pixel diff) rather than boilerplate. The non-goals in §5 do real work ("We are not 'fixing' the data").

### Findings
- **low** The persona contradicts the screen it sees (§2.3 UJ-1). Dale "runs a 12-bin grain operation", but the Full state he lands on shows `7` Bins (FR-62) and the Equipment card lists 7 bins (FR-67). *Fix:* make Dale's operation match the Full data (7 bins, 3 piles, 2 flats, 6 tanks, 2 dryers), or drop the bin count.
- **low** NFR-6 browser support has no acceptance bound (§7 NFR-6). "Latest two versions of Chrome, Edge, Safari and Firefox" is declared supported, but every acceptance check is Chrome on macOS. Nothing says what must pass on Firefox or Windows (behaviour only? a visual tolerance?). *Fix:* add "Behaviour tests (SM-2) pass on all supported browsers; the Fidelity check applies to the Chrome/macOS baseline only."

## Strategic coherence — strong

The thesis is explicit: prove the Design tokens, shell and card components against Figma on dummy JSON, so later screens and the real API drop in. Scope, NFR-7 (data isolation) and SM-4 all follow from it. SM-1 and SM-2 validate fidelity and behaviour rather than activity. The counter-metrics are present and well chosen: SM-C1 balances SM-3 and SM-C2 balances SM-1, each naming the metric it counterbalances. The MVP is clearly an experience/fidelity MVP, and the scope logic matches.

### Findings
- **low** SMs reference FRs only wholesale and SM-4 is unmeasurable this release (§9). SM-1 says "every visual FR in §4", SM-2 says "100% of the testable consequences in §4", SM-3 links to no FR, and SM-4 is "measured … in that later release". *Fix:* tie SM-2 to the FR ranges per feature (e.g. Login FR-11..FR-35, Modal FR-36..FR-49, …). Add a proxy for SM-4 that can be checked now, such as "no screen component imports a `*.json` file directly; lint rule passes" (backs NFR-7). Give SM-3's "3 or more rounds" baseline a source or mark it `[ASSUMPTION]`.

## Done-ness clarity — adequate

FR consequences are exceptionally concrete: coordinates, exact copy, formula plus expected outputs, and accessibility semantics. I spot-checked the arithmetic:
- Login column: 127.039 + 513.922 = 640.961, and every intermediate y matches.
- Modal stack: 72+1+228+1+72 = 374.
- Page heights: 246+464+326+16 = 1052, 860 and 856.
- KPI tile widths sum to 1318 in all three states.
- Health bar widths; Grain segments (round-to-1.25 of k × 0.21386 plus 3.83/3.75 gaps → track at 321.33); Liquid segments (k × 3.515625 plus 3.516 gaps → 312.891).

All of these hold. What pulls this to *adequate* is that several pairs of consequences cannot both be true, so an engineer or QA cannot know which one defines "done".

### Findings
- **high** Roboto weights: FR-4 contradicts NFR-2 and the FRs that need 700/800 (FR-4 consequence 1, §4.1 Notes vs §7 NFR-2, §4.4 Conventions). FR-4 says "Roboto at weights 400, 500 and 600 is self-hosted", and §4.1 Notes leaves 700/800 open. NFR-2 and the §4.4 Conventions say "Roboto 400/500/600/700/800 … self-hosted". FR-53 (badge 800), FR-57, FR-71, FR-77, FR-81, FR-89 and FR-92 (700) can't meet the Fidelity check with synthesised bold. *Fix:* change FR-4 consequence 1 to 400/500/600/700/800 and close the §4.1 Note. Because this departs from approved brief rule 4 (400/500/600), add a `[NOTE FOR PM]` recording the deviation.
- **high** Hover behaviour: FR-9 contradicts FR-58 (FR-9 consequence 4 vs FR-58 consequence 3). FR-9 sits in the Design Foundation, which applies to "every screen in this build" (§4.1 description). It says hover "changes only the cursor to `pointer`; no colour, underline or background change". FR-58 says Equipment and Alert rows hover to `#F0FFF8` and View All / Action links underline. A shared link/button component can't satisfy both. *Fix:* scope FR-9's hover and focus-colour consequences explicitly to "Login page and Forgot Password modal". Alternatively, rewrite FR-9 as the global default and name FR-58 as the Dashboard exception.
- **medium** The Runtime chart acceptance contradicts FR-80 (§4.8 description, §8 check 4, FR-94 vs FR-80). FR-80 says bar heights are `barPx` from the data with "0 px tolerance", and the formula is only a fallback. The §4.8 description says "Bar heights come from the formula `round(hours / max(hours) × 79)`". §8 check 4 says each bar "matches the pixel value computed by its formula … within ±1 px". The formula gives 65/71/75 where Figma has 66/72/76 (Q-N2), so a build following §8 passes while failing FR-80. FR-94 also omits `barPx` from its chart-input list. *Fix:* reword the §4.8 description and §8 check 4 to "Runtime chart bars equal `barPx` exactly; Health and Fill bar segments within ±1 px of their formula", and add `barPx` and `segmentTopPx` to FR-94's chart-input list.
- **medium** The bell can't close the Notifications panel as specified (FR-53 last consequence vs FR-97, §7 NFR-5). FR-97 puts the panel at `right 0, top 0, width 290`, "above the Header". It covers x 1076–1366, which includes the bell (≈ x 1254–1274) and the avatar. NFR-5 also says "the modal and panel trap focus". So "activating [the bell] while the panel is open closes the panel" is unreachable by both pointer and keyboard. *Fix:* delete the toggle-close clause from FR-53. Alternatively, if Figma allows, offset the panel below the Header and remove "panel" from NFR-5's focus-trap list, since FR-97 is otherwise non-modal: no scrim, page scrollable, outside click ignored.
- **medium** Wider-viewport behaviour contradicts the layout FRs (§7 NFR-1 "Wider viewports" vs FR-50, FR-51, FR-97). NFR-1 requires content to "keep Figma's left alignment and margins and must not stretch". FR-50 specifies "no max-width container", and FR-51's `justify-content:space-between` at 100% width does stretch. FR-50 also says other widths are "not required to adapt". *Fix:* either drop the NFR-1 wider-viewport bullet, or add to FR-50: "the app shell is a fixed 1366 px wide, left-aligned box; the area to its right shows the page background `#F3F4F6`".
- **medium** Approximate or UNKNOWN values inside "testable" consequences that §8 audits at ±1 px:
  - FR-87: Legend item height "≈42–45 (exact value UNKNOWN)";
  - FR-53: "about 16 px";
  - FR-65 and FR-83: "~46 visible";
  - FR-79: "≈118 px".

  §8 check 2 applies ±1 px to "every element listed in §4". *Fix:* replace each with the exact value measured from the Reference render, or mark it "informative, not audited" and exclude it from the §8 measurement table.
- **low** FR-4's last consequence is garbled: "Text is not shown in a fallback font while web fonts load in a way that is captured by a Fidelity check". It is unclear what is being tested. *Fix:* "The Fidelity check captures only after `document.fonts.ready`; with `font-display: block` (NFR-2) no fallback-font frame is painted."
- **low** FR-49's tab order includes Submit, but FR-46 makes Submit disabled while the email is invalid. A native `disabled` button is not focusable, so the stated order fails at rest. *Fix:* state in FR-46 that disabled is exposed via `aria-disabled="true"` (still focusable), or drop Submit from the at-rest tab order.

## Scope honesty — adequate

Non-goals (§5) are explicit and meaningful, and hidden layers are listed as not rendered (FR-8, FR-15, §6.2). `[ASSUMPTION]` is used faithfully on undesigned states. The one material failure is a direct in/out contradiction on chart tooltips. The open-item density is high (about 95 assumptions, 7 Open Question groups) for a green-light-to-build PRD. The PRD handles this with an explicit "build does not wait" rule and an approval table, so it is not a blocker, but see the triage finding above.

### Findings
- **high** Chart tooltips are both in and out of scope (§6.2 vs FR-86, FR-90, §4.9/§4.10 descriptions). §6.2 says "Chart hover tooltips (SCRUM-39 AC3, SCRUM-40 AC2) … are deferred until designed." FR-86 specifies the Grain tooltip (format, share formula, style). FR-90 consequence 6 specifies the Liquid tooltip, and both feature descriptions promise them. *Fix:* choose one option.
  - (a) Keep them as minimal `[ASSUMPTION]` defaults, consistent with FR-9 and §5. Delete the §6.2 bullet and move "tooltip design" to §10 item 4.
  - (b) Defer them. Delete FR-86 and the FR-90 tooltip bullet, and add `[NOTE FOR PM]` that SCRUM-39 AC3 and SCRUM-40 AC2 are deferred. FR IDs must stay stable, so mark FR-86 "withdrawn" rather than renumbering.
- **low** `/` routing is stated three ways (FR-11, FR-56, addendum C.1):
  - FR-11: no Session → `/login`;
  - FR-56: Session → `/dashboard`, else `/login`;
  - C.1: `/` → `/dashboard` → `/login`.

  C.1's chain makes FR-11 remember `/dashboard` as the requested page. The outcome is the same today, but the three statements diverge. *Fix:* make FR-56 the single source and have FR-11 and C.1 reference it.

## Downstream usability — adequate

FR IDs are clean: FR-1..FR-101 are contiguous, unique and in order, and every FR-n cross-reference (including those in addendum.md) resolves. UJ-1..UJ-3 all resolve and each has a named protagonist. The glossary is strong and mostly obeyed: Login page, Dashboard state, Health bar/segment, Alert row, Action link, Stat tile, KPI tile, Nav tab, Fill bar, Filter chip, Notification item and Reference render are used verbatim in nearly every occurrence. The downstream risks are the NFR namespace, the addendum's internal conflict on the Session, and an Assumptions Index that cannot be round-tripped.

### Findings
- **high** The Session contract contradicts itself across the addendum and FRs (addendum A.4 rule 5 and FR-25/FR-34/FR-35 vs addendum C.2).
  - A.4 says the Session holds `username, displayName, dashboardState, issuedAt, expiresAt` and "is shared by all tabs of the same browser and survives reload".
  - C.2 stores it "in `sessionStorage` … as `{ username, dashboardState, signedInAt }`".
  - `sessionStorage` is per tab, so any new tab (middle-clicking a Nav tab, a second window) lands on `/login`. That contradicts A.4 and makes FR-35's "every other open SureTrack tab" scenario rare.
  - C.2 also drops `displayName` (required by FR-25) and `expiresAt` (FR-34).

  Architecture will source-extract C.2 and build the wrong thing. *Fix:* change C.2 to `localStorage` key `suretrack.session` holding exactly the A.4 field set. Alternatively, if per-tab is intended, amend A.4 rule 5, FR-56 and FR-35, and record the decision.
- **medium** NFR IDs collide and are not contiguous (§4.1 NFR-1/NFR-2 vs §7 NFR-1/NFR-2; §4.2 NFR-11..13; §4.3 NFR-36..37; §4.4/§4.6 unnumbered).
  - "NFR-2" means "silo photo ≤ 600 KB" in §4.1 and "Fonts" in §7.
  - "NFR-1" means "fonts self-hosted" in §4.1 and "Reference viewport" in §7.
  - Addendum C.2 cites NFR-7 and SM-4 cites NFR-7; these resolve only to §7 by luck.
  - The §4.4 and §4.6 NFRs have no IDs.

  *Fix:* renumber the feature-specific NFRs into a separate range (e.g. NFR-101.., or NFR-L1/NFR-M1) or fold them into §7. Give the §4.4 and §4.6 NFRs IDs.
- **medium** The route contract in the addendum does not match the FRs (addendum C.1 vs FR-57, FR-75). C.1's protected routes are `/equipment/:id`, `/alerts/:id/:action` and `/profile`. FR-75 navigates to `/equipment/<deviceId>/<actionKey>`, FR-57 lists `/equipment/<deviceId>/hotspot|fans|connection|fan-switches`, and neither mentions `/alerts/:id/:action` or `/profile`. *Fix:* make C.1's route list identical to FR-57's, or have C.1 say "routes per FR-57" with no list of its own.
- **medium** Simulated latency is defined twice with different values (addendum A.1 `policy.simulatedLatencyMs` 800, used by FR-23/FR-47, vs addendum C.2 "300 ms in development, 0 ms in Fidelity tests"; NFR-4 "Dashboard renders from JSON in ≤ 300 ms"). It is unclear whether C.2 applies to `getUsers()` (overriding 800) or only to Dashboard and Notifications. With 300 ms of latency, the Dashboard cannot meet NFR-4's 300 ms. *Fix:* state in C.2 that sign-in and forgot-password use `policy.simulatedLatencyMs`, that Dashboard and Notifications use a separate dev-only delay, and that NFR-4 is measured with that delay at 0.
- **medium** UJ-3 is not realized by any FR, and two FRs carry a duplicated tag (FR-57, FR-58 "Realizes UJ-1, UJ-1"; FR-61, FR-77, FR-92). The All-good path (Priya) is implemented by FR-61 (All-good tile), FR-77 and FR-92, but every Dashboard FR says "Realizes UJ-1" only. FR-57 and FR-58 read "UJ-1, UJ-1" (likely meant UJ-1, UJ-3). *Fix:* add UJ-3 to FR-61, FR-63, FR-77, FR-92 and FR-93, and correct the duplicated tags in FR-57 and FR-58.
- **medium** Glossary drift and term collisions (multiple places).
  - **"Header"** is the glossary term for the 64 px top bar, but it is reused for the modal header (FR-38 "Header and title", "Header: x 0, y 0, 600×72") and the card header (FR-65 "Header ("Margin")", FR-73, FR-83, FR-88, FR-92).
  - **Undefined recurring terms:** "alert banner" (11×, FR-26..FR-34), "page-title strip"/"title strip" (about 16×), "Coming soon placeholder" (FR-57, FR-64, FR-72, FR-75, FR-76), "card shell" (FR-65, FR-95), "SF stack" (defined only in the §4.4 conventions).
  - **Synonyms:**
    - "pixel diff" and "screenshot comparison" for the Fidelity check (FR-10, §8, SM-C2);
    - "Grain card" (§4.10 description) for Grain On Hand card;
    - "Fan Activity Card" (§4.8 heading) vs the glossary's "Fan activity card";
    - "dummy account" in lowercase (FR-93);
    - "Alerts card" (×5) for Recent Alerts card;
    - "segment" used alone for both Health segment and Fill bar segments.

  *Fix:* add glossary entries for Alert banner, Page-title strip, Placeholder page, Card shell, Card header, Modal header and SF stack. Replace the synonyms with the glossary term. Rename the §4.8 heading to "Fan activity card".
- **medium** The Assumptions Index cannot be round-tripped (§11). It looks machine-extracted.
  - **Truncated and broken text:** entries are cut mid-sentence (e.g. FR-9 "…change the "), and stripped tags leave artefacts ("route shapes are ):", "(``)", "Menu presentation remains  until design confirms").
  - **Mislocated entries:** "NFR-11" is filed under FR-35 and "NFR-2: silo photo" under FR-10.
  - **Non-assumptions indexed:** the §4.5 and §4.11 descriptions, the §10 preamble, the §12 table row, the §5 bullet, the §4 conventions note and FR-58's Q-S3 note.
  - **Inline tags missing from the index:** FR-64 (second tag), FR-72 ("route shape ASSUMPTION") and FR-75 (two "route shape ASSUMPTION" tags).
  - **Addendum assumptions:** they are never indexed (A.1 layout, B `/data/` location, B `typeKey`/`actionKey`/`segmentPx`, C.1 react-router, C.2 latency), although §0 says "§11 indexes them all".

  *Fix:* rebuild §11 by hand. Use one row per tag, with the full assumption text, the correct location (FR-n, NFR-n, or addendum §), and an "Owner: AGI product / AGI design" column to support the triage split above.

## Shape fit — strong

The shape matches the product. Three light UJs suit a consumer-facing monitoring app with one primary operator role. A feature-grouped FR set with exhaustive consequences suits a pixel contract, and the addendum keeps data contracts and implementation notes out of the FR body. The PRD is brownfield-aware (existing React 19 / Vite repo, addendum C.1) and chain-top. Downstream traceability is the right emphasis, and the PRD invests in it. Its size (1,559 lines) is earned by the fidelity goal. The structural risk is duplication: values are restated from the brief addendum, so a Figma revision has to be applied in two places. §0 already names the brief addendum as the source, which mitigates this.

### Findings
- **low** FR-10 overlaps §8 and the two have drifted (FR-10 vs §8 check 1, addendum C.4). FR-10 masks only the silo photo, while §8 masks the silo and avatar rasters. FR-10 maps to the saved renders in `figma-reference/` (which C.4 says are oversized, e.g. 1374×1054), while §8 requires re-exported 1× renders with no shadow overflow. *Fix:* reduce FR-10 to "passes §8 for every frame in the §8 table", and make §8 name the re-exported baseline files explicitly.

## Mechanical notes

- **FR IDs:** FR-1..FR-101 are present, unique and sequential, and all FR cross-references in prd.md and addendum.md resolve. ✔
- **UJ IDs:** UJ-1/2/3 are defined and every reference resolves. UJ-3 is referenced only in §2.3 and the §4 conventions (see the Downstream finding). FR-57 and FR-58 have the duplicated "UJ-1, UJ-1" tag.
- **NFR IDs:** these collide (NFR-1, NFR-2) and are non-contiguous (11–13, 36–37); some feature NFRs are unnumbered.
- **Counter-metrics:** present (SM-C1, SM-C2), each naming the SM it counterbalances. ✔
- **Value drift between sections (low):**
  - §4.11 description says the default state is "`full`", but FR-93/FR-25 say the default is the Dummy account's `dashboardState`, then `full`.
  - §10 Q1 says the Liquid fill is "81%", but FR-90 computes 309.38/386 = **80.2%**.
  - §4.9 description says "3.75 px gaps", but FR-85 has 3.83 after segment 1, then 3.75.
  - Logo width appears three ways: FR-6 `392.429`, FR-15 logo `392.4305`, column `392.4285` (within ±1 px, but pick one).
  - Login load time has two targets: §4.2 NFR-11 "stable within 2 s on broadband" vs §7 NFR-4 "LCP ≤ 1.5 s, local build".
  - FR-94 says "`kpi.*.value` … render as their plain integer", but `kpi.fans.value` is a string (addendum B.1 rule 2 correctly excludes it).
- **Token name collision (low):** FR-2 defines button `md` = 10 and Dashboard `md` = 6. Since addendum C.1 names CSS custom properties after the Figma variables, these collide. Namespace them (e.g. `--button-md`, `--dash-md`).
- **Arithmetic to verify (low):** FR-52 places the Nav tab group at x 514.5. That only closes if the right block is 68 px wide. FR-53/FR-54 give bell 20 + gap 20 + avatar holder 48 = 88, which yields x 504.5 under `space-between`. Re-measure against the Figma frame and correct either FR-52 or the right-block widths.
- **Requirement duplication (low):** FR-11 and FR-56 both specify redirect-and-remember for protected routes. Keep one as the source and cross-reference it from the other.
- **Minor behaviour gap (low):** FR-52's Dashboard Nav tab navigates to `/dashboard` and drops any `?state=`. Say whether the query is preserved.
- **Unused source (low):** §0 lists SCRUM-5 as a source, but nothing else in the PRD references it. Cite where it applies or remove it.
- **Assumptions Index round-trip:** fails (see the Downstream finding). Missing: FR-64 (1 of 2), FR-72, FR-75 (2). Spurious: 7 non-assumption entries. Truncated: about 30 entries.
- **Required sections:** all present for the stakes: Purpose, Vision, Users/UJs, Glossary, Features/FRs, Non-Goals, Scope, NFRs, Acceptance (§8), SMs and counter-metrics, Open Questions, Assumptions Index, Approvals. ✔
- **Frontmatter:** `status: In Review`, which is a valid enum value. It was not modified by this review.

## Finding counts

- **Critical:** 0
- **High:** 4 (chart tooltips scope; Roboto weights FR-4 vs NFR-2; hover FR-9 vs FR-58; Session contract A.4 vs C.2)
- **Medium:** 12
- **Low:** 18 (7 in dimension sections, 11 in Mechanical notes)

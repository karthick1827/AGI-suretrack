---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:10.629Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Equipment list – storage cards (Bin, Pile, Flat)
type: feature
created: 2026-11-05
story_id: 1.32
epic_id: 1
jira_key: SCRUM-32
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.32: Equipment list – storage cards (Bin, Pile, Flat)

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-32](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-32) | In QA | Danish | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** each bin, pile and flat storage shown as a card with its key readings, **so that** I can check my grain at a glance.

Trace: US-STO-01, US-OFF-04 · AGI-R02, AGI-R12, AGI-R19 · API-03, API-06, API-13, API-19 · Design: 4_AGI_Web_Equipment_Card

## Acceptance Criteria

- [ ] Given I open Equipment, then I see the page title, an "Equipment | Groups" switch, a Search field, a grid / list view toggle and a filter button. Equipment is selected and grid view is the default.
- [ ] Given the page loads, then equipment is grouped into sections with a count and a divider: storage, Dryer, Tank. Sections with no equipment are hidden.
- [ ] Given the design labels the storage section "Bins (5)" but it holds bins, piles and flats, then the heading reads "Storage (5)" (wording TBC with design).
- [ ] Given a desktop browser 1366 px wide, then cards flow 3 per row; 2 per row from 768 px; 1 per row below 768 px.
- [ ] Given a storage card, then it shows the type icon, name and chevron; "ID | Type | Commodity | Location"; the operation mode band, green when the mode is running; Inventory with fill bar and "% Fill"; Avg. Temp. and Avg. Moisture; and the Accessory chips.
- [ ] Given a pile, then the Accessory chips are grouped with counts (e.g. A 5, M 12, off 3).
- [ ] Given the equipment has an active alert, then a red tab above the card names it (e.g. "Hotspot Detected").
- [ ] Given a reading is missing, then it shows "—"; given the device only measures temperature, then Avg. Moisture is hidden.
- [ ] Given the device has stopped reporting, then the card shows "Offline" with the last reported time and the readings greyed as last known.
- [ ] Given I hover a card, then it highlights. The whole card is a link to the equipment's detail page, so Ctrl / Cmd-click opens it in a new tab and Tab + Enter opens it from the keyboard.
- [ ] Within a section, cards with alerts come first (Critical, then Warning), then by name A–Z (TBC).
- [ ] Given the data is loading, then placeholder cards show. Given the request fails, then I see "Couldn't load your equipment" with Retry. Given there's no equipment, then I see "No equipment on this account yet."

## Attachments

- [SCRUM-32_WEB-EQP-01_Manual_Test_Cases.xlsx](attachments/SCRUM-32/SCRUM-32_WEB-EQP-01_Manual_Test_Cases.xlsx) (12 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.32 imported from JIRA ticket SCRUM-32 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:41.043Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Dashboard – grain on hand
type: feature
created: 2026-11-05
story_id: 1.39
epic_id: 1
jira_key: SCRUM-39
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.39: Dashboard – grain on hand

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-39](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-39) | In Progress | Sais Raja R | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** to see how much grain I have across all storage, by commodity, **so that** I know my inventory without adding up each bin.

Trace: US-DASH-06 · AGI-R12 · API-03, API-06 · Design: 3_AGI_Web_Dashboard

## Acceptance Criteria

- [ ] Given I have storage, then the Grain On Hand card shows the total and capacity ("1.40M bu of 1.78M bu · 79% full") and "79% Fill".
- [ ] Given the card, then a bar is split by commodity in proportion to bushels, with unfilled capacity as grey track.
- [ ] Given I hover a bar segment, then a tooltip shows the commodity, amount and its share of capacity.
- [ ] Given the legend, then each commodity shows its colour, name, amount and unit count ("Canola 340k bu · 1 unit"), largest first, in two columns.
- [ ] Numbers show as "1.40M" and "340k". The unit is bushels unless the user's preference is metric (TBC).
- [ ] The total includes bins, piles and flats. Storage without an inventory reading is left out (with a note, TBC).
- [ ] Commodity colours come from one shared colour map, so Corn is the same colour everywhere.
- [ ] Given more than 6 commodities, then the top 5 show and the rest are grouped as "Other" (TBC). Given I have no storage, then the card is hidden.

## Attachments

_No attachments in Jira._

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.39 imported from JIRA ticket SCRUM-39 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:46.746Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Dashboard – liquid on hand (tanks)
type: feature
created: 2026-11-05
story_id: 1.40
epic_id: 1
jira_key: SCRUM-40
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.40: Dashboard – liquid on hand (tanks)

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-40](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-40) | In Progress | Sais Raja R | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer with tanks, **I want** to see total liquid on hand by product, **so that** I can plan refills.

Trace: US-DASH-06, US-TNK-01 · AGI-R41 · API-12 · Design: 3_AGI_Web_Dashboard

## Acceptance Criteria

- [ ] Given I have tanks, then the Liquid On Hand card shows the total and capacity ("83k gal of 100k gal · 83% full") and "83% Fill".
- [ ] Given the card, then a bar is split by product (e.g. Propane, Fuel Oil, Water, Kerosene, Gasoline, Diesel), with unfilled capacity as grey track; hovering a segment shows a tooltip.
- [ ] Given the legend, then each product shows its colour, name, volume and tank count ("Propane 20k gal · 4 tanks", "1 tank" when singular).
- [ ] Volume is shown in the user's unit (gallons or litres).
- [ ] Given I have no tanks, then the card is hidden. An unknown product shows in grey with the server's name.

## Attachments

_No attachments in Jira._

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.40 imported from JIRA ticket SCRUM-40 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

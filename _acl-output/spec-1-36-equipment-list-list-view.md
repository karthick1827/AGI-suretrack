---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:26.719Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Equipment list – list view
type: feature
created: 2026-11-05
story_id: 1.36
epic_id: 1
jira_key: SCRUM-36
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.36: Equipment list – list view

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-36](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-36) | In Progress | Danish | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer with a lot of equipment, **I want** a compact list view, **so that** I can scan more equipment on one screen.

Trace: US-STO-01 · Design plan – List View · API-03, API-06, API-11, API-12 · Design: 5_AGI_Web_Equipment_List

## Acceptance Criteria

- [ ] Given I click the list icon in the grid / list toggle, then the page switches to list view; the selected icon is highlighted.
- [ ] Given list view, then each section shows one row per item: icon, name and meta line; operation mode as a pill (green when running); Inventory or Fill bar with its label; the type's metrics; Accessory chips; chevron.
- [ ] Given a storage row, then the metrics are Avg. Temp. and Avg. Moisture. A dryer row shows the 2 × 2 Inlet / Outlet Moisture and Temp. grid. A tank row shows Avg. Temp., Power and Days to Empty.
- [ ] Given an item has an active alert, then a red tab above its row names the alert.
- [ ] Given I hover a row, then it highlights; the whole row is a link to the detail page, as with cards.
- [ ] Given I switch between grid and list, then search, filters and sections stay as they were.
- [ ] Given I come back to Equipment later, then my last choice of grid or list is remembered.
- [ ] Given a screen narrower than 1024 px, then rows stack their content onto two lines (layout TBC with design) so nothing is cut off or scrolls sideways.

## Attachments

- [SCRUM-36_WEB-EQP-05_Manual_Test_Cases.xlsx](attachments/SCRUM-36/SCRUM-36_WEB-EQP-05_Manual_Test_Cases.xlsx) (11 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.36 imported from JIRA ticket SCRUM-36 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

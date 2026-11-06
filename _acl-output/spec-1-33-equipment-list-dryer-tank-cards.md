---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:16.158Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Equipment list – dryer & tank cards
type: feature
created: 2026-11-05
story_id: 1.33
epic_id: 1
jira_key: SCRUM-33
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.33: Equipment list – dryer & tank cards

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-33](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-33) | In Progress | Danish | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer with dryers and tanks, **I want** them on the Equipment page with the readings that matter for each, **so that** I can watch all my equipment in one place.

Trace: US-DRY-01, US-DRY-02, US-TNK-01 · AGI-R29, AGI-R30, AGI-R41 · API-11, API-12 · Design: 4_AGI_Web_Equipment_Card

## Acceptance Criteria

- [ ] Given I have dryers, then they appear in a "Dryer (n)" section. Each card shows the dryer icon, name, "ID | Dryer | Location" and the operating state in the mode band (e.g. Batch Drying).
- [ ] Given a dryer card, then it shows Inventory with a fill bar and a 2 × 2 grid: Inlet Moisture, Outlet Moisture, Inlet Temp., Outlet Temp. Moisture is shown in %, temperature in the user's unit.
- [ ] Given I have tanks, then they appear in a "Tank (n)" section. Each card shows the tank icon, name, "ID | Tank | Product | Location" and the mode band (e.g. Monitoring).
- [ ] Given a tank card, then it shows a Fill bar labelled with percent and capacity ("68% of 800 Gal") and three values: Avg. Temp., Power (ON / OFF) and Days to Empty. Tanks have no Accessory row.
- [ ] Given a tank is below its lower or above its upper threshold, then the fill bar shows a warning state (design TBC).
- [ ] Dryer and tank cards follow WEB-EQP-01 for alert tabs (e.g. "Low Static Pressure", "Load Control Event"), offline state, missing values, sorting, hover, links and keyboard use.

## Attachments

- [SCRUM-33_WEB-EQP-02_Manual_Test_Cases.xlsx](attachments/SCRUM-33/SCRUM-33_WEB-EQP-02_Manual_Test_Cases.xlsx) (11 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.33 imported from JIRA ticket SCRUM-33 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

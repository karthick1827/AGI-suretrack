---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:31.559Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Dashboard – equipment health summary
type: feature
created: 2026-11-05
story_id: 1.37
epic_id: 1
jira_key: SCRUM-37
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.37: Dashboard – equipment health summary

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-37](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-37) | In Progress | Sais Raja R | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** a summary of how much equipment needs attention and how each type is doing, **so that** I know at a glance where to look.

Trace: US-DASH-06, US-DASH-02, US-DASH-04 · AGI-R02, AGI-R03, AGI-R05 · API-02, API-13, API-19 · Design: 3_AGI_Web_Dashboard

## Acceptance Criteria

- [ ] Given I open Dashboard, then a summary strip shows: equipment needing attention with the critical count ("7 Need attention · 2 critical"); total equipment with the count per type (Bins, Piles, Flats, Tanks, Dryers); Online; Offline; and fans running ("7 of 24 Fans running now").
- [ ] Given I click a tile in the strip, then the matching page opens: Need attention → Alerts; a type count → Equipment at that section; Online or Offline → Equipment (offline filter TBC).
- [ ] Given the Equipment card ("Equipment (20) · Health by type"), then each type I have shows its count and a bar split red (alert), grey hatched (offline) and green (healthy), with text such as "3 alerts · 1 offline · 3 healthy".
- [ ] Given a category is zero, then it is left out of the text, and singular / plural are correct ("1 alert").
- [ ] Each item is counted once: alert first, then offline, then healthy (precedence TBC). Totals in the strip and the card always agree with the Equipment page.
- [ ] Given I click a row, then Equipment opens at that type's section. View All opens Equipment.
- [ ] Given a tablet, then the strip wraps onto two rows; on a phone the tiles stack. The two top cards sit side by side from 1024 px and stack below that.
- [ ] Given the data is loading or fails, then the strip and card show placeholders or an error with Retry, without blocking the rest of the Dashboard.

## Attachments

_No attachments in Jira._

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.37 imported from JIRA ticket SCRUM-37 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

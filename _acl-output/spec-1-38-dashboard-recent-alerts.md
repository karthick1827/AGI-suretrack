---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:36.633Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Dashboard – recent alerts
type: feature
created: 2026-11-05
story_id: 1.38
epic_id: 1
jira_key: SCRUM-38
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.38: Dashboard – recent alerts

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-38](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-38) | In Progress | Sais Raja R | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** my most urgent alerts on the Dashboard with a link to what to do next, **so that** I can respond straight away.

Trace: US-DASH-02, US-ALR-01, US-DASH-05 · AGI-R03, AGI-R28 · API-13 · Design: 3_AGI_Web_Dashboard

## Acceptance Criteria

- [ ] Given I have active alerts, then the Recent Alerts card ("Most urgent first. Each item links to what to do next.") shows the top 4 (TBC): Critical before Warning, newest first within each, with View All opening Alerts.
- [ ] Given an alert row, then it shows a severity icon (red Critical, amber Warning), the title, "ID | Equipment name", the severity label and how long ago it was raised.
- [ ] Given an alert row, then it has an action link matched to its type: View Hotspot, Check Fans, Check Connection, Check Fan Switches. Clicking it opens that screen for the equipment; clicking elsewhere on the row opens the equipment's detail page.
- [ ] Given I hover a row or link, then it highlights; the action links are reachable by keyboard.
- [ ] Given there are no active alerts, then the card shows "No active alerts".
- [ ] Dryer alarms are included (AGI-R28). Relative times update every minute; hovering a time shows the full date and time.

## Attachments

_No attachments in Jira._

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.38 imported from JIRA ticket SCRUM-38 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

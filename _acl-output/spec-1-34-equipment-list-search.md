---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:19.987Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Equipment list – search
type: feature
created: 2026-11-05
story_id: 1.34
epic_id: 1
jira_key: SCRUM-34
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.34: Equipment list – search

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-34](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-34) | To Do | N Karthick | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** to search my equipment by name or ID, **so that** I can find a specific bin, dryer or tank quickly.

Trace: US-STO-02 · Design plan – Search & Filters · API-03 · Design: 4_AGI_Web_Equipment_Card, 5_AGI_Web_Equipment_List

## Acceptance Criteria

- [ ] Given I type in Search, then the page narrows as I type (about 300 ms after I stop), matching any part of the name or ID, ignoring case.
- [ ] Given results, then section counts update (e.g. "Dryer (1)") and sections with no matches are hidden.
- [ ] Search works in both grid and list view, within the selected Equipment or Groups tab, and together with any filters.
- [ ] Given text is entered, then a clear (✕) button appears; clicking it or pressing Esc empties the field and shows everything again.
- [ ] Given nothing matches, then I see "No equipment matches '<text>'" with a Clear Search button.
- [ ] The search text is kept in the page address, so it survives a page refresh and Back from a detail page, and can be shared as a link.

## Attachments

- [SCRUM-34_WEB-EQP-03_Manual_Test_Cases.xlsx](attachments/SCRUM-34/SCRUM-34_WEB-EQP-03_Manual_Test_Cases.xlsx) (11 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.34 imported from JIRA ticket SCRUM-34 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:07.080Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Privacy Policy & Terms of Service
type: feature
created: 2026-11-05
story_id: 1.31
epic_id: 1
jira_key: SCRUM-31
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.31: Privacy Policy & Terms of Service

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-31](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-31) | To Do | N Karthick | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** user, **I want** to read the Privacy Policy and Terms of Service from the Login page, **so that** I know what I'm agreeing to when I sign in.

Trace: US-AUTH-07 · WBS – More Information, Privacy, Terms · Design: 1_AGI_Web_Login

## Acceptance Criteria

- [ ] Given I am on Login, then I see "By clicking login, you hereby agree to our Privacy Policy | Terms of Service" with both names as links.
- [ ] Given I click a link, then the document opens in a new browser tab and the Login page keeps what I typed.
- [ ] Given I'm offline, then the new tab shows the browser's offline page; the Login page is unaffected.
- [ ] The links are reachable by keyboard, have a visible focus ring and open the current documents without a code release.

## Attachments

- [SCRUM-31_WEB-AUTH-05_Manual_Test_Cases.xlsx](attachments/SCRUM-31/SCRUM-31_WEB-AUTH-05_Manual_Test_Cases.xlsx) (11 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.31 imported from JIRA ticket SCRUM-31 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

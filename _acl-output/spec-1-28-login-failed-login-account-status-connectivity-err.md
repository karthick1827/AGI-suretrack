---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:54:55.035Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Login – failed login, account status & connectivity errors
type: feature
created: 2026-11-05
story_id: 1.28
epic_id: 1
jira_key: SCRUM-28
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.28: Login – failed login, account status & connectivity errors

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-28](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-28) | In Review | Karthik Raja | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** a clear message when sign-in fails or my session ends, **so that** I know whether to retry, reset my password or call support.

Trace: US-AUTH-01, US-AUTH-04 · AGI-R01 · API-01 · Design: 1_AGI_Web_Login (error states need design)

## Acceptance Criteria

- [ ] Given wrong credentials, then I see "Username or password is incorrect" without saying which. The username stays; the password is cleared and focused.
- [ ] Given my account is locked, then I see that it is locked, when I can try again (if the API says) and SureTrack Coach (855) 293-5607.
- [ ] Given my account is inactive or has no active subscription, then I see "Your account is inactive. Contact SureTrack Coach." and I am not signed in.
- [ ] Given my password has expired, then I see "Your password has expired" with a link that opens Forgot Password.
- [ ] Given too many attempts, then I see when I can try again, and Login is disabled until then.
- [ ] Given the browser is offline or the server doesn't respond within the timeout (15 s, TBC), then I see a connection or timeout message and can retry.
- [ ] Given my session expires while I'm using SureTrack, when my next action needs the server, then I return to Login with "Your session has expired. Please sign in again." and go back to the same page after signing in.
- [ ] Errors show in an alert banner above the form that screen readers announce, and the Login button is enabled again.

## Attachments

- [SCRUM-28_WEB-AUTH-02_Manual_Test_Cases.xlsx](attachments/SCRUM-28/SCRUM-28_WEB-AUTH-02_Manual_Test_Cases.xlsx) (11 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.28 imported from JIRA ticket SCRUM-28 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

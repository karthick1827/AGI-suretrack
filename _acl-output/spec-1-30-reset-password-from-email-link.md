---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:03.605Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Reset password from email link
type: feature
created: 2026-11-05
story_id: 1.30
epic_id: 1
jira_key: SCRUM-30
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.30: Reset password from email link

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-30](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-30) | To Do | N Karthick | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** the link in my reset email to open a SureTrack page where I set a new password, **so that** I can sign in again.

Trace: US-AUTH-03 · AGI-R18 · API-01 · Design: missing – no web Reset Password page in the provided set

## Acceptance Criteria

- [ ] Given I click the reset link, then the Reset Password page opens in my browser and checks the link before showing the form, with a loading state.
- [ ] Given the link is valid, then I see New Password and Confirm Password, with the password rules listed and ticked as I type.
- [ ] Given the passwords don't match or a rule isn't met, then Submit stays disabled and I see what's wrong.
- [ ] Given I submit a valid password, then I go to Login with "Password updated. Sign in with your new password."
- [ ] Given the link is expired, already used or invalid, then I see "This link has expired or was already used" and a button that opens Forgot Password.
- [ ] Given I am already signed in in this browser, then the page asks me to confirm signing out before resetting.
- [ ] Once the page has read the link, the reset token is removed from the address bar and isn't passed to other sites.

## Attachments

- [SCRUM-30_WEB-AUTH-04_Manual_Test_Cases.xlsx](attachments/SCRUM-30/SCRUM-30_WEB-AUTH-04_Manual_Test_Cases.xlsx) (11 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.30 imported from JIRA ticket SCRUM-30 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

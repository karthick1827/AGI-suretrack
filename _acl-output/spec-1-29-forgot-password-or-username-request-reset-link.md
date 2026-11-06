---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:54:59.578Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Forgot password or username – request reset link
type: feature
created: 2026-11-05
story_id: 1.29
epic_id: 1
jira_key: SCRUM-29
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.29: Forgot password or username – request reset link

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-29](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-29) | To Do | N Karthick | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer who forgot my password or username, **I want** to request a reset link by email, **so that** I can get back into my account.

Trace: US-AUTH-02 · AGI-R18 · API-01 · Design: 2_AGI_Web_Forgot_Password

## Acceptance Criteria

- [ ] Given I am on Login, when I click "Forgot Password or Username?", then a modal opens over the page titled "Forgot Your Password or Username?" with the intro text, a required Email field (placeholder "Eg. example@mail.com") with a help icon, "Need additional help? SureTrack Coach (855) 293-5607", Cancel and Submit.
- [ ] Given I hover or focus the help icon, then a tooltip explains which email to use (text TBC).
- [ ] Given the email is empty or badly formed, then Submit stays disabled; leaving the field shows "Enter a valid email address".
- [ ] Given a valid email, when I click Submit, then I see a loading state and then the same confirmation for any email: "If an account exists for this email, we've sent a reset link. Check your inbox and spam folder."
- [ ] Given the confirmation is showing, then I can close the modal or resend after 60 seconds (TBC).
- [ ] Given I click Cancel, press Esc or click outside the modal, then it closes and focus returns to the link. While open, keyboard focus stays inside the modal.
- [ ] On phone browsers the Coach number is a tap-to-call link.

## Attachments

- [SCRUM-29_WEB-AUTH-03_Manual_Test_Cases.xlsx](attachments/SCRUM-29/SCRUM-29_WEB-AUTH-03_Manual_Test_Cases.xlsx) (11 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.29 imported from JIRA ticket SCRUM-29 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

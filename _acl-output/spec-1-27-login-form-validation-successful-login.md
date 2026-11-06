---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:54:46.814Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Login – form validation & successful login
type: feature
created: 2026-11-05
story_id: 1.27
epic_id: 1
jira_key: SCRUM-27
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.27: Login – form validation & successful login

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-27](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-27) | In Review | Karthik Raja | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** to sign in with my username and password in my browser, **so that** I can manage my equipment from my computer.

Trace: US-AUTH-01, US-AUTH-04, US-NAV-01 · AGI-R01 · API-01 · Design: 1_AGI_Web_Login

## Acceptance Criteria

- [ ] Given I am signed out, when I open any SureTrack page, then I see the Login page: green panel with the AGI SureTrack Farm logo, Username, Password, Login button, "Forgot Password or Username?" link and the Privacy Policy / Terms of Service links, with the bin photo on the right.
- [ ] Given a tablet or phone browser, then the form fills the width and the photo is reduced or hidden, so the form is never cut off (layout TBC with design).
- [ ] Given Username or Password is empty, when I submit, then no request is sent and the empty field shows "Username is required" or "Password is required".
- [ ] Given I press Enter in either field, then the form submits. Tab order is Username → Password → Login → Forgot Password → Privacy Policy → Terms of Service.
- [ ] The fields use the browser's username and current-password autocomplete hints, so password managers can fill them. Spaces around the username are trimmed; the password is sent as typed.
- [ ] Given I submit, then Login shows a loading state and further clicks are ignored until a response arrives.
- [ ] Given sign-in succeeds, then the server sets my session, my profile and permissions load and I land on Dashboard, or on the page I was trying to open before signing in.
- [ ] Given I am already signed in, when I open the Login page, then I go straight to Dashboard.
- [ ] Given I sign out, then all open SureTrack tabs return to Login, and the browser Back button doesn't show my data again.

## Attachments

- [SCRUM-27_WEB-AUTH-01_Manual_Test_Cases.xlsx](attachments/SCRUM-27/SCRUM-27_WEB-AUTH-01_Manual_Test_Cases.xlsx) (12 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.27 imported from JIRA ticket SCRUM-27 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

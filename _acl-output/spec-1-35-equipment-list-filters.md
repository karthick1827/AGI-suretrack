---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-11-05T09:55:23.508Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Equipment list – filters
type: feature
created: 2026-11-05
story_id: 1.35
epic_id: 1
jira_key: SCRUM-35
epic_key: SCRUM-8
epic: Web
sprint: Sprint 1
tier: Tier 1 (Self-Contained)
---

# Story 1.35: Equipment list – filters

**Parent Epic:** SCRUM-8 — Web

| Jira | Status | Assignee | Priority | Sprint |
|---|---|---|---|---|
| [SCRUM-35](https://acldigital-team-svdi5ip4.atlassian.net/browse/SCRUM-35) | To Do | N Karthick | Medium | Sprint 1 (2026-10-26 → 2026-11-07) |

## Description

**As a** customer, **I want** to filter my equipment by alert severity, commodity and operation mode, **so that** I can focus on the equipment I care about.

Trace: US-STO-03 · AGI-R14 (partly – see open questions) · API-03, API-13 · Design: 6_AGI_Web_Filters

## Acceptance Criteria

- [ ] Given I click the filter button, then a Filters drawer opens from the right over a dimmed page, with the title, "Clear all", a close (✕) button and collapsible sections.
- [ ] Severity lists Select All, Critical, Warning and Info / Notice.
- [ ] The second section lists my account's commodities (e.g. Barley, Canola, Corn, Soybeans, Wheat). Its heading reads "Commodity"; the design's "Alert Type" label is a design error.
- [ ] Operation Mode lists Select All and tiles for Auto Dry & Cool, Auto Cool, Auto Hydrate, Thaw Out and User Controlled; a selected tile has a green border.
- [ ] Given I tick Select All, then every option in that section is selected; deselecting one clears Select All. With every option in a section selected, that section does not filter.
- [ ] Options within a section combine with OR; sections combine with AND.
- [ ] Given I click Apply, then the drawer closes and the page updates. Given I close it with ✕, Esc or a click on the dimmed page, then unapplied changes are discarded and focus returns to the filter button.
- [ ] Given filters are applied, then the filter button shows how many are active. Clear all resets every section; Apply then shows everything.
- [ ] Filters are kept in the page address, so they survive a refresh and can be shared as a link.
- [ ] Given nothing matches, then I see "No equipment matches these filters" with a Clear Filters button.
- [ ] On phone browsers the drawer fills the screen width.

## Attachments

- [SCRUM-35_WEB-EQP-04_Manual_Test_Cases.xlsx](attachments/SCRUM-35/SCRUM-35_WEB-EQP-04_Manual_Test_Cases.xlsx) (12 KB)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-11-05: Story 1.35 imported from JIRA ticket SCRUM-35 (Sprint 1, Epic Web) via Atlassian MCP (Status: In Review).

# PRD Addendum: AGI SureTrack Farm — Web Login & Dashboard

Supporting detail for [prd.md](prd.md). Contents:
- **A.** Dummy data contract for `users.json`.
- **B.** Dummy data contracts for the three Dashboard state files and `notifications.json`, with expected chart pixels for QA.
- **C.** Implementation notes.

The full Figma value extraction stays in the brief's [addendum.md](../../briefs/brief-agi-cursor2-2026-11-05/addendum.md); the assets and Reference renders sit next to it.

## A. Dummy data contract — users.json

`users.json` is the product contract for the client-side dummy sign-in used by the Login page (FR-24 to FR-35) and for the Session it creates. Each entry in `users` is a **Dummy account**. The file is plain test data for this build only: passwords are stored in clear text on purpose, and the file must never be reused with a real authentication service.

Every field and value below that is not stated in the brief or a Jira AC is an **[ASSUMPTION]** (the whole file layout is an assumption; the brief only says "dummy accounts in `users.json`" and that "the dummy account sets the default [Dashboard] state").

### A.1 Field contract

**Top level**

| Field | Type | Required | Meaning |
|---|---|---|---|
| `version` | integer (≥ 1) | yes | Contract version. This PRD defines version `1`. |
| `policy` | object | yes | Sign-in rules shared by all Dummy accounts (A.3). |
| `users` | array of Dummy account objects (≥ 1) | yes | The Dummy accounts. |

**`policy`**

| Field | Type | Value in sample | Used by | Meaning |
|---|---|---|---|---|
| `maxFailedAttempts` | integer ≥ 1 | `5` | FR-30 | Consecutive wrong-credential failures that start a lockout. [ASSUMPTION] |
| `lockoutMinutes` | integer ≥ 1 | `15` | FR-30 | Lockout length, counted from the failure that reached the limit. [ASSUMPTION per SCRUM-28 AC5 "when I can try again"] |
| `requestTimeoutMs` | integer ≥ 1 | `15000` | FR-31 | Sign-in check timeout ("15 s, TBC" in SCRUM-28 AC6). |
| `simulatedLatencyMs` | integer ≥ 0 | `800` | FR-23, FR-47 | Default delay before a dummy result, so loading states are visible. [ASSUMPTION] |
| `sessionTtlMinutes` | integer ≥ 1 | `480` | FR-34 | Session lifetime after sign-in. [ASSUMPTION] |

**Dummy account (each item of `users`)**

| Field | Type | Required | Meaning |
|---|---|---|---|
| `username` | string, non-empty, no leading/trailing spaces | yes | Matched case-insensitively against the trimmed Username input; unique (case-insensitive) within the file. |
| `password` | string, non-empty | yes | Matched exactly (case-sensitive, not trimmed). |
| `displayName` | string | yes | Name shown for the signed-in user where the Dashboard needs one; stored in the Session. |
| `email` | string (email) | yes | Reference only; the Forgot Password modal shows the same confirmation for any email (FR-47). |
| `status` | `"active"` \| `"locked"` \| `"inactive"` | yes | Account status (FR-27, FR-28). |
| `lockedUntil` | string (ISO 8601 date-time with offset) \| `null` | yes | When a locked account can try again; `null` = unknown, so the message omits the time (FR-27). Must be `null` unless `status` is `"locked"`. |
| `subscriptionActive` | boolean | yes | `false` is treated like `status: "inactive"` (FR-28; SCRUM-28 AC3 "no active subscription"). |
| `passwordExpired` | boolean | yes | `true` blocks sign-in with the expired-password message (FR-29). |
| `dashboardState` | `"full"` \| `"small"` \| `"allgood"` | yes | Dashboard state shown on `/dashboard` when no `?state=` is given (FR-25; brief Solution). |
| `simulatedLatencyMs` | integer ≥ 0 | no | Overrides `policy.simulatedLatencyMs` for this account (used to test the timeout, FR-31). |
| `note` | string | no | Human-readable test purpose; never displayed. |

### A.2 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "users.schema.json",
  "title": "AGI SureTrack Farm — dummy users.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["version", "policy", "users"],
  "properties": {
    "version": { "type": "integer", "const": 1 },
    "policy": {
      "type": "object",
      "additionalProperties": false,
      "required": ["maxFailedAttempts", "lockoutMinutes", "requestTimeoutMs", "simulatedLatencyMs", "sessionTtlMinutes"],
      "properties": {
        "maxFailedAttempts": { "type": "integer", "minimum": 1 },
        "lockoutMinutes":    { "type": "integer", "minimum": 1 },
        "requestTimeoutMs":  { "type": "integer", "minimum": 1 },
        "simulatedLatencyMs":{ "type": "integer", "minimum": 0 },
        "sessionTtlMinutes": { "type": "integer", "minimum": 1 }
      }
    },
    "users": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/$defs/dummyAccount" }
    }
  },
  "$defs": {
    "dummyAccount": {
      "type": "object",
      "additionalProperties": false,
      "required": ["username", "password", "displayName", "email", "status", "lockedUntil", "subscriptionActive", "passwordExpired", "dashboardState"],
      "properties": {
        "username":           { "type": "string", "minLength": 1, "pattern": "^\\S(.*\\S)?$" },
        "password":           { "type": "string", "minLength": 1 },
        "displayName":        { "type": "string", "minLength": 1 },
        "email":              { "type": "string", "format": "email" },
        "status":             { "enum": ["active", "locked", "inactive"] },
        "lockedUntil":        { "type": ["string", "null"], "format": "date-time" },
        "subscriptionActive": { "type": "boolean" },
        "passwordExpired":    { "type": "boolean" },
        "dashboardState":     { "enum": ["full", "small", "allgood"] },
        "simulatedLatencyMs": { "type": "integer", "minimum": 0 },
        "note":               { "type": "string" }
      },
      "if":   { "properties": { "status": { "not": { "const": "locked" } } } },
      "then": { "properties": { "lockedUntil": { "const": null } } }
    }
  }
}
```

Username uniqueness (case-insensitive) cannot be expressed in JSON Schema and is checked by a unit test on the file.

### A.3 Sample file (complete)

```json
{
  "version": 1,
  "policy": {
    "maxFailedAttempts": 5,
    "lockoutMinutes": 15,
    "requestTimeoutMs": 15000,
    "simulatedLatencyMs": 800,
    "sessionTtlMinutes": 480
  },
  "users": [
    {
      "username": "demo",
      "password": "Demo@123",
      "displayName": "Demo Farmer",
      "email": "demo@example.com",
      "status": "active",
      "lockedUntil": null,
      "subscriptionActive": true,
      "passwordExpired": false,
      "dashboardState": "full",
      "note": "Primary valid account; lands on Dashboard state full (Figma 6215:58878)."
    },
    {
      "username": "small",
      "password": "Small@123",
      "displayName": "Small Farm",
      "email": "small@example.com",
      "status": "active",
      "lockedUntil": null,
      "subscriptionActive": true,
      "passwordExpired": false,
      "dashboardState": "small",
      "note": "Valid account; lands on Dashboard state small, 1 alert (Figma 6864:4514)."
    },
    {
      "username": "allgood",
      "password": "AllGood@123",
      "displayName": "All Good Farm",
      "email": "allgood@example.com",
      "status": "active",
      "lockedUntil": null,
      "subscriptionActive": true,
      "passwordExpired": false,
      "dashboardState": "allgood",
      "note": "Valid account; lands on Dashboard state allgood (Figma 6879:15603)."
    },
    {
      "username": "locked",
      "password": "Locked@123",
      "displayName": "Locked Account",
      "email": "locked@example.com",
      "status": "locked",
      "lockedUntil": null,
      "subscriptionActive": true,
      "passwordExpired": false,
      "dashboardState": "full",
      "note": "Locked, no unlock time known: message without 'Try again after' (FR-27)."
    },
    {
      "username": "locked-until",
      "password": "Locked@123",
      "displayName": "Locked Until Account",
      "email": "locked-until@example.com",
      "status": "locked",
      "lockedUntil": "2099-01-01T09:00:00Z",
      "subscriptionActive": true,
      "passwordExpired": false,
      "dashboardState": "full",
      "note": "Locked with a known unlock time: message includes 'Try again after {time}' (FR-27)."
    },
    {
      "username": "inactive",
      "password": "Inactive@123",
      "displayName": "Inactive Account",
      "email": "inactive@example.com",
      "status": "inactive",
      "lockedUntil": null,
      "subscriptionActive": true,
      "passwordExpired": false,
      "dashboardState": "full",
      "note": "Inactive account (FR-28)."
    },
    {
      "username": "nosub",
      "password": "NoSub@123",
      "displayName": "No Subscription",
      "email": "nosub@example.com",
      "status": "active",
      "lockedUntil": null,
      "subscriptionActive": false,
      "passwordExpired": false,
      "dashboardState": "full",
      "note": "Active but no active subscription: same message as inactive (FR-28)."
    },
    {
      "username": "expired",
      "password": "Expired@123",
      "displayName": "Expired Password",
      "email": "expired@example.com",
      "status": "active",
      "lockedUntil": null,
      "subscriptionActive": true,
      "passwordExpired": true,
      "dashboardState": "full",
      "note": "Password expired: message with link that opens the Forgot Password modal (FR-29)."
    },
    {
      "username": "slow",
      "password": "Slow@123",
      "displayName": "Slow Response",
      "email": "slow@example.com",
      "status": "active",
      "lockedUntil": null,
      "subscriptionActive": true,
      "passwordExpired": false,
      "dashboardState": "full",
      "simulatedLatencyMs": 16000,
      "note": "Response slower than policy.requestTimeoutMs: timeout message (FR-31)."
    }
  ]
}
```

### A.4 Rules applied to the file

1. **Matching.** Username input is trimmed, then compared case-insensitively with `username`; password is compared exactly. No match on either → `Username or password is incorrect` (FR-26).
2. **Order of checks** (FR-24): required fields → active lockout → offline → timeout → credentials → `status: "locked"` → `status: "inactive"` or `subscriptionActive: false` → `passwordExpired: true` → success. Account-status messages appear only after a correct password.
3. **Too many attempts** (FR-30) [ASSUMPTION]:
   - Only wrong-credential results count; validation, locked, inactive, expired-password, offline and timeout results do not.
   - The count is kept per browser (not per username) and survives page reload.
   - The failure that brings the count to `policy.maxFailedAttempts` (5) starts a lockout of `policy.lockoutMinutes` (15 minutes) and shows `Too many sign-in attempts. You can try again at {time}.` instead of the wrong-credentials message.
   - During the lockout the Login button is disabled; when it ends, the button re-enables automatically and the count resets to 0.
   - A successful sign-in resets the count to 0.
4. **Latency and timeout.** The result is delivered after `simulatedLatencyMs` (account value if present, else `policy.simulatedLatencyMs`). If that exceeds `policy.requestTimeoutMs`, the check is abandoned with the timeout message (FR-31). If the browser is offline at submit, the offline message shows and no check runs.
5. **Session** (FR-25, FR-34, FR-35) [ASSUMPTION]: on success the Session holds `username`, `displayName`, `dashboardState`, `issuedAt` and `expiresAt` (= `issuedAt` + `policy.sessionTtlMinutes`). It is shared by all tabs of the same browser and survives reload; it never contains the password. Logout deletes it in every tab.
6. **Dashboard state.** `/dashboard` without `?state=` shows the Session's `dashboardState`; `?state=full|small|allgood` overrides it (brief Solution).
7. **Legal links configuration** (FR-20) [ASSUMPTION]: the Privacy Policy and Terms of Service URLs live in a separate runtime configuration file (not in `users.json`), with placeholder values `https://example.com/privacy-policy` and `https://example.com/terms-of-service` until the client supplies the real URLs.

---

## B. Dummy data contract — dashboard.{full,small,allgood}.json and notifications.json

**Purpose.** These four files are the only data source for the Dashboard (FR-93…FR-96) and the Notifications panel (FR-97…FR-101). Values are copied verbatim from addendum Part B §14 (Dashboard) and §11 (Notifications). Where §14 used shortcuts ("same as A", "same as B"), the full objects below are expanded from the Full state and the Reference renders; nothing else is invented except the fields marked **[ASSUMPTION]**.

**Location.** [ASSUMPTION] Served as static files at `/data/dashboard.full.json`, `/data/dashboard.small.json`, `/data/dashboard.allgood.json`, `/data/notifications.json`.

### B.1 Rules

1. **Display strings vs numbers.** Every field marked *display* is rendered character-for-character (U+00B7 "·" with spaces, U+2019 "’", typos kept). Fields marked *chart* are numbers used only by the formulas in FR-69 (Health bar), FR-80 (Runtime chart), FR-85 (Grain Fill bar), FR-90 (Liquid Fill bar) and the tooltip share in FR-86/FR-90. Fields marked *route* build navigation targets. No displayed text is computed from *chart* fields.
2. **Integers shown as numbers** (`kpi.*.value` except `fans.value`, `rows[].count`, `header.bellBadge`) are rendered as their plain decimal integer.
3. **Contradictions are intentional** (brief Open Questions 1) and must not be "fixed" in the data.
4. **Empty states.** `recentAlerts.items: []` with `recentAlerts.empty` set → FR-77. `liquid.items: []` with `liquid.empty` set → FR-92. Otherwise `empty` is `null`.

### B.2 Schema — dashboard.<state>.json

| Path | Type | Kind | Notes |
|---|---|---|---|
| `state` | `"full" \| "small" \| "allgood"` | meta | Must equal the file's state. |
| `figmaFrame` | string | meta | Figma frame id the file reproduces. |
| `header.activeTab` | string | display | Always `Dashboard`. |
| `header.tabs[]` | string[3] | display | `Dashboard`, `Equipment`, `Alerts`. |
| `header.bellBadge` | integer | display | Badge text (FR-53). |
| `pageTitle` | string | display | `Dashboard`. |
| `kpi.attention.value` | integer | display | Need attention number. |
| `kpi.attention.label` | string | display | Verbatim label. |
| `kpi.attention.critical` | integer | info | Not displayed separately. |
| `kpi.attention.allGood` | boolean | style switch | `true` → tick icon, grey Regular label (FR-60/K3). |
| `kpi.equipment.value` | integer | display | Total. |
| `kpi.equipment.label` | string | display | `Equipment`. |
| `kpi.equipment.subCountWeight` | `400 \| 700` | style | **[ASSUMPTION]** carries the per-state weight drift (FR-62). |
| `kpi.equipment.breakdown[]` | `{value:int, label:string, typeKey:string}` | display / route | `typeKey` ∈ `bins, piles, flats, tanks, dryers` **[ASSUMPTION]** → `/equipment?type=<typeKey>`. |
| `kpi.online` / `kpi.offline` | `{value:int, label:string}` | display | |
| `kpi.fans` | `{value:string, running:int, total:int, label:string}` | display (`value`, `label`) / info | `value` is the display string e.g. `7 of 24`. |
| `equipmentCard.title` / `.subtitle` / `.link` | string | display | |
| `equipmentCard.rows[]` | object | — | One row per type, in display order. |
| `rows[].type` | string | display | Row name. |
| `rows[].typeKey` | string | route | **[ASSUMPTION]**. |
| `rows[].count` | integer | display | |
| `rows[].alerts` / `.offline` / `.healthy` | integer ≥ 0 | chart | Health bar formula (FR-69). |
| `rows[].caption` | string | display | Digit runs rendered bold (FR-71). |
| `recentAlerts.title` / `.subtitle` / `.link` | string | display | |
| `recentAlerts.items[]` | object (max 4 shown) | — | File order = display order. |
| `items[].id` | string | meta | **[ASSUMPTION]** stable key. |
| `items[].title`, `.deviceId`, `.location`, `.severity`, `.time`, `.action` | string | display | `severity` ∈ `Critical`, `Warning` (also selects icon & colour). Meta line = `<deviceId> \| <location>`. |
| `items[].actionKey` | string | route | **[ASSUMPTION]** `hotspot`, `fans`, `connection`, `fan-switches` → `/equipment/<deviceId>/<actionKey>`. |
| `recentAlerts.empty` | `{title, body}` \| null | display | |
| `fanActivity.title` / `.subtitle` / `.caption` / `.chartLabel` | string | display | `chartLabel` is the chart's accessible name. |
| `fanActivity.tiles[3]` | `{value:string, label:string}` | display | |
| `fanActivity.chart[7]` | `{day:string, hours:number, isToday:boolean}` | `day` display, `hours` chart + display (`<hours>h`) | Value label text = `String(hours) + "h"`. |
| `grain.title` / `.subtitle` / `.summaryBold` / `.summaryRest` / `.fillLabel` | string | display | |
| `grain.totalBu` / `.capacityBu` | integer | chart | Tooltip share only. |
| `grain.fillPct` | integer | info | Not displayed (label is `fillLabel`). |
| `grain.items[]` | object | — | File order = legend and segment order. |
| `grain.items[].name` / `.subLabel` / `.color` | string | display | `color` is a hex from the Commodity colour map. |
| `grain.items[].amountK` | number | chart | k bu, Grain formula. |
| `grain.items[].amountBu` | integer | chart | Tooltip share. |
| `grain.items[].amountLabel` | string | display | Tooltip amount text. |
| `grain.items[].units` | integer | info | |
| `grain.items[].segmentPx` | number (optional) | chart | **[ASSUMPTION]** override of the formula width; set only in Small/All-good (321). |
| `grain.items[].segmentTopPx` | number (optional) | chart | **[ASSUMPTION]** Figma nudge −0.5 in Small/All-good. |
| `liquid.title` / `.subtitle` | string | display | |
| `liquid.summaryBold` / `.summaryRest` / `.fillLabel` | string \| null | display | `null` when empty. |
| `liquid.totalGal` / `.capacityGal` | integer \| null | chart | Tooltip share. |
| `liquid.items[]` | object | — | |
| `liquid.items[].name` / `.amountLabel` / `.subLabel` / `.color` | string | display | |
| `liquid.items[].amountK` | number | chart | k gal, Liquid formula. |
| `liquid.items[].amountGal` | integer | chart | Tooltip share. |
| `liquid.items[].tanks` | integer | info | |
| `liquid.empty` | `{title, body}` \| null | display | |

- `pageBottomSpacePx` (number): space below the last card row, exactly as drawn per state (Full 16, Small 28, All-good 24) so the page height equals the Figma frame (1052 / 860 / 856).
- `fanActivity.chart[].barPx` (number): Figma's exact bar height in px (54/61/66/72/68/79/76); rendered as-is, 0 px tolerance.

### B.3 dashboard.full.json (Figma `6215:58878`)

```json
{
  "state": "full",
  "pageBottomSpacePx": 16,
  "figmaFrame": "6215:58878",
  "header": { "activeTab": "Dashboard", "tabs": ["Dashboard", "Equipment", "Alerts"], "bellBadge": 2 },
  "pageTitle": "Dashboard",
  "kpi": {
    "attention": { "value": 7, "label": "Need attention · 2 critical", "critical": 2, "allGood": false },
    "equipment": {
      "value": 20, "label": "Equipment", "subCountWeight": 400,
      "breakdown": [
        { "value": 7, "label": "Bins", "typeKey": "bins" },
        { "value": 3, "label": "Piles", "typeKey": "piles" },
        { "value": 2, "label": "Flats", "typeKey": "flats" },
        { "value": 6, "label": "Tanks", "typeKey": "tanks" },
        { "value": 2, "label": "Dryers", "typeKey": "dryers" }
      ]
    },
    "online": { "value": 16, "label": "Online" },
    "offline": { "value": 4, "label": "Offline" },
    "fans": { "value": "7 of 24", "running": 7, "total": 24, "label": "Fans running now" }
  },
  "equipmentCard": {
    "title": "Equipment (20)", "subtitle": "Health by type", "link": "View All",
    "rows": [
      { "type": "Bins", "typeKey": "bins", "count": 7, "alerts": 3, "offline": 1, "healthy": 3, "caption": "3 alerts · 1 offline · 3 healthy" },
      { "type": "Piles", "typeKey": "piles", "count": 3, "alerts": 1, "offline": 0, "healthy": 2, "caption": "1 alert · 2 healthy" },
      { "type": "Flats", "typeKey": "flats", "count": 2, "alerts": 0, "offline": 0, "healthy": 2, "caption": "2 healthy" },
      { "type": "Tanks", "typeKey": "tanks", "count": 6, "alerts": 1, "offline": 0, "healthy": 5, "caption": "1 alert · 5 healthy" },
      { "type": "Dryers", "typeKey": "dryers", "count": 2, "alerts": 0, "offline": 0, "healthy": 2, "caption": "2 healthy" }
    ]
  },
  "recentAlerts": {
    "title": "Recent Alerts", "subtitle": "Most urgent first. Each item links to what to do next.", "link": "View All",
    "items": [
      { "id": "a1", "title": "HotSpot Detected", "deviceId": "759", "location": "Wheat Storage", "severity": "Critical", "time": "30 mins ago", "action": "View Hotspot", "actionKey": "hotspot" },
      { "id": "a2", "title": "Static Pressure", "deviceId": "757", "location": "Oat Silo", "severity": "Critical", "time": "2 hours ago", "action": "Check Fans", "actionKey": "fans" },
      { "id": "a3", "title": "No Communication", "deviceId": "18086", "location": "Pinto Storage", "severity": "Warning", "time": "3 hours ago", "action": "Check Connection", "actionKey": "connection" },
      { "id": "a4", "title": "Missing Fan Switched", "deviceId": "753", "location": "Canola East", "severity": "Warning", "time": "1 day ago", "action": "Check Fan Switches", "actionKey": "fan-switches" }
    ],
    "empty": null
  },
  "fanActivity": {
    "title": "Fan activity", "subtitle": "All storage fans",
    "tiles": [
      { "value": "7", "label": "Running Now" },
      { "value": "86 h", "label": "Runtime Today" },
      { "value": "410 kWh", "label": "Energy Today" }
    ],
    "chartLabel": "Fan runtime hours for the last 7 days, from 62 to 90 hours",
    "chart": [
      { "day": "Wed", "hours": 62, "barPx": 54, "isToday": false },
      { "day": "Thu", "hours": 70, "barPx": 61, "isToday": false },
      { "day": "Fri", "hours": 74, "barPx": 66, "isToday": false },
      { "day": "Sat", "hours": 81, "barPx": 72, "isToday": false },
      { "day": "Sun", "hours": 77, "barPx": 68, "isToday": false },
      { "day": "Mon", "hours": 90, "barPx": 79, "isToday": false },
      { "day": "Today", "hours": 86, "barPx": 76, "isToday": true }
    ],
    "caption": "Runtime hours, last 7 days. Higher this week as Auto modes used the cool nights."
  },
  "grain": {
    "title": "Grain On Hand", "subtitle": "All grain inventory",
    "summaryBold": "1.40M bu", "summaryRest": "of 1.78M bu · 79% full", "fillLabel": "79% Fill",
    "totalBu": 1400000, "capacityBu": 1780000, "fillPct": 79,
    "items": [
      { "name": "Canola", "amountK": 340, "amountBu": 340000, "amountLabel": "340k bu", "subLabel": "340k bu · 1 unit", "units": 1, "color": "#E3C341" },
      { "name": "Corn", "amountK": 314, "amountBu": 314000, "amountLabel": "314k bu", "subLabel": "314k bu · 1 unit", "units": 1, "color": "#E07B39" },
      { "name": "Soybeans", "amountK": 268, "amountBu": 268000, "amountLabel": "268k bu", "subLabel": "268k bu · 1 unit", "units": 1, "color": "#6F8F4F" },
      { "name": "Wheat", "amountK": 224, "amountBu": 224000, "amountLabel": "224k bu", "subLabel": "224k bu · 1 unit", "units": 1, "color": "#C98F2E" },
      { "name": "Barley", "amountK": 140, "amountBu": 140000, "amountLabel": "140k bu", "subLabel": "140k bu · 1 unit", "units": 1, "color": "#8FB36B" },
      { "name": "Oats", "amountK": 111, "amountBu": 111000, "amountLabel": "111k bu", "subLabel": "111k bu · 1 unit", "units": 1, "color": "#B9A47A" }
    ]
  },
  "liquid": {
    "title": "Liquid On Hand", "subtitle": "All liquid storage tanks",
    "summaryBold": "83k gal", "summaryRest": "of 100k gal · 83% full", "fillLabel": "83% Fill",
    "totalGal": 83000, "capacityGal": 100000,
    "items": [
      { "name": "Propane", "amountK": 20, "amountGal": 20000, "amountLabel": "20k gal", "subLabel": "20k gal · 4 tanks", "tanks": 4, "color": "#0EA5E9" },
      { "name": "Fuel Oil", "amountK": 18, "amountGal": 18000, "amountLabel": "18k gal", "subLabel": "18k gal · 3 tanks", "tanks": 3, "color": "#00B156" },
      { "name": "Water", "amountK": 16, "amountGal": 16000, "amountLabel": "16k gal", "subLabel": "16k gal · 4 tanks", "tanks": 4, "color": "#84CC16" },
      { "name": "Kerosene", "amountK": 10, "amountGal": 10000, "amountLabel": "10k gal", "subLabel": "10k gal · 2 tanks", "tanks": 2, "color": "#14B8A6" },
      { "name": "Gasoline", "amountK": 8, "amountGal": 8000, "amountLabel": "8k gal", "subLabel": "8k gal · 2 tanks", "tanks": 2, "color": "#A855F7" },
      { "name": "Diesel", "amountK": 11, "amountGal": 11000, "amountLabel": "11k gal", "subLabel": "11k gal · 2 tanks", "tanks": 2, "color": "#6366F1" }
    ],
    "empty": null
  }
}
```

### B.4 dashboard.small.json (Figma `6864:4514`)

```json
{
  "state": "small",
  "pageBottomSpacePx": 28,
  "figmaFrame": "6864:4514",
  "header": { "activeTab": "Dashboard", "tabs": ["Dashboard", "Equipment", "Alerts"], "bellBadge": 2 },
  "pageTitle": "Dashboard",
  "kpi": {
    "attention": { "value": 1, "label": "Need attention · 1 critical", "critical": 1, "allGood": false },
    "equipment": {
      "value": 2, "label": "Equipment", "subCountWeight": 700,
      "breakdown": [
        { "value": 1, "label": "Bin", "typeKey": "bins" },
        { "value": 1, "label": "Dryer", "typeKey": "dryers" }
      ]
    },
    "online": { "value": 2, "label": "Online" },
    "offline": { "value": 0, "label": "Offline" },
    "fans": { "value": "2 of 3", "running": 2, "total": 3, "label": "Fans running now" }
  },
  "equipmentCard": {
    "title": "Equipment (2)", "subtitle": "Health by type", "link": "View All",
    "rows": [
      { "type": "Bin", "typeKey": "bins", "count": 1, "alerts": 1, "offline": 0, "healthy": 0, "caption": "1 alert" },
      { "type": "Dryer", "typeKey": "dryers", "count": 1, "alerts": 0, "offline": 0, "healthy": 1, "caption": "1 healthy" }
    ]
  },
  "recentAlerts": {
    "title": "Recent Alerts", "subtitle": "Most urgent first. Each item links to what to do next.", "link": "View All",
    "items": [
      { "id": "a1", "title": "HotSpot Detected", "deviceId": "759", "location": "Wheat Storage", "severity": "Critical", "time": "30 mins ago", "action": "View Hotspot", "actionKey": "hotspot" }
    ],
    "empty": null
  },
  "fanActivity": {
    "title": "Fan activity", "subtitle": "All storage fans",
    "tiles": [
      { "value": "7", "label": "Running Now" },
      { "value": "86 h", "label": "Runtime Today" },
      { "value": "410 kWh", "label": "Energy Today" }
    ],
    "chartLabel": "Fan runtime hours for the last 7 days, from 62 to 90 hours",
    "chart": [
      { "day": "Wed", "hours": 62, "barPx": 54, "isToday": false },
      { "day": "Thu", "hours": 70, "barPx": 61, "isToday": false },
      { "day": "Fri", "hours": 74, "barPx": 66, "isToday": false },
      { "day": "Sat", "hours": 81, "barPx": 72, "isToday": false },
      { "day": "Sun", "hours": 77, "barPx": 68, "isToday": false },
      { "day": "Mon", "hours": 90, "barPx": 79, "isToday": false },
      { "day": "Today", "hours": 86, "barPx": 76, "isToday": true }
    ],
    "caption": "Runtime hours, last 7 days. Higher this week as Auto modes used the cool nights."
  },
  "grain": {
    "title": "Grain On Hand", "subtitle": "All grain inventory",
    "summaryBold": "21,050 bu", "summaryRest": "of 25,000 bu · 79% full", "fillLabel": "84% Fill",
    "totalBu": 21050, "capacityBu": 25000, "fillPct": 84,
    "items": [
      { "name": "Wheat", "amountK": 21.05, "amountBu": 21050, "amountLabel": "21,050 bu", "subLabel": "21,050 bu · 1 unit · Wheat Storage", "units": 1, "color": "#C98F2E", "segmentPx": 321, "segmentTopPx": -0.5 }
    ]
  },
  "liquid": {
    "title": "Liquid On Hand", "subtitle": "All liquid storage tanks",
    "summaryBold": null, "summaryRest": null, "fillLabel": null,
    "totalGal": null, "capacityGal": null,
    "items": [],
    "empty": {
      "title": "No Tanks Monitored Yet",
      "body": "Keep an eye on propane, diesel and water levels here, and get an alert before a tank runs low."
    }
  }
}
```

### B.5 dashboard.allgood.json (Figma `6879:15603`)

```json
{
  "state": "allgood",
  "pageBottomSpacePx": 24,
  "figmaFrame": "6879:15603",
  "header": { "activeTab": "Dashboard", "tabs": ["Dashboard", "Equipment", "Alerts"], "bellBadge": 2 },
  "pageTitle": "Dashboard",
  "kpi": {
    "attention": { "value": 0, "label": "Need attention · all good", "critical": 0, "allGood": true },
    "equipment": {
      "value": 1, "label": "Equipment", "subCountWeight": 700,
      "breakdown": [
        { "value": 1, "label": "Bin", "typeKey": "bins" }
      ]
    },
    "online": { "value": 1, "label": "Online" },
    "offline": { "value": 0, "label": "Offline" },
    "fans": { "value": "2 of 3", "running": 2, "total": 3, "label": "Fans running now" }
  },
  "equipmentCard": {
    "title": "Equipment (1)", "subtitle": "Health by type", "link": "View All",
    "rows": [
      { "type": "Bin", "typeKey": "bins", "count": 1, "alerts": 0, "offline": 0, "healthy": 1, "caption": "1 healthy" }
    ]
  },
  "recentAlerts": {
    "title": "Recent Alerts", "subtitle": "Most urgent first. Each item links to what to do next.", "link": "View All",
    "items": [],
    "empty": {
      "title": "No Alerts Right Now",
      "body": "Everything is on track with your storage, dryers, and tanks. We’ll notify you as soon as anything needs attention."
    }
  },
  "fanActivity": {
    "title": "Fan activity", "subtitle": "All storage fans",
    "tiles": [
      { "value": "2 of 3", "label": "Running Now" },
      { "value": "7 h 24 m", "label": "Runtime Today" },
      { "value": "38 kWh", "label": "Energy Today" }
    ],
    "chartLabel": "Fan runtime hours for the last 7 days, from 62 to 90 hours",
    "chart": [
      { "day": "Wed", "hours": 62, "barPx": 54, "isToday": false },
      { "day": "Thu", "hours": 70, "barPx": 61, "isToday": false },
      { "day": "Fri", "hours": 74, "barPx": 66, "isToday": false },
      { "day": "Sat", "hours": 81, "barPx": 72, "isToday": false },
      { "day": "Sun", "hours": 77, "barPx": 68, "isToday": false },
      { "day": "Mon", "hours": 90, "barPx": 79, "isToday": false },
      { "day": "Today", "hours": 86, "barPx": 76, "isToday": true }
    ],
    "caption": "Runtime hours, last 7 days. Higher this week as Auto modes used the cool nights."
  },
  "grain": {
    "title": "Grain On Hand", "subtitle": "All grain inventory",
    "summaryBold": "21,050 bu", "summaryRest": "of 25,000 bu · 79% full", "fillLabel": "84% Fill",
    "totalBu": 21050, "capacityBu": 25000, "fillPct": 84,
    "items": [
      { "name": "Wheat", "amountK": 21.05, "amountBu": 21050, "amountLabel": "21,050 bu", "subLabel": "21,050 bu · 1 unit · Wheat Storage", "units": 1, "color": "#C98F2E", "segmentPx": 321, "segmentTopPx": -0.5 }
    ]
  },
  "liquid": {
    "title": "Liquid On Hand", "subtitle": "All liquid storage tanks",
    "summaryBold": null, "summaryRest": null, "fillLabel": null,
    "totalGal": null, "capacityGal": null,
    "items": [],
    "empty": {
      "title": "No Tanks Monitored Yet",
      "body": "Keep an eye on propane, diesel and water levels here, and get an alert before a tank runs low."
    }
  }
}
```

### B.6 Schema — notifications.json

| Path | Type | Kind | Notes |
|---|---|---|---|
| `title` | string | display | `Notifications`. |
| `unreadOnlyDefault` | boolean | behaviour | `true` (toggle ON at open, FR-99). |
| `unreadOnlyLabel` | string | display | `Unread Only`. |
| `chips[]` | `{label:string, tag:string \| null}` | display / filter | `tag: null` = no filter (`All`). `Promotions` filters tag `Promotion`. |
| `items[]` | object | — | File order = display order (not re-sorted). |
| `items[].id` | string | meta | **[ASSUMPTION]** stable key. |
| `items[].message` | string | display | `\n` = hard line break (item 4). |
| `items[].tag` | `"App" \| "Promotion" \| "Equipment"` | display / filter | Selects tag colours (FR-101). |
| `items[].time` | string | display | Verbatim `Mon DD \| h:mm am/pm`. |
| `items[].unread` | boolean | filter | All `true` (Figma names every item "Button - Unread: …"). |

### B.7 notifications.json (Figma `8270:44312`)

```json
{
  "title": "Notifications",
  "unreadOnlyDefault": true,
  "unreadOnlyLabel": "Unread Only",
  "chips": [
    { "label": "All", "tag": null },
    { "label": "App", "tag": "App" },
    { "label": "Equipment", "tag": "Equipment" },
    { "label": "Promotions", "tag": "Promotion" }
  ],
  "items": [
    { "id": "n1", "message": "SureTrack app version 3.2 is available with offline field logging. Update now.", "tag": "App", "time": "Feb 25 | 11:20 am", "unread": true },
    { "id": "n2", "message": "Your farm profile is 80% complete. Add your land records.", "tag": "App", "time": "Feb 25 | 11:20 am", "unread": true },
    { "id": "n3", "message": "Get 15% off on drip irrigation kits this week. Offer ends Feb 28, 2026", "tag": "Promotion", "time": "Feb 25 | 3:20 pm", "unread": true },
    { "id": "n4", "message": "Free soil testing for your first field\nwhen you book on Mar 5, 2026.", "tag": "Promotion", "time": "Feb 24 | 3:20 am", "unread": true },
    { "id": "n5", "message": "Tractor TR-02 is due for service in 3 days (engine hours: 248 of 250).", "tag": "Equipment", "time": "Feb 25 | 8:40 am", "unread": true },
    { "id": "n6", "message": "Your rental of Harvester HV-11 ends on Feb 27, 2026. Extend or schedule return.", "tag": "Equipment", "time": "Feb 24 | 3:20 am", "unread": true }
  ]
}
```

### B.8 Expected chart results from these files (for QA)

| Chart | State | Input | Expected px |
|---|---|---|---|
| Health bar Bins | Full | 3 / 1 / 3 | alert 201.43 · offline 67.14 · healthy 201.43 (2 px gaps) |
| Health bar Piles | Full | 1 / 0 / 2 | alert 157.33 · healthy 314.67 |
| Health bar Flats, Dryers | Full | 0 / 0 / 2 | healthy 474 |
| Health bar Tanks | Full | 1 / 0 / 5 | alert 78.67 · healthy 393.33 |
| Health bar Bin / Dryer | Small | 1/0/0 · 0/0/1 | alert 474 · healthy 474 |
| Health bar Bin | All-good | 0 / 0 / 1 | healthy 474 |
| Runtime chart | all | 62, 70, 74, 81, 77, 90, 86 h | 54, 61, 66, 72, 68, 79, 76 px (`barPx`, exact Figma; 0 px tolerance) |
| Grain Fill bar | Full | 340, 314, 268, 224, 140, 111 k bu | 72.5, 67.5, 57.5, 47.5, 30, 23.75 at left 0, 76.33, 147.58, 208.83, 260.08, 293.83; track 321.33 + 81.25 |
| Grain Fill bar | Small, All-good | Wheat `segmentPx` 321 | 321 at left 0, top −0.5; track 321.33 + 81.25 |
| Liquid Fill bar | Full | 20, 18, 16, 10, 8, 11 k gal | 70.313, 63.281, 56.25, 35.156, 28.125, 38.672 at left 0, 73.828, 140.625, 200.391, 239.063, 270.703; track 312.891 + 73 |

---

## C. Implementation Notes (technical how — not requirements)

These notes record the technical decisions behind the PRD so architecture and stories start from the same base. They are guidance, not acceptance criteria. Change them through the architecture workflow (`acl-architecture`), not silently.

### C.1 Stack (existing repo)

- **Framework:** React 19 and Vite 8, as already in `package.json`, with `@vitejs/plugin-react` and `babel-plugin-react-compiler`. Plain JavaScript (JSX), matching `src/`.
- **Routing:** `react-router` (v7), the one new runtime dependency. `[ASSUMPTION]`
  - **Public routes:** `/login`.
  - **Protected routes:** `/dashboard`, `/equipment`, `/equipment/:id`, `/alerts`, `/alerts/:id/:action`, `/profile`.
  - **Default:** `/` redirects to `/dashboard`, which redirects to `/login` when there is no Session.
  - **Placeholders:** every target except `/login` and `/dashboard` renders one shared "Coming soon" placeholder inside the Header shell.
- **Styling:** CSS Modules plus one global `tokens.css` that holds every **Design token** as a CSS custom property, named after the Figma variables (e.g. `--brand-primary-700: #004b27`). No CSS framework, because utility rounding (Tailwind's spacing scale, for example) fights odd Figma values such as 14.551 px.
- **Charts:** hand-written SVG and CSS using the PRD formulas. No chart library, since libraries add axes, padding and easing that break pixel parity.

### C.2 Data access (NFR-7)

- **One module, `src/data/api.js`**, exposes `getUsers()`, `getDashboard(state)` and `getNotifications()`. Each returns a Promise and imports the JSON from `src/data/*.json`.
  - **Simulated latency:** 300 ms in development, 0 ms in Fidelity tests, so the loading placeholders can be seen. `[ASSUMPTION]`
- **Choosing the Dashboard state:**
  1. the `?state=` query parameter;
  2. otherwise, the signed-in Dummy account's `dashboardState`;
  3. otherwise, `full`.
- **Session:** stored in `sessionStorage` under the key `suretrack.session` as `{ username, dashboardState, signedInAt }`.
  - **Cross-tab sign-out:** broadcast through a `storage` event on `localStorage` (`suretrack.signout`), so every open tab returns to the Login page (SCRUM-27 AC9).

### C.3 Assets

- **Exported SVGs** in `_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-assets/` are copied to `src/assets/icons/`, imported as React components or as `<img>`, and never redrawn.
- **Silo photo** (`981df.png`, 4096×2732): converted once to `src/assets/login-bg.webp` (2732 px wide) plus a JPEG fallback. The two mirrored placements follow addendum Part A §2.1.
- **Avatar:** `avatar3.png` (256 px) is used in a 32 px circle.

### C.4 Fidelity-check tooling (§8)

- **Tool:** `@playwright/test` with `toHaveScreenshot` (`maxDiffPixelRatio: 0.005`, `threshold: 0.1`) on the Chromium project at `deviceScaleFactor: 1`, run on macOS.
- **Baselines:** the 1× Figma exports, re-exported without shadow overflow, so the size equals the frame size (the saved Reference renders are slightly larger, e.g. 1374×1054, because the export includes the card shadows).
- **Measurement audit:** a Playwright spec reads `getBoundingClientRect()` and `getComputedStyle()` for selectors tagged `data-fid="<figma-node-id>"` and compares them with a JSON table generated from the PRD consequences.
- **Fixtures:** each Dashboard state is captured through `/dashboard?state=<state>` with a seeded Session.

### C.5 Suggested file layout

```
src/
  main.jsx, App.jsx (router)
  styles/tokens.css, fonts.css
  assets/icons/*.svg, login-bg.webp, avatar.png
  data/api.js, users.json, dashboard.full.json, dashboard.small.json, dashboard.allgood.json, notifications.json
  auth/session.js, RequireSession.jsx
  pages/Login/…, pages/Dashboard/…, pages/Placeholder/…
  components/Header/…, ForgotPasswordModal/…, NotificationsPanel/…
  components/dashboard/KpiStrip, EquipmentCard, HealthBar, RecentAlertsCard, FanActivityCard, RuntimeChart, GrainCard, LiquidCard, FillBar, EmptyState
tests/fidelity/*.spec.js, tests/behaviour/*.spec.js
```

## Product Mission
Lowalk exists to reduce the gap between intention and action. 
The app encourages users to physically go where they planned to be, remain there for their intended session, and build consistent real-world routines. Every product, engineering, and design decision must support this mission.

---

## Local-First Philosophy
Lowalk is a strictly local-first application. 
- No user account is required.
- No cloud sync is required.
- No central backend database is required.

All user-generated data is stored locally on the user's device. This includes:
- Focus Nodes & Anchors
- Today's Schedule & Timeline History
- Blocked Application Lists
- Focus Coins Balance & Streak Metrics
- Statistical Performance Logs
- User Preferences & Onboarding Progress

External network services are strictly isolated to:
- **RevenueCat:** Premium subscription status validation.
- **PostHog:** Anonymous, aggregated usage analytics.

---

## Focus Nodes & Anchors
Lowalk separates **what the user is doing** from **where they are doing it**.

### 1. Focus Node (The Activity)
A Focus Node represents an activity profile. Examples:
- 🎓 Statistics Lecture
- 📚 Library Session
- 🏋 Gym Workout
- 💼 Work Shift

A Focus Node stores: `id`, `title`, `icon`, `schedule parameters`, `session duration`, and a linked `Anchor ID`. It **never** stores raw GPS coordinates.

### 2. Anchor (The Location)
An Anchor represents a definitive physical coordinate profile. Examples:
- Engineering Library
- EMS Building Room 2-14
- Virgin Active Hatfield
- Home Office

An Anchor stores: `id`, `latitude`, `longitude`, and `geofence radius`. Multiple Focus Nodes may reference the same Anchor to prevent data duplication.

---

## Place Selection & Optional Calibration

### At schedule creation (at home)
When a user creates or edits a Focus Node, they must attach a venue. Preferred path: **search** (native geocode + OpenStreetMap Nominatim fallback).

If search cannot find the venue:
1. **Drop a pin on the venue** — pan an OpenStreetMap view and tap the building (never use home GPS).
2. **Set location when I arrive** — save the venue name now; capture GPS the first time they are on site.

The app stores:
- Place name, formatted address, and a stable local venue id
- Map coordinates when known (`latitude` / `longitude`), or a deferred placeholder until first arrival
- A kind-based default geofence radius (e.g. Classroom ~30m, Library ~45m, Large Gym ~60m)

Room or zone labels (e.g. IT 4-1) stay on the Focus Node — they are not the map place.

Presence tracking works immediately from searched or pinned coordinates. Deferred venues prompt on-site GPS capture when the schedule window opens. Multiple Focus Nodes may link to the same Anchor when they share a venue id or nearby coords.

### Optional calibration (fine-tune)
Calibration is **not required**. If GPS is bouncy inside a large building, the user can open session detail and choose **"Calibrate: Align geofence to my seat"**:
1. Stand precisely where they spend the session.
2. Capture the current hardware GPS location.
3. Choose a radius preset (Small Room, Classroom, Library Floor, Large Gym, or Custom).

Nearby / same-venue Anchors may be offered for reuse to avoid remapping the same building.

---

## Geofencing & Stability
The selected radius determines when the user is considered inside or outside a location boundary. 
- Keep geofence logic fully predictable.
- **Do not** automatically recalibrate coordinates or continuously modify anchor positions over time.
- Users can manually edit an Anchor if they permanently relocate their workspace setup.

---

## Focus Coins (Skips) & Streak

### Focus Coins = Skips
Focus Coins are the same thing as **skips** — currency you earn by showing up and spend to bypass focus enforcement (e.g. opening a blocked app during a lock window). Your saved balance is shown in **Settings** and on the **Hero card** intel row.

**Earning:** Complete **every session on today's schedule** (e.g. `1 / 1` or `4 / 4` on the Daily Goal card — the target always matches how many Focus Nodes you scheduled for that day) to earn **+1 Focus Coin** for that calendar day.

**Daily Goal target:** Automatically equals the number of Focus Nodes scheduled for today — not a fixed number like 4.

**Spending:** Deferred until native app shielding ships — skips will be spent from the blocking overlay or enforcement flow, not from free session-detail skips.

### Streak
The header streak counts **consecutive calendar days** you hit your daily session target (same threshold as earning a Focus Coin). Missing a day resets the streak to 1 on the next day you hit the target. Skipping or missing individual sessions without reaching the target does not extend the streak.

When you hit your daily target, a **streak celebration** modal appears (similar to Duolingo) showing your updated streak and any Focus Coin earned.

---

## Home Screen Philosophy
The Home screen should answer exactly one question: *"What should I do next?"* Keep it intentionally minimal and free of dashboard clutter.

### Layout Hierarchy:
1. **Header:** Displays weekday, date, and streak count. Focus Coins are **not** shown in the header.
2. **Daily Goal Card:** Displays today's numerical performance (e.g. `1 / 1 Sessions Completed` or `2 / 3`) and a clean horizontal progress bar. The target always matches today's scheduled Focus Nodes. It *never* displays Focus Coins.
3. **Dynamic Hero Card:** The primary status area and session timer. Only **one** instance exists on the dashboard, changing state dynamically (e.g., *No sessions today, Upcoming session, Walking to location, Verifying presence, Focus active, Session paused, Completed*). During active sessions it displays the countdown and a **Blocked Apps** button to manage distracting applications. Outside active sessions, the Hero intel row shows saved Focus Coins plus today's earn progress (e.g. `3 saved · 1 more today`).
4. **Settings — Focus Rewards:** Displays the user's saved Focus Coin balance and a short explanation of how to earn coins.
5. **Schedule Cards:** Rendered as a lightweight, scannable checklist tracking the day's nodes, showing an icon, title, scheduled time, and completion status.
6. **Floating Action Button (FAB):** Triggers a quick-action tray showing templates (`Class`, `Study`, `Gym`) and a `Custom` creation flow button.

**Focus Coin visibility:** Balance lives on **Settings** and the **Hero card** intel row. Earn feedback uses the streak celebration modal (and optional background notification when the app is not in the foreground). Coins must not appear on the Daily Goal card or home header.

---

## Core Security & Enforcement Experience

### Calendar shield vs venue proof
Lowalk separates **when apps are blocked** (calendar) from **whether you showed up** (geofence).

| Node type | Shield starts | Shield ends | Geofence role |
|-----------|---------------|-------------|---------------|
| **Gym / Library** | Scheduled `startTime` — anywhere | After required **on-site duration** is accumulated inside the geofence, or at **local midnight** (missed) | Proof of arrival + completion |
| **Class** | `startTime − 30m` (configurable) — anywhere | Scheduled `endTime` (+ away penalty if applicable), or earlier on verified departure | Proof of arrival + completion |

If two sessions are less than **30 minutes** apart, the shield **does not lift** between them.

#### Class completion rules

A class counts as complete when **either**:

1. **Scheduled end** — the user is verified inside the geofence when the nominal `endTime` passes, with no active away penalty; or
2. **Verified early departure** — after leaving the venue, if on-site attendance during the nominal class window meets a tiered threshold:
   - **≥ 80%** of scheduled class duration on-site → auto-complete after **2 minutes** away
   - **≥ 50%** of scheduled class duration on-site → auto-complete after **5 minutes** away (replaces penalty)
   - **Below 50%** → no auto-complete; existing away grace and penalty rules apply

Pre-buffer time (before nominal `startTime`) does **not** count toward on-site attendance. Gym and library sessions still require the full configured on-site duration.

### 1. The Blocking Overlay
When a shielded application is opened during an active lock window, a standalone full-screen layout overlays it. It contains a motivational quote, the remaining focus session time counter, a button navigating to the Home screen (Hero Card), and a Close button. It **never** contains a Skip button or Ads.

### 2. Blocked Apps Configuration
Users manage their list of distracting applications from a dedicated screen reachable via the Hero Card **Blocked Apps** button during active sessions. The list is stored locally. OS-level app shielding and the Blocking Overlay are separate native integrations built on top of this configuration.
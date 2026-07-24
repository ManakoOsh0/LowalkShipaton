# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.


You are an expert React Native and Expo engineer helping me build **Lowalk**.
Write clean, simple, maintainable code. Prioritize clarity over unnecessary abstraction. 
Think like a senior mobile developer maximizing local platform capabilities.

---

## Project Context & Mission
Refer to `PRODUCT.md` for our core mission and complete product specification. 
Lowalk separates **what the user is doing** (Focus Node) from **where they are doing it** (Anchor). 
- **Focus Node:** Represents an activity (Class, Study, Gym, Work). Stores title, icon, schedule config, duration, and linked Anchor ID. **Never** stores raw GPS coordinates.
- **Anchor:** Represents a physical location. Stores geocoded venue id, map coordinates, geofence radius, and optional calibration state. Multiple Focus Nodes can link to the same Anchor.

---

## Tech Stack
- **Framework:** Expo (Managed Workflow with Custom Config Plugins for Native APIs)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State & Local Storage:** Zustand, AsyncStorage, and `expo-sqlite`
- **Subscriptions / Paywalls:** RevenueCat & Superwall
- **Analytics:** PostHog React Native SDK (Anonymous attribution tracking)

Do not introduce new major libraries unless there is a strong reason.
Ask before installing anything new.

---

## Decision Making
If something is unclear or could be improved, suggest a better
approach. If a new library would significantly help, recommend it,
explain why, and ask before adding it.
Do not install new libraries without approval.

## Architecture & Folder Structure
src/
app/          # Expo Router paths or core navigational hubs
components/   # Reusable visual UI elements (DailyGoalCard, HeroCard, ScheduleCard)
constants/    # Colors, styling boundaries, global.css
data/         # Hardcoded content templates
hooks/        # Location tracking listeners, time handlers
services/     # RevenueCat, PostHog, and local database managers
store/        # Zustand client-state slices (useUserStore, useScheduleStore)
types/        # Explicit TypeScript definitions
assets/       # Centralized images and icons

**app/** is for routes and screens only. Screens compose components and
call hooks or stores. They should not contain large reusable UI blocks
or business logic.
**components/** is for reusable UI. Create a component when it is
reused in multiple places, when it makes a screen easier to read, or
when it represents a clear UI concept. Examples for this app:
[EXAMPLE_COMPONENT_NAMES]. Do not create components too early.
**data/** holds hardcoded content. Keep it typed.
**store/** holds Zustand stores. Examples of state to keep here:
[EXAMPLE_STATE_FIELDS]. Persist with AsyncStorage when needed.
**lib/** holds external service helpers (clerk.ts, api.ts, cn.ts).
Never expose secret keys here.

---

---

## Commenting & Documentation Rules
When writing or modifying code, write meaningful inline comments that explain the **"why"** behind complex logic, not just the "what". 
- **Component Level:** Add a brief 2-3 line comment at the top of new components explaining their role in the local-first lifecycle.
- **Dynamic Math/Logic:** Explicitly comment on distance calculations (Haversine), time-clash algorithms, or geofencing triggers so the logic is easy to audit.
- **State Changes:** Add inline comments when local Zustand actions write back to AsyncStorage or trigger system-enforced locks.
- **Keep it clean:** Do not clutter basic UI markup with obvious comments (e.g., do not comment `// This is a view wrapper`). Focus comments entirely on business logic and hardware interactions.

---

## Critical Engineering & Data Rules

### 1. State Management & Overlap Protection
- **Zustand Store:** Use `useScheduleStore` to track nodes and anchors. Use `useUserStore` for coins, streaks, and onboarding.
- **Overlap Validation:** Before saving a new Focus Node session, the store must calculate time parameters to prevent clashes. 
  - Classes evaluate from absolute start to end times.
  - Gym/Library entries calculate an explicit window by adding `durationHours` to their scheduled `startTime`.
  - Reject insertions if standard mathematical intervals intersect: `(StartA < EndB) && (EndA > StartB)`.

### 2. Geofencing & Passive Calibration
- **Place Selection at Create:** Focus Node create/edit must attach a venue via search (native geocode + Nominatim), map pin on the venue (not home GPS), or deferred “set when I arrive.” Never invent free-text places with no path to real coords.
- **Optional Calibration:** Users with map coords may manually align the geofence to their seat (session detail). Deferred venues require on-site GPS when the schedule window opens. Radius presets:
  - 🪑 Small Room: 15–20m
  - 🎓 Classroom: 25–35m
  - 📚 Library Floor: 40–50m
  - 🏋 Large Gym / Building: 50–75m
  - ⚙️ Custom Radius
- **Geofence Stability:** Keep geofence logic predictable. **Do not** automatically recalibrate coordinates or continuously modify Anchor coordinates via moving averages. Updates must be manual user edits only.

### 3. Screen Constraints & UI Layout Architecture
- **Header:** Contains the Lowalk logo, Focus Coin balance, and Streak count. Coins are **only** visible here; never duplicate them inside cards.
- **Daily Goal Card:** Displays numerical progress (e.g., `1 / 1` or `2 / 3` Sessions Completed) and a fill-bar. Target equals today's scheduled Focus Nodes. **Never** show coins here.
- **The Hero Card:** The primary dynamic information hub and session timer. Only **one** instance must exist on the dashboard screen, cycling text and button indicators dynamically through the product states (Walking, Verifying, Active, Paused, etc.). During active sessions it shows the countdown and a **Blocked Apps** CTA.
- **Floating Action Button (FAB):** Opens a minimalist Quick Actions tray offering preset templates (Class, Study, Gym), a fully customizable setup, and a shortcut to Blocked Apps.

### 4. Guarded Overlay & Session Mechanics
- **Blocking Overlay:** Fullscreen system enforcement view. Shows motivational text, remaining session time, a navigation shortcut to Home (Hero Card), and a close action. It **never** contains a Skip or Ad option.
- **Blocked Apps:** Local configuration screen for distracting apps. Reachable from the Hero Card CTA and FAB. Skip mechanics or Rewarded Ad actions are deferred until native enforcement ships.

---

## Styling & Image Rules
- Use NativeWind classes. Avoid inline style blocks unless handling dynamic run-time calculations (such as width fill-bar percentages on progress cards) or platform shadow abstractions.
- Centralize all static asset paths within `constants/images.ts`. Do not import asset files directly into UI files.

---

## Final Coding Reminder
Before generating any screen component or local service model, check `PRODUCT.md` for layout hierarchy requirements and `AGENT.md` for implementation limits. Keep code simple, clean, and 100% focused on a local companion tool layout.
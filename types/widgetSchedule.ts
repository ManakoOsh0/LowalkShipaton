/** Schedule bundle synced to the Android home screen widget for offline refresh. */

import type { HeroWidgetAppearancePayload } from "@/lib/heroWidgetAppearance";
import type { HeroWidgetSnapshot } from "@/types/heroWidget";

export type WidgetFocusNodePayload = {
  id: string;
  title: string;
  kind: string;
  scheduleType: "class" | "duration";
  weekday: number;
  startMinutes: number;
  endMinutes: number;
  locationLabel: string | null;
  completedToday: boolean;
  skippedToday: boolean;
};

export type WidgetActiveSessionPayload = {
  nodeId: string;
  nodeTitle: string;
  zoneLabel: string;
  scheduleType: "class" | "duration";
  shieldStartsAtMs: number;
  endsAtMs: number;
  presenceVerified: boolean;
  requiredOnSiteMs: number | null;
  onSiteAccumulatedMs: number;
  awaySinceMs: number | null;
  penaltyShieldEndsAtMs: number | null;
  penaltyMinutes: number | null;
};

export type WidgetIntelCellPayload = {
  label: string;
  value: string;
};

export type WidgetUpcomingRowPayload = {
  timeLabel: string;
  title: string;
  locationLabel: string;
};

/** Flat schedule + last hero display copy — native recomputes time-sensitive fields offline. */
export type WidgetScheduleBundle = {
  syncedAtMs: number;
  timezoneId: string;
  classPreBufferMinutes: number;
  sessionGapMergeMinutes: number;
  dailyGoalCompleted: number;
  dailyGoalTarget: number;
  blockedAppsCount: number;
  blockedPackageNames: string[];
  /** Estimated lifetime focus minutes (scheduled length × completions). */
  totalFocusMinutes: number;
  todayIso: string;
  todayWeekday: number;
  nodes: WidgetFocusNodePayload[];
  activeSession: WidgetActiveSessionPayload | null;
  display: HeroWidgetSnapshot;
  intelCells: WidgetIntelCellPayload[];
  upcomingToday: WidgetUpcomingRowPayload[];
  /** Resolved hero look — mirrors Settings → Hero look for the home widget. */
  appearance: HeroWidgetAppearancePayload;
};

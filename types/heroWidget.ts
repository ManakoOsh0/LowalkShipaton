/** Flat payload shared with the Android home screen widget via native bridge. */

import type { HeroCardState } from "@/types/dashboard";

export type HeroWidgetSnapshot = {
  state: HeroCardState;
  sessionTitle: string;
  /** e.g. "CLASS", "GYM" */
  metaLeft: string;
  /** e.g. "ACTIVE", "VERIFYING", "UP NEXT" */
  metaRight: string;
  /** Center metric primary line */
  headline: string;
  subline?: string;
  countdownLabel?: string;
  progressRatio?: number;
  dailyGoalCompleted: number;
  dailyGoalTarget: number;
  updatedAtMs: number;
  /** Enables native countdown refresh when the app is backgrounded. */
  sessionEndsAtMs?: number;
  /** Session start — powers anchored progress while active. */
  sessionStartsAtMs?: number;
  /** Scheduled window copy, e.g. "2:00 PM – 4:00 PM". */
  timeWindowLabel?: string;
  /** Venue name for the metadata row. */
  locationLabel?: string;
  /** Walk distance + ETA while travelling. */
  travelLabel?: string;
  /** Footer copy, e.g. "Up next: Gym at 4:30 PM · Campus Center". */
  upNextFooter?: string;
  blockedAppsLabel?: string;
};

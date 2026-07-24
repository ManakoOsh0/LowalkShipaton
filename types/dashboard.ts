/** Dashboard UI models — session progress, hero states, and schedule rows. */

export type DailyGoal = {
  completed: number;
  target: number;
};

/**
 * Hero Card lifecycle — up next, journey, active session, and weekly ledger.
 */
export type HeroCardState =
  | "up_next"
  | "on_the_way"
  | "active"
  | "weekly_report";

/** Structured next-session details for the up_next hero state. */
export type HeroUpNextSnapshot = {
  sessionTitle: string;
  timeLabel: string;
  locationLabel: string;
  /** Relative start copy, e.g. "Starts in 1 hour 15 minutes". */
  startsInLabel: string;
};

/** Named icon keys rendered inside the shared Hero shell. */
export type HeroIconId =
  | "sunrise"
  | "whale"
  | "traveller"
  | "arrived"
  | "verification"
  | "paused"
  | "session_complete"
  | "target"
  | "walk"
  | "navigate"
  | "pin_check"
  | "satellite"
  | "flame"
  | "warning"
  | "trophy"
  | "crown"
  | "seedling"
  | "sparkle";

/** Primary CTA — null when the state is wait-only (arrived / verification). */
export type HeroActionKind =
  | "create_focus_node"
  | "view_schedule"
  | "open_maps"
  | "navigate"
  | "open_timer"
  | "resume_session"
  | "next_session"
  | "view_progress"
  | "view_statistics"
  | "view_today_schedule"
  | "manage_blocked_apps";

export type HeroAction = {
  label: string;
  kind: HeroActionKind;
};

export type HeroTravelStats = {
  distance: string;
  duration: string;
};

export type HeroFocusLedgerHeatmapDay = {
  dateIso: string;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
};

export type HeroFocusLedgerHeatmapWeek = {
  weekStartIso: string;
  isCurrentWeek: boolean;
  days: HeroFocusLedgerHeatmapDay[];
};

/** Weekly Focus Ledger rendered inside the weekly_report hero state. */
export type HeroFocusLedgerSnapshot = {
  /** Headline value for protected focus time this week (e.g. "45" + "min"). */
  focusTime: string;
  focusTimeUnit: string;
  currentStreak: number;
  focusCoins: number;
  sessionsCompleted: number;
  sessionsScheduled: number;
  /** Calendar days this week (Mon→today) with at least one completed session. */
  activeDaysThisWeek: number;
  /** GitHub-style columns — each week is Mon→Sun, rightmost is current. */
  heatmapWeeks: HeroFocusLedgerHeatmapWeek[];
};

/** One visual shell — content swaps while the component stays the same. */
export type HeroCardData = {
  state: HeroCardState;
  title: string;
  subtitle: string;
  /** Null hides the illustration for wait-only states like verification. */
  icon: HeroIconId | null;
  action: HeroAction | null;
  nodeId?: string;
  /** Anchor coords for Open Maps / Navigate. */
  latitude?: number | null;
  longitude?: number | null;
  /** Live countdown line (verification / active timer). */
  countdownLabel?: string | null;
  /** 0–1 fill for verification ring or session progress bar. */
  progressRatio?: number | null;
  /** Compact distance + walk-time pills for travelling states. */
  travelStats?: HeroTravelStats | null;
  /** Weekly Focus Ledger for weekly_report. */
  focusLedger?: HeroFocusLedgerSnapshot | null;
  /** Next session row for up_next. */
  upNext?: HeroUpNextSnapshot | null;
  /** Venue label for active session timer card. */
  locationLabel?: string | null;
};

export type ScheduleItemKind = "class" | "library" | "gym" | "custom";

export type ScheduleItemStatus =
  | "upcoming"
  | "completed"
  | "skipped"
  | "missed"
  | "overdue"
  | "active";

export type ScheduleItem = {
  id: string;
  title: string;
  timeLabel: string;
  locationLabel: string;
  kind: ScheduleItemKind;
  accent: "blue" | "green";
  status: ScheduleItemStatus;
};

export type WeekDaySchedule = {
  weekday: number;
  dayLabel: string;
  dateLabel: string;
  dateIso: string;
  isToday: boolean;
  items: ScheduleItem[];
};

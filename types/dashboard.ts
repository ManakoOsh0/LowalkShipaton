/** Dashboard UI models — session progress, hero states, and schedule rows. */

export type DailyGoal = {
  completed: number;
  target: number;
};

/** Hero Card lifecycle — up next, journey, and active session. */
export type HeroCardState = "up_next" | "on_the_way" | "active";

/** Structured next-session details for the up_next hero state. */
export type HeroUpNextSnapshot = {
  sessionTitle: string;
  timeLabel: string;
  locationLabel: string;
  /** Relative start copy, e.g. "Starts in 1 hour 15 minutes". */
  startsInLabel: string;
  endTimeLabel?: string;
  kindLabel?: string;
  leaveByLabel?: string | null;
};

/** Top-row chip — session kind, status, etc. */
export type HeroMetaChip = {
  label: string;
};

/** LAST / NEXT flanking context rail. */
export type HeroContextRail = {
  label: string;
  headline: string;
  subline: string;
};

export type HeroDayArcMarkerStatus = "done" | "current" | "upcoming" | "skipped";

export type HeroDayArc = {
  positionLabel: string;
  markers: Array<{ status: HeroDayArcMarkerStatus }>;
};

export type HeroIntelCell = {
  label: string;
  value: string;
};

export type HeroUpcomingRow = {
  timeLabel: string;
  title: string;
  locationLabel: string;
  status?: "current" | "upcoming";
};

/** Center metric between context rails — countdown, leave-by, or session title. */
export type HeroCenterMetric = {
  headline: string;
  subline?: string;
  countdownLabel?: string | null;
  progressRatio?: number | null;
};

/** Shibuya-style tactical inset — geofence circle with you vs venue pins. */
export type HeroTacticalInset = {
  mode: "en_route" | "verifying";
  radiusMeters: number;
  /** Straight-line meters from anchor center — drives pin placement. */
  distanceFromCenterMeters: number;
  venueShortLabel: string;
  hasUserPosition: boolean;
  locationUnavailable: boolean;
  verifyProgress?: number | null;
};

/** Zoned dashboard context for the fixed hero shell. */
export type HeroCardContext = {
  metaLeft: HeroMetaChip;
  metaRight: HeroMetaChip;
  sessionTitle: string;
  dayArc: HeroDayArc;
  leftRail?: HeroContextRail;
  rightRail?: HeroContextRail;
  center: HeroCenterMetric;
  intelCells: HeroIntelCell[];
  upcomingToday: HeroUpcomingRow[];
  tagline?: string;
  /** Tactical map inset for on_the_way / verifying hero moments. */
  tacticalInset?: HeroTacticalInset;
  /** Read-only shield copy — merged from blocked-apps store at hook layer. */
  blockedAppsLabel?: string;
  /** Straight-line meters outside geofence — drives travel progress on the display. */
  travelMetersAway?: number | null;
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
  /** Next session row for up_next. */
  upNext?: HeroUpNextSnapshot | null;
  /** Venue label for active session timer card. */
  locationLabel?: string | null;
  /** Rich zoned dashboard — meta, rails, intel, upcoming strip. */
  context?: HeroCardContext | null;
  /** Blocked apps count merged at hook layer for active-state intel. */
  blockedAppsCount?: number;
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
  /** Minutes since midnight — drives week timetable block placement. */
  startMinutes: number;
  endMinutes: number;
  /** Calendar day for this occurrence — used when skipping today only. */
  dateIso: string;
  isToday: boolean;
};

export type WeekDaySchedule = {
  weekday: number;
  dayLabel: string;
  dateLabel: string;
  dateIso: string;
  isToday: boolean;
  items: ScheduleItem[];
};

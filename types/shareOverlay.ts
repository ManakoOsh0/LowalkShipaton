import type { FocusNodeKind } from "@/types/focusNode";

export type ShareOverlayHeroStat =
  | "duration"
  | "streak"
  | "sessions_today"
  | "sessions_this_week"
  | "on_site_percent"
  | "node_title";

export type ShareOverlayContext =
  | "session_complete"
  | "daily_goal"
  | "weekly_recap"
  | "node_milestone";

export type ShareOverlayMoment =
  | "early_class"
  | "gym"
  | "library"
  | "class"
  | "focus"
  | "generic";

export type ShareOverlayContributionLevel = 0 | 1 | 2 | 3 | 4;

export type ShareOverlayContributionDay = {
  dateIso: string;
  level: ShareOverlayContributionLevel;
};

export type ShareOverlayContributionWeek = {
  weekStartIso: string;
  days: ShareOverlayContributionDay[];
};

export type ShareOverlayTemplateId =
  | "early_class"
  | "gym_session"
  | "library_session"
  | "neon_duration"
  | "trmnl_hud"
  | "weekly_grid"
  | "streak_hero"
  | "day_poster"
  | "stats_grid"
  | "minimal_verified"
  | "stacked_sessions"
  | "imessage_bubble"
  | "receipt"
  | "knockout"
  | "broadcast";

export type ShareOverlayWeekDay = {
  label: string;
  sessionCount: number;
  dateIso: string;
  isToday: boolean;
};

export type ShareOverlayTodaySession = {
  nodeTitle: string;
  kind: FocusNodeKind;
  durationLabel: string;
};

export type ShareOverlayPayload = {
  context: ShareOverlayContext;
  completedAt: number;

  nodeId: string;
  nodeTitle: string;
  kind: FocusNodeKind;
  kindLabel: string;
  scheduleType: "class" | "duration";

  durationMs: number;
  durationLabel: string;
  onSitePercent: number | null;
  presenceVerified: boolean;

  venueName: string | null;
  locationLabel: string | null;
  placeLine: string;

  streak: number;
  sessionsCompletedToday: number;
  dailyGoalTarget: number;
  hitDailyGoal: boolean;

  weekDays: ShareOverlayWeekDay[];
  weekSessionTotal: number;

  todaySessions: ShareOverlayTodaySession[];

  /** Last N weeks of daily activity for the Consistency Map template. */
  contributionWeeks: ShareOverlayContributionWeek[];
  activeDaysLast30: number;
  /** True when enough history exists to surface the Consistency Map template. */
  consistencyMapEligible: boolean;

  /** Kind + schedule derived moment — drives suggested template and copy. */
  moment: ShareOverlayMoment;
  scheduledTimeLabel: string | null;
  momentHeadline: string;
  momentSubline: string;
  momentTertiary: string;
};

export const SHARE_OVERLAY_TEMPLATES: Array<{
  id: ShareOverlayTemplateId;
  label: string;
  requiresMultipleSessions?: boolean;
  requiresMoment?: ShareOverlayMoment;
}> = [
  { id: "early_class", label: "7AM Class", requiresMoment: "early_class" },
  { id: "gym_session", label: "Gym", requiresMoment: "gym" },
  { id: "library_session", label: "Library", requiresMoment: "library" },
  { id: "neon_duration", label: "Neon" },
  { id: "trmnl_hud", label: "HUD" },
  { id: "weekly_grid", label: "Week" },
  { id: "streak_hero", label: "Streak" },
  { id: "day_poster", label: "Poster" },
  { id: "stats_grid", label: "Grid" },
  { id: "minimal_verified", label: "Minimal" },
  { id: "stacked_sessions", label: "Stacked", requiresMultipleSessions: true },
  { id: "imessage_bubble", label: "Bubble" },
  { id: "receipt", label: "Receipt" },
  { id: "knockout", label: "Knockout" },
  { id: "broadcast", label: "Live" },
];

export function getShareTemplatesForPayload(payload: ShareOverlayPayload) {
  const applicable = SHARE_OVERLAY_TEMPLATES.filter((template) => {
    if (template.requiresMoment && template.requiresMoment !== payload.moment) return false;
    if (template.requiresMultipleSessions && payload.todaySessions.length < 2) return false;
    return true;
  });

  return [
    ...applicable.filter((template) => template.requiresMoment),
    ...applicable.filter((template) => !template.requiresMoment),
  ];
}

export function suggestedTemplateForPayload(payload: ShareOverlayPayload): ShareOverlayTemplateId {
  switch (payload.moment) {
    case "early_class":
      return "early_class";
    case "gym":
      return "gym_session";
    case "library":
      return "library_session";
    case "class":
      return "day_poster";
    default:
      return "neon_duration";
  }
}

export const SHARE_OVERLAY_HERO_STATS: Array<{
  id: ShareOverlayHeroStat;
  label: string;
}> = [
  { id: "duration", label: "Duration" },
  { id: "streak", label: "Streak" },
  { id: "sessions_today", label: "Today" },
  { id: "sessions_this_week", label: "Week" },
  { id: "node_title", label: "Title" },
];

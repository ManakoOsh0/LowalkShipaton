/** Statistics screen UI models — period charts + consistency sections. */

export type StatsPeriod = "week" | "month" | "year";

export type PeriodChartBar = {
  label: string;
  /** Session count for the bucket (kept for streak / share consumers). */
  value: number;
  /** Estimated focus minutes for the same bucket (stats chart metric). */
  focusMinutes: number;
  dateIso?: string;
};

export type PeriodTrend = {
  /** Percent change vs previous period; null when previous had no focus time. */
  percentChange: number | null;
  direction: "up" | "down" | "flat" | "new";
  comparisonLabel: string;
};

export type PeriodDayStat = {
  dateIso: string;
  label: string;
  focusMinutes: number;
  sessions: number;
  isToday?: boolean;
};

export type PeriodStats = {
  period: StatsPeriod;
  bars: PeriodChartBar[];
  totalSessions: number;
  totalFocusMinutes: number;
  avgFocusMinutes: number;
  /** Large hero label, e.g. "Avg Focus Time". */
  heroLabel: string;
  /** Formatted hero value, e.g. "11h 59m". */
  heroValue: string;
  trend: PeriodTrend;
  dayBreakdown: PeriodDayStat[];
  summaryLabel: string;
  sectionTitle: string;
  activityTitle: string;
};

export type WeeklyProgress = {
  completed: number;
  target: number;
  percent: number;
};

/**
 * Real-world consistency recap — showed up, places, planned days.
 * Hours are supporting; session count and places carry the story.
 */
export type ConsistencyRecap = {
  title: string;
  sessionsCompleted: number;
  sessionsPlanned: number;
  focusMinutes: number;
  plannedMinutes: number;
  /** Completed sessions / planned sessions. */
  sessionCompletionPercent: number;
  plannedDays: number;
  showedUpDays: number;
  locationCount: number;
  /** Unique kind/place labels for completed sessions, schedule order. */
  placesVisited: string[];
  emptyMessage: string;
};

export type LifetimeStat = {
  id: string;
  icon: string;
  value: string;
  label: string;
  /** Numeric target for count-up animation when parseable. */
  numericValue?: number;
};

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  unlocked: boolean;
};

export type ContributionLevel = 0 | 1 | 2 | 3;

export type ContributionDay = {
  dateIso: string;
  level: ContributionLevel;
};

export type ContributionWeek = {
  weekStartIso: string;
  days: ContributionDay[];
};

export type PersonalBest = {
  id: string;
  icon: string;
  label: string;
  value: string;
};

export type StatInsight = {
  id: string;
  message: string;
};

export type StatsScreenData = {
  streak: number;
  weeklyProgress: WeeklyProgress;
  lifetimeStats: LifetimeStat[];
  achievements: Achievement[];
  contributionWeeks: ContributionWeek[];
  personalBests: PersonalBest[];
  insights: StatInsight[];
};

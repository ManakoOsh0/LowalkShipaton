/** Statistics screen UI models — period charts + mocked gamification sections. */

export type StatsPeriod = "week" | "month" | "year";

export type PeriodChartBar = {
  label: string;
  value: number;
  dateIso?: string;
};

export type PeriodStats = {
  period: StatsPeriod;
  bars: PeriodChartBar[];
  totalSessions: number;
  summaryLabel: string;
  sectionTitle: string;
};

export type WeeklyProgress = {
  completed: number;
  target: number;
  percent: number;
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

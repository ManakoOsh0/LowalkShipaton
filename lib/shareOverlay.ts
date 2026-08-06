import {
  buildShareMomentCopy,
  resolveShareMoment,
  scheduledTimeLabelForNode,
} from "@/lib/shareOverlayMoments";
import { computeConsistencyStats } from "@/lib/consistencyStats";
import { computePeriodStats } from "@/lib/periodStats";
import { addDaysToIsoDate, getScheduleWindow, toIsoDateString } from "@/lib/time";
import {
  countCompletedSessionsToday,
  getDailyGoalTarget,
} from "@/store/selectors";
import type { Anchor } from "@/types/anchor";
import type { FocusNode, FocusNodeKind } from "@/types/focusNode";
import type {
  ShareOverlayContext,
  ShareOverlayContributionWeek,
  ShareOverlayHeroStat,
  ShareOverlayPayload,
  ShareOverlayTemplateId,
  ShareOverlayTodaySession,
  ShareOverlayWeekDay,
} from "@/types/shareOverlay";
import { suggestedTemplateForPayload } from "@/types/shareOverlay";

const KIND_LABELS: Record<FocusNodeKind, string> = {
  class: "CLASS",
  gym: "GYM",
  library: "LIBRARY",
  custom: "FOCUS",
};

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export const SHARE_EXPORT_WIDTH = 1080;
export const SHARE_EXPORT_HEIGHT = 1920;
export const SHARE_CONSISTENCY_MAP_WEEKS = 12;
export const SHARE_CONSISTENCY_MAP_MIN_ACTIVE_DAYS = 14;

export function shareScale(width: number): number {
  return width / SHARE_EXPORT_WIDTH;
}

/** Aura-style duration label — `2H 14M`, `45M`. */
export function formatShareDurationLabel(durationMs: number): string {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}H ${minutes}M`;
  if (hours > 0) return `${hours}H`;
  return `${minutes}M`;
}

/** Lowercase variant for minimal templates — `2h 14m`. */
export function formatShareDurationLowercase(durationMs: number): string {
  return formatShareDurationLabel(durationMs)
    .replace(/H/g, "h")
    .replace(/M/g, "m");
}

export function formatShareKindLabel(kind: FocusNodeKind): string {
  return KIND_LABELS[kind];
}

export function formatShareWeekdayHeader(completedAt: number): string {
  return new Date(completedAt)
    .toLocaleDateString(undefined, { weekday: "long" })
    .toUpperCase();
}

export function formatShareShortDate(completedAt: number): string {
  const date = new Date(completedAt);
  const month = date
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase()
    .replace(".", "");
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}, ${day} ${year}`;
}

export function formatShareHudDate(completedAt: number): string {
  const date = new Date(completedAt);
  const weekday = date
    .toLocaleDateString(undefined, { weekday: "short" })
    .toUpperCase()
    .replace(".", "");
  const month = date
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase()
    .replace(".", "");
  return `${weekday}, ${month} ${date.getDate()} ${date.getFullYear()}`;
}

export function formatShareTimeOfDay(completedAt: number): string {
  const date = new Date(completedAt);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${period} ${hours12}:${minutes}`;
}

function getMondayOfWeek(referenceDate: Date): Date {
  const monday = new Date(referenceDate);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function buildWeekDays(nodes: FocusNode[], referenceDate: Date): ShareOverlayWeekDay[] {
  const monday = getMondayOfWeek(referenceDate);
  const mondayIso = toIsoDateString(monday);
  const todayIso = toIsoDateString(referenceDate);
  const completionDates = nodes.flatMap((node) => node.completedDates);

  return WEEKDAY_LABELS.map((label, index) => {
    const dateIso = addDaysToIsoDate(mondayIso, index);
    const sessionCount = completionDates.filter((iso) => iso === dateIso).length;
    return {
      label,
      sessionCount,
      dateIso,
      isToday: dateIso === todayIso,
    };
  });
}

function buildTodaySessions(nodes: FocusNode[], referenceDate: Date): ShareOverlayTodaySession[] {
  const todayIso = toIsoDateString(referenceDate);
  return nodes
    .filter((node) => node.completedDates.includes(todayIso))
    .map((node) => {
      const window = getScheduleWindow(node.schedule);
      const durationMs = (window.endMinutes - window.startMinutes) * 60_000;
      return {
        nodeTitle: node.title,
        kind: node.kind,
        durationLabel: formatShareDurationLabel(durationMs),
      };
    });
}

function resolvePlaceLine(venueName: string | null, locationLabel: string | null): string {
  return venueName?.trim() || locationLabel?.trim() || "";
}

/** Truncate contribution history for share export readability. */
export function buildShareContributionWeeks(
  weeks: ShareOverlayContributionWeek[],
): ShareOverlayContributionWeek[] {
  return weeks.slice(-SHARE_CONSISTENCY_MAP_WEEKS).map((week) => ({
    weekStartIso: week.weekStartIso,
    days: week.days.map((day) => ({
      dateIso: day.dateIso,
      level: day.level,
    })),
  }));
}

export function countActiveDaysInContributionWeeks(
  weeks: ShareOverlayContributionWeek[],
): number {
  return weeks.reduce(
    (sum, week) => sum + week.days.filter((day) => day.level > 0).length,
    0,
  );
}

export function isConsistencyMapEligible(weeks: ShareOverlayContributionWeek[]): boolean {
  return countActiveDaysInContributionWeeks(weeks) >= SHARE_CONSISTENCY_MAP_MIN_ACTIVE_DAYS;
}

/** Hide long or street-style addresses by default. */
export function shouldShowVenueByDefault(placeLine: string): boolean {
  if (!placeLine || placeLine.length > 32) return false;
  if (/\d{1,5}\s+\w+/.test(placeLine) && placeLine.includes(",")) return false;
  return true;
}

export function defaultTemplateForContext(
  context: ShareOverlayContext,
  payload?: Pick<ShareOverlayPayload, "moment" | "kind">,
): ShareOverlayTemplateId {
  if (context === "session_complete" && payload) {
    return suggestedTemplateForPayload(payload as ShareOverlayPayload);
  }
  switch (context) {
    case "daily_goal":
      return "streak_hero";
    case "weekly_recap":
      return "weekly_grid";
    default:
      return "neon_duration";
  }
}

export function defaultHeroStatForContext(context: ShareOverlayContext): ShareOverlayHeroStat {
  switch (context) {
    case "daily_goal":
      return "streak";
    case "weekly_recap":
      return "sessions_this_week";
    default:
      return "duration";
  }
}

export function resolveHeroPrimaryText(
  payload: ShareOverlayPayload,
  heroStat: ShareOverlayHeroStat,
): string {
  switch (heroStat) {
    case "duration":
      return payload.durationLabel;
    case "streak":
      return `${Math.max(payload.streak, 1)}-DAY`;
    case "sessions_today":
      return `${payload.sessionsCompletedToday}/${payload.dailyGoalTarget}`;
    case "sessions_this_week":
      return String(payload.weekSessionTotal);
    case "on_site_percent":
      return payload.onSitePercent != null ? `${payload.onSitePercent}%` : "VERIFIED";
    case "node_title":
      return payload.nodeTitle.length > 22
        ? `${payload.nodeTitle.slice(0, 20)}…`
        : payload.nodeTitle;
  }
}

type BuildShareOverlayOptions = {
  context: ShareOverlayContext;
  nodeId?: string;
  completedAt?: number;
  durationMs?: number;
  onSitePercent?: number | null;
  presenceVerified?: boolean;
  scheduleType?: "class" | "duration";
  streak?: number;
  hitDailyGoal?: boolean;
};

/** Assembles a share payload from local schedule + anchor data. */
export function buildShareOverlayPayload(
  nodes: FocusNode[],
  anchors: Anchor[],
  options: BuildShareOverlayOptions,
): ShareOverlayPayload {
  const referenceDate = new Date(options.completedAt ?? Date.now());
  const todayIso = toIsoDateString(referenceDate);
  const completedAt = options.completedAt ?? Date.now();

  const node =
    (options.nodeId ? nodes.find((item) => item.id === options.nodeId) : null) ??
    nodes.find((item) => item.completedDates.includes(todayIso)) ??
    nodes[0];

  const anchor = node?.anchorId
    ? anchors.find((item) => item.id === node.anchorId) ?? null
    : null;
  const venueName = anchor?.name ?? null;
  const locationLabel = node?.locationLabel ?? null;
  const placeLine = resolvePlaceLine(venueName, locationLabel);

  const scheduleWindow = node ? getScheduleWindow(node.schedule) : null;
  const scheduledMs = scheduleWindow
    ? (scheduleWindow.endMinutes - scheduleWindow.startMinutes) * 60_000
    : 0;
  const durationMs =
    options.durationMs && options.durationMs > 0
      ? options.durationMs
      : scheduledMs > 0
        ? scheduledMs
        : 60_000;

  const onSitePercent =
    options.onSitePercent !== undefined
      ? options.onSitePercent
      : scheduledMs > 0 && options.durationMs
        ? Math.min(100, Math.round((options.durationMs / scheduledMs) * 100))
        : null;

  const weekDays = buildWeekDays(nodes, referenceDate);
  const weekSessionTotal = computePeriodStats(nodes, "week", referenceDate).totalSessions;
  const sessionsCompletedToday = countCompletedSessionsToday(nodes, referenceDate);
  const dailyGoalTarget = getDailyGoalTarget(nodes, referenceDate);
  const streak = options.streak ?? 0;
  const consistency = computeConsistencyStats(nodes, streak, referenceDate);
  const contributionWeeks = buildShareContributionWeeks(consistency.contributionWeeks);
  const consistencyMapEligible = isConsistencyMapEligible(contributionWeeks);
  const moment = resolveShareMoment(node);
  const scheduledTimeLabel = scheduledTimeLabelForNode(node);

  const basePayload = {
    context: options.context,
    completedAt,
    nodeId: node?.id ?? "",
    nodeTitle: node?.title ?? "Focus Session",
    kind: node?.kind ?? "custom",
    kindLabel: formatShareKindLabel(node?.kind ?? "custom"),
    scheduleType:
      options.scheduleType ?? (node?.schedule.type === "class" ? "class" : "duration"),
    durationMs,
    durationLabel: formatShareDurationLabel(durationMs),
    onSitePercent,
    presenceVerified: options.presenceVerified ?? true,
    venueName,
    locationLabel,
    placeLine,
    streak,
    sessionsCompletedToday,
    dailyGoalTarget,
    hitDailyGoal: options.hitDailyGoal ?? sessionsCompletedToday >= dailyGoalTarget,
    weekDays,
    weekSessionTotal,
    todaySessions: buildTodaySessions(nodes, referenceDate),
    contributionWeeks,
    activeDaysLast30: consistency.activeDaysLast30,
    consistencyMapEligible,
    moment,
    scheduledTimeLabel,
  };

  const momentCopy = buildShareMomentCopy(node, moment, {
    nodeTitle: basePayload.nodeTitle,
    durationLabel: basePayload.durationLabel,
    placeLine: basePayload.placeLine,
    presenceVerified: basePayload.presenceVerified,
    scheduledTimeLabel,
  });

  return {
    ...basePayload,
    momentHeadline: momentCopy.headline,
    momentSubline: momentCopy.subline,
    momentTertiary: momentCopy.tertiary,
  };
}

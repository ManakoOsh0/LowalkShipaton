/**
 * Hero intel builders — leave-by, day arc, context rails, shield/on-site copy.
 * Keeps selector branches thin; all strings are derived from local schedule + presence data.
 */
import type { Anchor } from "@/types/anchor";
import type {
    DailyGoal,
    HeroCardContext,
    HeroCardData,
    HeroCenterMetric,
    HeroContextRail,
    HeroDayArc,
    HeroDayArcMarkerStatus,
    HeroIntelCell,
    HeroUpcomingRow,
    ScheduleItem,
    ScheduleItemKind,
} from "@/types/dashboard";
import type { FocusNode, FocusNodeKind } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

import { getClassEarlyCompleteRemainingMs } from "@/lib/classCompletion";
import { distanceOutsideGeofenceMeters, hasUsableCoordinates, resolveAnchorForNode } from "@/lib/geo";
import { formatTravelDurationBadge, getHeroPreviewKindFixture, HERO_PREVIEW_KIND_LABELS } from "@/lib/heroCard";
import {
    resolveHeroDisplayPhase,
    resolveHeroStatusLabel,
} from "@/lib/heroDisplay";
import { getAwayGraceRemainingMs } from "@/lib/sessionPenalty";
import {
    formatDurationClock,
    formatOnSiteRemainingLabel,
    isAppShieldActive,
    type ShieldScheduleSettings,
} from "@/lib/shieldSchedule";
import {
    formatMinutesToLabel,
    formatStartClock24,
    getScheduleWindow
} from "@/lib/time";
import type { PresenceContext } from "@/store/selectors";
import type { HeroPreviewKind, HeroPreviewVariant } from "@/store/useHeroPreviewStore";

const WALK_METERS_PER_MINUTE = 80;
const LEAVE_BUFFER_MINUTES = 5;

export function formatBlockedAppsLabel(count: number): string {
  if (count <= 0) return "No apps blocked";
  if (count === 1) return "1 app blocked";
  return `${count} apps blocked`;
}

const KIND_LABELS: Record<ScheduleItemKind, string> = {
  class: "CLASS",
  gym: "GYM",
  library: "LIBRARY",
  custom: "FOCUS",
};

const NODE_KIND_LABELS: Record<FocusNodeKind, string> = {
  class: "CLASS",
  gym: "GYM",
  library: "LIBRARY",
  custom: "FOCUS",
};

export type HeroIntelParams = {
  nodes: FocusNode[];
  anchors: Anchor[];
  activeSession: ActiveSessionSnapshot | null;
  presence: PresenceContext | null;
  referenceDate: Date;
  dailyGoal: DailyGoal;
  schedule: ScheduleItem[];
  shieldSettings: ShieldScheduleSettings;
  blockedAppsCount?: number;
};

function normalizeKind(kind: FocusNode["kind"] | "study"): FocusNodeKind {
  if (kind === "study") return "library";
  return kind;
}

function kindLabelForNode(node: FocusNode | undefined): string {
  if (!node) return "FOCUS";
  return NODE_KIND_LABELS[normalizeKind(node.kind)];
}

function kindLabelForItem(item: ScheduleItem | undefined): string {
  if (!item) return "FOCUS";
  return KIND_LABELS[item.kind];
}

/** Walk ETA + buffer → actionable leave-by clock label. */
export function buildLeaveByLabel(
  startMinutes: number,
  metersAway: number | null,
  referenceDate: Date,
): string | null {
  if (metersAway == null) return null;
  const walkMinutes = Math.max(1, Math.round(metersAway / WALK_METERS_PER_MINUTE));
  const leaveMinutes = startMinutes - walkMinutes - LEAVE_BUFFER_MINUTES;
  if (leaveMinutes < 0) return "Leave now";
  return formatMinutesToLabel(leaveMinutes);
}

export function buildEndTimeLabel(schedule: FocusNode["schedule"]): string {
  const { endMinutes } = getScheduleWindow(schedule);
  const hours = Math.floor(endMinutes / 60) % 24;
  const minutes = endMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function buildCoinStakesLabel(dailyGoal: DailyGoal): string | null {
  if (dailyGoal.target === 0) return null;
  const remaining = dailyGoal.target - dailyGoal.completed;
  if (remaining <= 0) return "Today's coin earned";
  if (remaining === 1) return "1 more for today's coin";
  return `${remaining} more for today's coin`;
}

/** Saved balance plus today's earn progress for the Hero intel row. */
export function buildCoinIntelValue(coins: number, dailyGoal: DailyGoal): string {
  const saved = `${coins} saved`;
  if (dailyGoal.target === 0) return saved;

  const remaining = dailyGoal.target - dailyGoal.completed;
  if (remaining <= 0) return `${saved} · earned today`;
  if (remaining === 1) return `${saved} · 1 more today`;
  return `${saved} · ${remaining} more today`;
}

function isCoinIntelCell(cell: HeroIntelCell): boolean {
  return cell.label === "Coin" || cell.label === "Coins";
}

function buildCoinIntelCell(coins: number, dailyGoal: DailyGoal): HeroIntelCell {
  return {
    label: "Coins",
    value: buildCoinIntelValue(coins, dailyGoal),
  };
}

export function buildDayArc(
  schedule: ScheduleItem[],
  focusNodeId: string | null | undefined,
): HeroDayArc {
  const total = schedule.length;
  if (total === 0) {
    return { positionLabel: "0 of 0", markers: [] };
  }

  const currentIndex = focusNodeId
    ? schedule.findIndex((item) => item.id === focusNodeId)
    : schedule.findIndex((item) => item.status === "active" || item.status === "upcoming" || item.status === "overdue");

  const index = currentIndex >= 0 ? currentIndex : 0;

  const markers = schedule.map((item, itemIndex): { status: HeroDayArcMarkerStatus } => {
    if (item.status === "completed") return { status: "done" };
    if (item.status === "skipped") return { status: "skipped" };
    if (item.id === focusNodeId || item.status === "active") return { status: "current" };
    if (itemIndex < index) return { status: "done" };
    return { status: "upcoming" };
  });

  return {
    positionLabel: `Session ${index + 1} of ${total}`,
    markers,
  };
}

function railSublineForStatus(item: ScheduleItem): string {
  switch (item.status) {
    case "completed":
      return `Done ${item.timeLabel.split("–")[0]?.trim() ?? item.timeLabel}`;
    case "skipped":
      return "Skipped";
    case "active":
      return "Now";
    case "overdue":
      return "Overdue";
    default:
      return item.timeLabel.split("–")[0]?.trim() ?? item.timeLabel;
  }
}

export function buildContextRails(
  schedule: ScheduleItem[],
  focusNodeId: string | null | undefined,
): { leftRail?: HeroContextRail; rightRail?: HeroContextRail } {
  if (schedule.length === 0) return {};

  const currentIndex = focusNodeId
    ? schedule.findIndex((item) => item.id === focusNodeId)
    : schedule.findIndex(
        (item) =>
          item.status === "active" ||
          item.status === "upcoming" ||
          item.status === "overdue",
      );

  const index = currentIndex >= 0 ? currentIndex : 0;

  let leftRail: HeroContextRail | undefined;
  let rightRail: HeroContextRail | undefined;

  for (let i = index - 1; i >= 0; i--) {
    const item = schedule[i];
    if (item.status === "completed" || item.status === "skipped") {
      leftRail = {
        label: "LAST",
        headline: kindLabelForItem(item),
        subline: railSublineForStatus(item),
      };
      break;
    }
  }

  for (let i = index + 1; i < schedule.length; i++) {
    const item = schedule[i];
    if (item.status === "upcoming" || item.status === "overdue") {
      rightRail = {
        label: "NEXT",
        headline: kindLabelForItem(item),
        subline: railSublineForStatus(item),
      };
      break;
    }
  }

  return { leftRail, rightRail };
}

export function buildUpcomingTodayStrip(
  schedule: ScheduleItem[],
  focusNodeId: string | null | undefined,
  limit = 3,
): HeroUpcomingRow[] {
  const startIndex = focusNodeId
    ? Math.max(
        0,
        schedule.findIndex((item) => item.id === focusNodeId),
      )
    : schedule.findIndex(
        (item) =>
          item.status === "active" ||
          item.status === "upcoming" ||
          item.status === "overdue",
      );

  const fromIndex = startIndex >= 0 ? startIndex : 0;

  return schedule.slice(fromIndex, fromIndex + limit).map((item) => ({
    timeLabel: item.timeLabel.split("–")[0]?.trim() ?? item.timeLabel,
    title: item.title,
    locationLabel: item.locationLabel,
    status: item.id === focusNodeId || item.status === "active" ? "current" : "upcoming",
  }));
}

function buildShieldIntelLabel(
  nodes: FocusNode[],
  activeSession: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  referenceDate: Date,
): string | null {
  const now = referenceDate.getTime();
  if (!isAppShieldActive(nodes, activeSession, settings, now, referenceDate)) {
    return null;
  }

  if (activeSession?.penaltyShieldEndsAt) {
    const remainingMs = Math.max(
      new Date(activeSession.penaltyShieldEndsAt).getTime() - now,
      0,
    );
    const endDate = new Date(now + remainingMs);
    const label = endDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Locked until ${label}`;
  }

  if (activeSession) {
    const endMs = Math.max(new Date(activeSession.endsAt).getTime(), now);
    const endDate = new Date(endMs);
    const label = endDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Shield until ${label}`;
  }

  return "Shield active";
}

function buildOnSiteIntel(session: ActiveSessionSnapshot): HeroIntelCell | null {
  if (session.scheduleType !== "duration" || session.requiredOnSiteMs == null) return null;
  const accumulatedMin = Math.floor(session.onSiteAccumulatedMs / 60_000);
  const requiredMin = Math.ceil(session.requiredOnSiteMs / 60_000);
  return {
    label: "On site",
    value: `${accumulatedMin} / ${requiredMin} min`,
  };
}

function buildPresenceIntel(
  presence: PresenceContext | null,
  anchor: Anchor | null,
  metersAway: number | null,
): HeroIntelCell | null {
  if (presence?.isInsideGeofence && anchor) {
    return {
      label: "Presence",
      value: `Inside · ${anchor.radiusMeters}m`,
    };
  }
  if (metersAway != null) {
    return {
      label: "Distance",
      value: `${Math.round(metersAway)}m · ${formatTravelDurationBadge(metersAway)} walk`,
    };
  }
  if (presence?.locationUnavailable) {
    return { label: "GPS", value: "Enable location" };
  }
  return null;
}

function buildAnchoringIntel(anchor: Anchor | null): HeroIntelCell | null {
  if (!anchor) return { label: "Venue", value: "Not set" };
  if (!hasUsableCoordinates(anchor)) {
    return { label: "Venue", value: "Set on arrival" };
  }
  if (anchor.calibrated) {
    return { label: "Venue", value: `Calibrated · ${anchor.radiusMeters}m` };
  }
  return { label: "Venue", value: "Pinned" };
}

function metaRightForState(hero: HeroCardData, _presence: PresenceContext | null): string {
  return resolveHeroStatusLabel(resolveHeroDisplayPhase(hero));
}

function buildCenterMetric(hero: HeroCardData): HeroCenterMetric {
  if (hero.state === "active" && hero.countdownLabel) {
    return {
      headline: hero.countdownLabel,
      subline: undefined,
      countdownLabel: hero.countdownLabel,
      progressRatio: hero.progressRatio,
    };
  }

  if (hero.countdownLabel && hero.state === "on_the_way") {
    return {
      headline: hero.countdownLabel,
      subline: hero.subtitle || "Stay inside to verify",
      countdownLabel: hero.countdownLabel,
      progressRatio: hero.progressRatio,
    };
  }

  if (hero.state === "on_the_way" && hero.travelStats) {
    const venue = hero.upNext?.locationLabel ?? hero.locationLabel;
    const sublineParts = [`${hero.travelStats.duration} on foot`];
    if (venue) sublineParts.push(venue);
    return {
      headline: hero.travelStats.distance,
      subline: sublineParts.join(" · "),
    };
  }

  if (hero.upNext) {
    if (hero.travelStats) {
      const leaveBy = hero.upNext.leaveByLabel;
      return {
        headline: leaveBy ?? "Head out now",
        subline: hero.upNext.startsInLabel,
      };
    }
    return {
      headline: formatStartClock24(hero.upNext.timeLabel),
      subline: hero.upNext.locationLabel,
    };
  }

  return {
    headline: hero.title,
    subline: hero.subtitle ? hero.subtitle.replace(/\n/g, " · ") : undefined,
  };
}

function isVerifyingHero(hero: HeroCardData): boolean {
  return hero.state === "on_the_way" && Boolean(hero.countdownLabel);
}

function shieldIntelCell(cells: HeroIntelCell[]): HeroIntelCell | undefined {
  return cells.find((cell) => cell.label === "Shield");
}

/** Pick at most two cells — avoid repeating what the focal block already says. */
function pruneIntelCells(
  cells: HeroIntelCell[],
  hero: HeroCardData,
): HeroIntelCell[] {
  if (hero.state === "active" || isVerifyingHero(hero)) {
    return [];
  }

  const coinCell = cells.find(isCoinIntelCell);
  const shieldCell = shieldIntelCell(cells);

  const appendSecondary = (row: HeroIntelCell[]): HeroIntelCell[] => {
    const secondary = coinCell ?? shieldCell;
    if (secondary && row.length < 2 && !row.some((cell) => cell.label === secondary.label)) {
      row.push(secondary);
    }
    return row.slice(0, 2);
  };

  if (hero.upNext) {
    if (hero.travelStats) {
      const row: HeroIntelCell[] = [];
      if (hero.state === "on_the_way" && hero.upNext.leaveByLabel) {
        row.push({ label: "Leave by", value: hero.upNext.leaveByLabel });
      }
      return appendSecondary(row);
    }

    const row: HeroIntelCell[] = [];
    if (hero.upNext.leaveByLabel) {
      row.push({ label: "Leave by", value: hero.upNext.leaveByLabel });
    } else if (hero.upNext.endTimeLabel) {
      row.push({ label: "Ends", value: hero.upNext.endTimeLabel });
    }
    return appendSecondary(row);
  }

  if (hero.state === "on_the_way" && !hero.upNext) {
    return coinCell ? [coinCell] : [];
  }

  if (coinCell) {
    return [coinCell];
  }

  return cells.slice(0, 2);
}

function buildIntelCells(
  hero: HeroCardData,
  params: HeroIntelParams,
  focusNode: FocusNode | undefined,
  anchor: Anchor | null,
  metersAway: number | null,
): HeroIntelCell[] {
  const cells: HeroIntelCell[] = [];

  if (hero.upNext) {
    cells.push({ label: "Time", value: hero.upNext.timeLabel });
    cells.push({ label: "Where", value: hero.upNext.locationLabel });
    if (hero.upNext.leaveByLabel) {
      cells.push({ label: "Leave by", value: hero.upNext.leaveByLabel });
    }
    if (hero.travelStats && hero.state !== "on_the_way") {
      cells.push({
        label: "Walk",
        value: `${hero.travelStats.distance} · ${hero.travelStats.duration}`,
      });
    }
  } else if (hero.state === "active") {
    const onSite = params.activeSession ? buildOnSiteIntel(params.activeSession) : null;
    if (onSite) cells.push(onSite);
    if (params.blockedAppsCount != null && params.blockedAppsCount > 0) {
      cells.push({
        label: "Shield",
        value: `${params.blockedAppsCount} apps blocked`,
      });
    }
    const shieldLabel = buildShieldIntelLabel(
      params.nodes,
      params.activeSession,
      params.shieldSettings,
      params.referenceDate,
    );
    if (shieldLabel) {
      cells.push({ label: "Lock", value: shieldLabel.replace("Shield until ", "") });
    }
    if (hero.locationLabel) {
      cells.push({ label: "Zone", value: hero.locationLabel });
    }
  } else if (hero.state === "on_the_way") {
    if (hero.upNext) {
      const presenceCell = buildPresenceIntel(params.presence, anchor, metersAway);
      if (presenceCell) cells.push(presenceCell);
      if (focusNode) {
        const { startMinutes } = getScheduleWindow(focusNode.schedule);
        const leaveBy = buildLeaveByLabel(startMinutes, metersAway, params.referenceDate);
        if (leaveBy) cells.push({ label: "Leave by", value: leaveBy });
      }
    }
    if (params.activeSession?.penaltyShieldEndsAt && params.activeSession.penaltyMinutes) {
      const nowMs = params.referenceDate.getTime();
      const lockRemainingMs = Math.max(
        new Date(params.activeSession.penaltyShieldEndsAt).getTime() - nowMs,
        0,
      );
      if (lockRemainingMs > 0) {
        cells.push({
          label: "Lock",
          value: `+${params.activeSession.penaltyMinutes}m (${formatDurationClock(lockRemainingMs)})`,
        });
      }
    } else if (params.activeSession?.awaySince) {
      const nowMs = params.referenceDate.getTime();
      const earlyCompleteRemaining = getClassEarlyCompleteRemainingMs(
        params.activeSession,
        params.shieldSettings,
        nowMs,
      );
      if (earlyCompleteRemaining != null && earlyCompleteRemaining > 0) {
        cells.push({
          label: "Return",
          value: formatDurationClock(earlyCompleteRemaining),
        });
      } else {
        const grace = getAwayGraceRemainingMs(params.activeSession, nowMs);
        if (grace != null && grace > 0) {
          cells.push({
            label: "Grace",
            value: formatDurationClock(grace),
          });
        }
      }
    }
  } else {
    const anchoring = buildAnchoringIntel(anchor);
    if (anchoring) cells.push(anchoring);
  }

  return pruneIntelCells(cells, hero);
}

function buildFootnote(
  hero: HeroCardData,
  params: HeroIntelParams,
  rightRail?: HeroContextRail,
  center?: HeroCenterMetric,
): string | undefined {
  if (isVerifyingHero(hero)) {
    return undefined;
  }

  if (hero.state === "active" && params.activeSession) {
    if (
      params.activeSession.scheduleType === "duration" &&
      params.activeSession.requiredOnSiteMs
    ) {
      return formatOnSiteRemainingLabel(
        params.activeSession.onSiteAccumulatedMs,
        params.activeSession.requiredOnSiteMs,
      );
    }
    return undefined;
  }

  if (rightRail && hero.state !== "up_next") {
    return `Then · ${rightRail.headline} at ${rightRail.subline}`;
  }

  if (hero.subtitle && hero.subtitle !== center?.subline) {
    return hero.subtitle.replace(/\n/g, " · ");
  }

  return undefined;
}

/** Attach zoned dashboard context to hero card data. */
export function enrichHeroCardData(
  hero: HeroCardData,
  params: HeroIntelParams,
): HeroCardData {
  const focusNode = hero.nodeId
    ? params.nodes.find((node) => node.id === hero.nodeId)
    : undefined;
  const anchor = focusNode
    ? resolveAnchorForNode(focusNode.anchorId, params.anchors)
    : params.activeSession
      ? resolveAnchorForNode(
          params.nodes.find((n) => n.id === params.activeSession?.nodeId)?.anchorId ?? null,
          params.anchors,
        )
      : null;

  const metersAway =
    params.presence?.userPosition != null && anchor && hasUsableCoordinates(anchor)
      ? distanceOutsideGeofenceMeters(params.presence.userPosition, anchor)
      : null;

  const { rightRail } = buildContextRails(params.schedule, hero.nodeId);
  const sessionTitle =
    hero.upNext?.sessionTitle ?? focusNode?.title ?? hero.title;
  const center = buildCenterMetric(hero);

  const intelCells = buildIntelCells(hero, params, focusNode, anchor, metersAway);
  const showUpcoming =
    hero.state === "up_next" &&
    params.schedule.length > 1 &&
    intelCells.length === 0;

  const context: HeroCardContext = {
    metaLeft: { label: focusNode ? kindLabelForNode(focusNode) : kindLabelForItem(params.schedule[0]) },
    metaRight: { label: metaRightForState(hero, params.presence) },
    sessionTitle,
    dayArc: buildDayArc(params.schedule, hero.nodeId),
    leftRail: undefined,
    rightRail: undefined,
    center,
    intelCells,
    upcomingToday: showUpcoming
      ? buildUpcomingTodayStrip(params.schedule, hero.nodeId)
      : [],
    tagline: buildFootnote(hero, params, rightRail, center),
    travelMetersAway: metersAway,
  };

  const enrichedUpNext = hero.upNext
    ? {
        ...hero.upNext,
        kindLabel: focusNode ? kindLabelForNode(focusNode) : hero.upNext.kindLabel,
        endTimeLabel:
          focusNode ? buildEndTimeLabel(focusNode.schedule) : hero.upNext.endTimeLabel,
        leaveByLabel:
          hero.upNext.leaveByLabel ??
          (focusNode
            ? buildLeaveByLabel(
                getScheduleWindow(focusNode.schedule).startMinutes,
                metersAway,
                params.referenceDate,
              )
            : null),
      }
    : hero.upNext;

  return {
    ...hero,
    upNext: enrichedUpNext,
    context,
  };
}

/** Merge blocked-apps count into hero context as read-only copy. */
export function mergeBlockedAppsIntoHero(
  hero: HeroCardData,
  blockedAppsCount: number,
): HeroCardData {
  const blockedAppsLabel = formatBlockedAppsLabel(blockedAppsCount);
  if (!hero.context) {
    return { ...hero, blockedAppsCount };
  }

  const shieldCell: HeroIntelCell = {
    label: "Shield",
    value: blockedAppsLabel,
  };

  let intelCells = [...hero.context.intelCells];
  if (hero.state !== "active" && hero.state !== "weekly_report") {
    if (intelCells.length >= 2) {
      intelCells = [intelCells[0], shieldCell];
    } else {
      intelCells = [...intelCells, shieldCell].slice(0, 2);
    }
  }

  return {
    ...hero,
    blockedAppsCount,
    context: {
      ...hero.context,
      blockedAppsLabel,
      intelCells: hero.state === "active" ? hero.context.intelCells : intelCells,
    },
  };
}

/** Merge saved Focus Coins into hero intel — skipped during active sessions and weekly ledger. */
export function mergeFocusCoinsIntoHero(
  hero: HeroCardData,
  coins: number,
  dailyGoal: DailyGoal,
): HeroCardData {
  if (!hero.context) return hero;
  if (hero.state === "active" || hero.state === "weekly_report") return hero;

  const coinCell = buildCoinIntelCell(coins, dailyGoal);
  let intelCells = [...hero.context.intelCells];
  const coinIndex = intelCells.findIndex(isCoinIntelCell);

  if (coinIndex >= 0) {
    intelCells[coinIndex] = coinCell;
  } else if (intelCells.length >= 2) {
    intelCells = [intelCells[0]!, coinCell];
  } else if (intelCells.length === 1) {
    intelCells = [intelCells[0]!, coinCell];
  } else {
    intelCells = [coinCell];
  }

  const tagline = hero.context.tagline?.toLowerCase().includes("coin")
    ? undefined
    : hero.context.tagline;

  return {
    ...hero,
    context: {
      ...hero.context,
      intelCells,
      tagline,
    },
  };
}

/** Preview fixtures — rich context without live stores. */
export function buildPreviewHeroContext(
  state: HeroCardData["state"],
  variant?: HeroPreviewVariant | null,
  kind: HeroPreviewKind = "library",
): HeroCardContext {
  const fixture = getHeroPreviewKindFixture(kind);
  const kindLabel = HERO_PREVIEW_KIND_LABELS[kind];
  const scheduleKind = kind;
  const scheduleAccent: ScheduleItem["accent"] = kind === "class" ? "blue" : "green";

  const baseSchedule: ScheduleItem[] = [
    {
      id: "preview-1",
      title: "Statistics Lecture",
      timeLabel: "9:00 AM – 10:30 AM",
      locationLabel: "EMS Building",
      kind: "class",
      accent: "blue",
      status: "completed",
    },
    {
      id: "preview-node",
      title: fixture.sessionTitle,
      timeLabel: fixture.timeLabel,
      locationLabel: fixture.locationLabel,
      kind: scheduleKind,
      accent: scheduleAccent,
      status: state === "active" || state === "on_the_way" ? "active" : "upcoming",
    },
    {
      id: "preview-3",
      title: "Gym Workout",
      timeLabel: "5:00 PM – 6:00 PM",
      locationLabel: "Virgin Active",
      kind: "gym",
      accent: "green",
      status: "upcoming",
    },
  ];

  const focusId = state === "weekly_report" ? null : "preview-node";

  if (state === "weekly_report") {
    return {
      metaLeft: { label: "WEEKLY" },
      metaRight: { label: "COMPLETE" },
      sessionTitle: "Focus Ledger",
      dayArc: { positionLabel: "Week done", markers: [] },
      center: { headline: "Week complete", subline: "Every session finished" },
      intelCells: [],
      upcomingToday: [],
    };
  }

  if (state === "active") {
    return {
      metaLeft: { label: kindLabel },
      metaRight: { label: "FOCUS" },
      sessionTitle: fixture.sessionTitle,
      dayArc: buildDayArc(baseSchedule, focusId),
      center: {
        headline: "41:00",
        countdownLabel: "41:00",
        progressRatio: 0.35,
      },
      intelCells: [],
      upcomingToday: [],
      travelMetersAway: null,
    };
  }

  if (state === "on_the_way") {
    if (variant === "verifying") {
      return {
        metaLeft: { label: kindLabel },
        metaRight: { label: "ARRIVED" },
        sessionTitle: fixture.sessionTitle,
        dayArc: buildDayArc(baseSchedule, focusId),
        center: {
          headline: "04:59",
          subline: "Stay inside",
          countdownLabel: "04:59",
          progressRatio: 0.2,
        },
        intelCells: [],
        upcomingToday: [],
        travelMetersAway: 0,
      };
    }

    return {
      metaLeft: { label: kindLabel },
      metaRight: { label: "TRAVELING" },
      sessionTitle: fixture.sessionTitle,
      dayArc: buildDayArc(baseSchedule, focusId),
      center: {
        headline: "340 m",
        subline: "5 mins walk",
      },
      intelCells: [],
      upcomingToday: [],
      travelMetersAway: 180,
    };
  }

  return {
    metaLeft: { label: kindLabel },
    metaRight: { label: "READY" },
    sessionTitle: fixture.sessionTitle,
    dayArc: buildDayArc(baseSchedule, focusId),
    center: {
      headline: formatStartClock24(fixture.timeLabel),
      subline: fixture.locationLabel,
    },
    intelCells: [],
    upcomingToday: [],
    travelMetersAway: null,
  };
}

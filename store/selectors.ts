import type { DailyGoal, HeroCardData, ScheduleItem, WeekDaySchedule } from "@/types/dashboard";
import type { Anchor } from "@/types/anchor";
import type { FocusNode, FocusNodeKind, Weekday } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

import { computeFocusNodeInsights } from "@/lib/focusNodeStats";

import {
  buildTravelStats,
  formatCountdownMmSs,
  formatStartsInLabel,
  TIME_TO_LEAVE_MINUTES,
} from "@/lib/heroCard";
import { formatSessionDetailLabel } from "@/lib/sessionPenalty";
import { formatDurationClock } from "@/lib/shieldSchedule";
import {
  formatTimeLabel,
  getScheduleDurationLabel,
  getScheduleTimeLabel,
  getScheduleWindow,
  isScheduleWindowPassed,
  isWithinScheduleWindow,
  minutesToTodayDate,
  toIsoDateString,
} from "@/lib/time";
import type { Coordinates } from "@/lib/geo";
import {
  distanceOutsideGeofenceMeters,
  hasUsableCoordinates,
  PRESENCE_VERIFICATION_SECONDS,
  resolveAnchorForNode,
} from "@/lib/geo";
import type { SessionDetailData, SessionOccurrenceStatus } from "@/types/sessionDetail";

const SCHEDULE_ACCENTS: Record<FocusNodeKind, ScheduleItem["accent"]> = {
  class: "blue",
  gym: "green",
  library: "green",
  custom: "blue",
};

const SCHEDULE_KINDS: Record<FocusNodeKind, ScheduleItem["kind"]> = {
  class: "class",
  gym: "gym",
  library: "library",
  custom: "custom",
};

/** Maps legacy persisted kinds after template renames (study → library). */
function normalizeNodeKind(kind: FocusNode["kind"] | "study"): FocusNodeKind {
  if (kind === "study") return "library";
  return kind;
}

function resolveAnchorName(anchorId: string | null, anchors: Anchor[]): string {
  if (!anchorId) return "Location not set";
  return anchors.find((anchor) => anchor.id === anchorId)?.name ?? "Unknown location";
}

/** Room label (e.g. IT 4-1) plus linked Anchor place name when both exist. */
function resolveScheduleLocationLabel(
  locationLabel: string | null | undefined,
  anchorId: string | null,
  anchors: Anchor[],
): string {
  const room = locationLabel?.trim() || null;
  const place = anchorId ? resolveAnchorName(anchorId, anchors) : null;
  const hasPlace = place != null && place !== "Location not set" && place !== "Unknown location";

  if (room && hasPlace) return `${room} · ${place}`;
  if (room) return room;
  if (hasPlace) return place!;
  return "Location not set";
}

/** Zone text for the Hero Card — prefer room label, fall back to Anchor name. */
function resolveZoneLabel(
  locationLabel: string | null | undefined,
  anchorId: string | null,
  anchors: Anchor[],
): string {
  const room = locationLabel?.trim();
  if (room) return room;
  return resolveAnchorName(anchorId, anchors);
}

function resolveOccurrenceStatus(
  node: FocusNode,
  dateIso: string,
  activeNodeId: string | null,
  todayIso: string,
  referenceDate = new Date(),
): SessionOccurrenceStatus {
  const isToday = dateIso === todayIso;

  if (isToday && node.id === activeNodeId) return "active";
  if (node.completedDates.includes(dateIso)) return "completed";
  if (node.skippedDates?.includes(dateIso)) return "skipped";
  if (dateIso > todayIso) return "scheduled";
  if (dateIso < todayIso) return "missed";
  if (isScheduleWindowPassed(node.schedule, referenceDate)) {
    if (node.schedule.type !== "class") return "overdue";
    return "missed";
  }
  return "upcoming";
}

const STATUS_LABELS: Record<SessionOccurrenceStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
  skipped: "Skipped",
  scheduled: "Scheduled",
  missed: "Missed",
  overdue: "Overdue",
};

function resolveScheduleItemStatus(
  node: FocusNode,
  dateIso: string,
  activeNodeId: string | null,
  todayIso: string,
  referenceDate = new Date(),
): ScheduleItem["status"] {
  const occurrence = resolveOccurrenceStatus(
    node,
    dateIso,
    activeNodeId,
    todayIso,
    referenceDate,
  );
  if (occurrence === "active") return "active";
  if (occurrence === "completed") return "completed";
  if (occurrence === "skipped") return "skipped";
  if (occurrence === "missed") return "missed";
  if (occurrence === "overdue") return "overdue";
  return "upcoming";
}

function formatSessionDateLabel(dateIso: string): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Progress against today's schedule — target equals how many Focus Nodes are scheduled today. */
export function selectDailyGoal(
  nodes: FocusNode[],
  referenceDate = new Date(),
): DailyGoal {
  const target = countScheduledSessionsToday(nodes, referenceDate);
  const completed = countCompletedSessionsToday(nodes, referenceDate);

  return {
    completed,
    target,
  };
}

/** Sessions scheduled today — used as the daily goal target and coin/streak threshold. */
export function getDailyGoalTarget(nodes: FocusNode[], referenceDate = new Date()): number {
  return countScheduledSessionsToday(nodes, referenceDate);
}

/** Next incomplete Focus Node for today whose window has not ended yet. */
export function selectNextUpcomingNode(
  nodes: FocusNode[],
  referenceDate = new Date(),
): FocusNode | null {
  const todayWeekday = referenceDate.getDay();
  const todayIso = toIsoDateString(referenceDate);

  const upcoming = nodes
    .filter((node) => node.schedule.weekday === todayWeekday)
    .filter((node) => !node.completedDates.includes(todayIso))
    .filter((node) => !(node.skippedDates ?? []).includes(todayIso))
    // Time-aware: skip ended windows so the Hero never pins a past schedule.
    .filter((node) => !isScheduleWindowPassed(node.schedule, referenceDate))
    .sort(
      (a, b) =>
        getScheduleWindow(a.schedule).startMinutes -
        getScheduleWindow(b.schedule).startMinutes,
    );

  return upcoming[0] ?? null;
}

export type PresenceContext = {
  userPosition: Coordinates | null;
  isInsideGeofence: boolean;
  verificationSecondsRemaining: number | null;
  locationUnavailable: boolean;
  /** True when Always/background location was denied — sessions won't survive lock screen. */
  backgroundLocationDenied: boolean;
};

export type AnchoringRequest = {
  nodeId: string;
  nodeTitle: string;
  anchorId: string;
  anchorName: string;
};

/**
 * Deferred venues (saved at home without coords) need on-site GPS when the
 * schedule window opens — not a mandatory step for searched/pinned places.
 */
export function selectAnchoringRequest(
  nodes: FocusNode[],
  anchors: Anchor[],
  referenceDate = new Date(),
): AnchoringRequest | null {
  const nextNode = selectNextUpcomingNode(nodes, referenceDate);
  if (!nextNode || !isWithinScheduleWindow(nextNode.schedule, referenceDate)) return null;

  const anchor = resolveAnchorForNode(nextNode.anchorId, anchors);
  if (!anchor || hasUsableCoordinates(anchor)) return null;

  return {
    nodeId: nextNode.id,
    nodeTitle: nextNode.title,
    anchorId: anchor.id,
    anchorName: anchor.name,
  };
}

function minutesUntilScheduleStart(
  schedule: FocusNode["schedule"],
  referenceDate: Date,
): number {
  const { startMinutes } = getScheduleWindow(schedule);
  const startAt = minutesToTodayDate(startMinutes, referenceDate);
  return Math.ceil((startAt.getTime() - referenceDate.getTime()) / 60_000);
}

function buildUpNextHeroData(
  nextNode: FocusNode,
  anchors: Anchor[],
  referenceDate: Date,
  options?: {
    travelStats?: HeroCardData["travelStats"];
    startsInLabel?: string;
  },
): HeroCardData {
  const minutesUntilStart = minutesUntilScheduleStart(nextNode.schedule, referenceDate);

  return {
    state: "up_next",
    title: "Up next",
    subtitle: "",
    icon: "target",
    action: null,
    nodeId: nextNode.id,
    travelStats: options?.travelStats ?? null,
    upNext: {
      sessionTitle: nextNode.title,
      timeLabel: getScheduleTimeLabel(nextNode.schedule),
      locationLabel: resolveScheduleLocationLabel(
        nextNode.locationLabel,
        nextNode.anchorId,
        anchors,
      ),
      startsInLabel:
        options?.startsInLabel ??
        `Starts in ${formatStartsInLabel(Math.max(minutesUntilStart, 0))}`,
    },
  };
}

function activeSessionCountdown(session: ActiveSessionSnapshot, now: Date): {
  subtitle: string;
  countdownLabel: string;
  progressRatio: number | null;
} {
  const nowMs = now.getTime();

  if (session.scheduleType === "duration" && session.requiredOnSiteMs != null) {
    const remainingMs = Math.max(session.requiredOnSiteMs - session.onSiteAccumulatedMs, 0);
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
    return {
      subtitle:
        remainingMinutes === 1
          ? "1 minute remaining on site."
          : `${remainingMinutes} minutes remaining on site.`,
      countdownLabel: formatDurationClock(remainingMs),
      progressRatio:
        session.requiredOnSiteMs > 0
          ? Math.min(session.onSiteAccumulatedMs / session.requiredOnSiteMs, 1)
          : null,
    };
  }

  const remainingMs = Math.max(new Date(session.endsAt).getTime() - nowMs, 0);
  const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60_000));
  const windowMs = Math.max(
    new Date(session.endsAt).getTime() - new Date(session.shieldStartsAt).getTime(),
    1,
  );
  const elapsedMs = Math.min(Math.max(nowMs - new Date(session.shieldStartsAt).getTime(), 0), windowMs);

  return {
    subtitle:
      remainingMinutes <= 0
        ? "Almost done — stay inside to finish."
        : remainingMinutes === 1
          ? "1 minute remaining."
          : `${remainingMinutes} minutes remaining.`,
    countdownLabel: formatDurationClock(remainingMs),
    progressRatio: elapsedMs / windowMs,
  };
}

/** True when every scheduled Focus Node this week (Mon–Sun, through today) is done. */
function isWeeklyScheduleComplete(nodes: FocusNode[], referenceDate: Date): boolean {
  const monday = getMondayOfWeek(referenceDate);
  const todayIso = toIsoDateString(referenceDate);
  let scheduled = 0;
  let finished = 0;

  for (let index = 0; index < 7; index++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateIso = toIsoDateString(date);
    if (dateIso > todayIso) continue;

    const weekday = date.getDay() as Weekday;
    const dayNodes = nodes.filter((node) => node.schedule.weekday === weekday);
    for (const node of dayNodes) {
      scheduled += 1;
      if (
        node.completedDates.includes(dateIso) ||
        (node.skippedDates ?? []).includes(dateIso)
      ) {
        finished += 1;
      }
    }
  }

  return scheduled > 0 && finished >= scheduled;
}

export function selectHeroCardData(
  nodes: FocusNode[],
  anchors: Anchor[],
  activeSession: ActiveSessionSnapshot | null,
  presence: PresenceContext | null = null,
  referenceDate = new Date(),
): HeroCardData {
  const todayWeekday = referenceDate.getDay();
  const todayIso = toIsoDateString(referenceDate);
  const todayNodes = nodes.filter((node) => node.schedule.weekday === todayWeekday);
  const hasTodaySchedule = todayNodes.length > 0;
  const dailyGoal = selectDailyGoal(nodes, referenceDate);

  // Day complete only when every occurrence was completed or explicitly skipped (not merely missed).
  const allDoneToday =
    hasTodaySchedule &&
    todayNodes.every(
      (node) =>
        node.completedDates.includes(todayIso) ||
        (node.skippedDates ?? []).includes(todayIso),
    );

  if (activeSession) {
    const anchor = resolveAnchorForNode(
      nodes.find((node) => node.id === activeSession.nodeId)?.anchorId ?? null,
      anchors,
    );
    const coords = anchor && hasUsableCoordinates(anchor)
      ? { latitude: anchor.latitude, longitude: anchor.longitude }
      : { latitude: null, longitude: null };

    if (activeSession.awaySince || activeSession.penaltyShieldEndsAt) {
      return {
          state: "on_the_way",
          title: "Stepped out.",
          subtitle: `Return to ${activeSession.zoneLabel} to continue.`,
          icon: "traveller",
          action: null,
          nodeId: activeSession.nodeId,
          ...coords,
        };
    }

    if (!activeSession.presenceVerified) {
      if (presence?.isInsideGeofence) {
        const secondsLeft = presence.verificationSecondsRemaining;
        if (secondsLeft != null && secondsLeft > 0) {
          const ratio =
            1 - secondsLeft / Math.max(PRESENCE_VERIFICATION_SECONDS, 1);
          const isEarlyBeat = secondsLeft > PRESENCE_VERIFICATION_SECONDS / 2;
          return {
              state: "on_the_way",
              title: isEarlyBeat ? "You're here." : "Locking in...",
              subtitle: isEarlyBeat
                ? "Stay inside while we verify your location."
                : "Stay inside the area to begin your session.",
              icon: isEarlyBeat ? "arrived" : null,
              action: null,
              nodeId: activeSession.nodeId,
              countdownLabel: formatCountdownMmSs(secondsLeft),
              progressRatio: Math.min(Math.max(ratio, 0), 1),
              ...coords,
            };
        }

        return {
            state: "on_the_way",
            title: "You're here.",
            subtitle: "Stay inside while we verify your location.",
            icon: "arrived",
            action: null,
            nodeId: activeSession.nodeId,
            ...coords,
          };
      }

      const metersAway =
        presence?.userPosition != null && anchor && hasUsableCoordinates(anchor)
          ? distanceOutsideGeofenceMeters(presence.userPosition, anchor)
          : null;

      const travellingNode = nodes.find((node) => node.id === activeSession.nodeId);
      if (travellingNode) {
        const travelLine =
          metersAway != null
            ? "On your way to the venue."
            : presence?.locationUnavailable
              ? "Enable location so we can guide you there."
              : formatSessionDetailLabel(activeSession, referenceDate);

        return buildUpNextHeroData(travellingNode, anchors, referenceDate, {
          travelStats: metersAway != null ? buildTravelStats(metersAway) : null,
          startsInLabel: travelLine,
        });
      }

      return {
          state: "on_the_way",
          title: "On your way.",
          subtitle: presence?.locationUnavailable
            ? "Enable location so we can guide you there."
            : formatSessionDetailLabel(activeSession, referenceDate),
          icon: "traveller",
          action: null,
          travelStats: metersAway != null ? buildTravelStats(metersAway) : null,
          nodeId: activeSession.nodeId,
          ...coords,
        };
    }

    const timer = activeSessionCountdown(activeSession, referenceDate);
    return {
        state: "active",
        title: activeSession.nodeTitle,
        subtitle: timer.subtitle,
        icon: "flame",
        action: null,
        nodeId: activeSession.nodeId,
        locationLabel: activeSession.zoneLabel,
        countdownLabel: timer.countdownLabel,
        progressRatio: timer.progressRatio,
        ...coords,
      };
  }

  if (allDoneToday) {
    if (isWeeklyScheduleComplete(nodes, referenceDate)) {
      return {
        state: "weekly_report",
        title: "Focus Ledger",
        subtitle: "",
        icon: null,
        action: null,
        focusLedger: null,
      };
    }

    return {
      state: "on_the_way",
      title: "Day complete.",
      subtitle: "Every Focus Node completed.\nEnjoy the rest of your day.",
      icon: "sparkle",
      action: null,
    };
  }

  const nextNode = selectNextUpcomingNode(nodes, referenceDate);
  if (nextNode) {
    const zoneLabel = resolveZoneLabel(nextNode.locationLabel, nextNode.anchorId, anchors);
    const anchor = resolveAnchorForNode(nextNode.anchorId, anchors);
    const inWindow = isWithinScheduleWindow(nextNode.schedule, referenceDate);
    const coords =
      anchor && hasUsableCoordinates(anchor)
        ? { latitude: anchor.latitude, longitude: anchor.longitude }
        : { latitude: null, longitude: null };
    const minutesUntilStart = minutesUntilScheduleStart(nextNode.schedule, referenceDate);

    if (!inWindow) {
      const isMondayMorning =
        referenceDate.getDay() === 1 &&
        referenceDate.getHours() < 12 &&
        dailyGoal.completed === 0 &&
        minutesUntilStart > TIME_TO_LEAVE_MINUTES;

      if (isMondayMorning) {
        return {
            state: "on_the_way",
            title: "Fresh start.",
            subtitle: "A new week is open.\nLet's earn Focus Coins back together.",
            icon: "seedling",
            action: null,
            nodeId: nextNode.id,
          };
      }

      if (minutesUntilStart > 0 && minutesUntilStart <= TIME_TO_LEAVE_MINUTES) {
        return {
            state: "on_the_way",
            title: "Time to head out.",
            subtitle: `${nextNode.title} starts in ${formatStartsInLabel(minutesUntilStart)}.`,
            icon: "walk",
            action: null,
            nodeId: nextNode.id,
            ...coords,
          };
      }

      return buildUpNextHeroData(nextNode, anchors, referenceDate);
    }

    if (!anchor) {
      return {
          state: "on_the_way",
          title: "Add a place for this session",
          subtitle: "Edit the Focus Node and search for a venue.",
          icon: "traveller",
          action: null,
          nodeId: nextNode.id,
        };
    }

    if (!hasUsableCoordinates(anchor)) {
      return buildUpNextHeroData(nextNode, anchors, referenceDate, {
        startsInLabel: "Capture your location when you arrive at the venue.",
      });
    }

    if (presence?.isInsideGeofence) {
      const secondsLeft = presence.verificationSecondsRemaining;
      if (secondsLeft != null && secondsLeft > 0) {
        const ratio = 1 - secondsLeft / Math.max(PRESENCE_VERIFICATION_SECONDS, 1);
        const isEarlyBeat = secondsLeft > PRESENCE_VERIFICATION_SECONDS / 2;
        return {
            state: "on_the_way",
            title: isEarlyBeat ? "You're here." : "Locking in...",
            subtitle: isEarlyBeat
              ? "Stay inside while we verify your location."
              : "Stay inside the area to begin your session.",
            icon: isEarlyBeat ? "arrived" : null,
            action: null,
            nodeId: nextNode.id,
            countdownLabel: formatCountdownMmSs(secondsLeft),
            progressRatio: Math.min(Math.max(ratio, 0), 1),
            ...coords,
          };
      }

      return {
          state: "on_the_way",
          title: "You're here.",
          subtitle: "Stay inside while we verify your location.",
          icon: "arrived",
          action: null,
          nodeId: nextNode.id,
          ...coords,
        };
    }

    const metersAway =
      presence?.userPosition != null
        ? distanceOutsideGeofenceMeters(presence.userPosition, anchor)
        : null;

    let travelStats = null;
    let startsInLabel: string;
    if (presence?.locationUnavailable) {
      startsInLabel = "Enable location to verify your presence.";
    } else if (presence?.backgroundLocationDenied) {
      startsInLabel = "Allow Always location so focus continues when the phone is locked.";
    } else if (metersAway != null) {
      startsInLabel = "On your way to the venue.";
      travelStats = buildTravelStats(metersAway);
    } else {
      startsInLabel = "Waiting for GPS signal.";
    }

    return buildUpNextHeroData(nextNode, anchors, referenceDate, {
      travelStats,
      startsInLabel,
    });
  }

  if (hasTodaySchedule) {
    return {
      state: "on_the_way",
      title: "Ready for today?",
      subtitle: "Nothing left on today's schedule.\nEnjoy your break or create a new one.",
      icon: "sunrise",
      action: null,
    };
  }

  return {
    state: "on_the_way",
    title: "Ready for today?",
    subtitle: "No Focus Nodes are scheduled today.\nEnjoy your break or create a new one.",
    icon: "sunrise",
    action: null,
  };
}

export function selectTodaySchedule(
  nodes: FocusNode[],
  anchors: Anchor[],
  activeNodeId: string | null,
  referenceDate = new Date(),
): ScheduleItem[] {
  const todayWeekday = referenceDate.getDay();
  const todayIso = toIsoDateString(referenceDate);

  return nodes
    .filter((node) => node.schedule.weekday === todayWeekday)
    .map((node) => {
      const nodeKind = normalizeNodeKind(node.kind);

      return {
        node,
        item: {
          id: node.id,
          title: node.title,
          timeLabel: getScheduleTimeLabel(node.schedule),
          locationLabel: resolveScheduleLocationLabel(
            node.locationLabel,
            node.anchorId,
            anchors,
          ),
          kind: SCHEDULE_KINDS[nodeKind],
          accent: SCHEDULE_ACCENTS[nodeKind],
          status: resolveScheduleItemStatus(
            node,
            todayIso,
            activeNodeId,
            todayIso,
            referenceDate,
          ),
        } satisfies ScheduleItem,
      };
    })
    .sort(
      (a, b) =>
        getScheduleWindow(a.node.schedule).startMinutes -
        getScheduleWindow(b.node.schedule).startMinutes,
    )
    .map(({ item }) => item);
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function getMondayOfWeek(referenceDate: Date): Date {
  const monday = new Date(referenceDate);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatWeekDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function mapNodesToScheduleItems(
  nodes: FocusNode[],
  anchors: Anchor[],
  activeNodeId: string | null,
  dateIso: string,
  todayIso: string,
  referenceDate: Date,
): ScheduleItem[] {
  return nodes
    .map((node) => {
      const nodeKind = normalizeNodeKind(node.kind);

      return {
        node,
        item: {
          id: node.id,
          title: node.title,
          timeLabel: getScheduleTimeLabel(node.schedule),
          locationLabel: resolveScheduleLocationLabel(
            node.locationLabel,
            node.anchorId,
            anchors,
          ),
          kind: SCHEDULE_KINDS[nodeKind],
          accent: SCHEDULE_ACCENTS[nodeKind],
          status: resolveScheduleItemStatus(
            node,
            dateIso,
            activeNodeId,
            todayIso,
            referenceDate,
          ),
        } satisfies ScheduleItem,
      };
    })
    .sort(
      (a, b) =>
        getScheduleWindow(a.node.schedule).startMinutes -
        getScheduleWindow(b.node.schedule).startMinutes,
    )
    .map(({ item }) => item);
}

/** Recurring Focus Nodes grouped by day for the current calendar week (Mon–Sun). */
export function selectWeekSchedule(
  nodes: FocusNode[],
  anchors: Anchor[],
  activeNodeId: string | null,
  referenceDate = new Date(),
): WeekDaySchedule[] {
  const todayIso = toIsoDateString(referenceDate);
  const monday = getMondayOfWeek(referenceDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const weekday = date.getDay() as Weekday;
    const dateIso = toIsoDateString(date);
    const dayNodes = nodes.filter((node) => node.schedule.weekday === weekday);

    return {
      weekday,
      dayLabel: WEEKDAY_NAMES[weekday],
      dateLabel: formatWeekDateLabel(date),
      dateIso,
      isToday: dateIso === todayIso,
      items: mapNodesToScheduleItems(
        dayNodes,
        anchors,
        activeNodeId,
        dateIso,
        todayIso,
        referenceDate,
      ),
    };
  });
}

export function selectSessionDetail(
  nodes: FocusNode[],
  anchors: Anchor[],
  activeSession: ActiveSessionSnapshot | null,
  nodeId: string,
  dateIso?: string,
  referenceDate = new Date(),
): SessionDetailData | null {
  const node = nodes.find((focusNode) => focusNode.id === nodeId);
  if (!node) return null;

  const todayIso = toIsoDateString(referenceDate);
  const occurrenceDate = dateIso ?? todayIso;
  const nodeKind = normalizeNodeKind(node.kind);
  const status = resolveOccurrenceStatus(
    node,
    occurrenceDate,
    activeSession?.nodeId ?? null,
    todayIso,
    referenceDate,
  );

  return {
    nodeId: node.id,
    title: node.title,
    kind: SCHEDULE_KINDS[nodeKind],
    timeLabel: getScheduleTimeLabel(node.schedule),
    locationLabel: resolveScheduleLocationLabel(
      node.locationLabel,
      node.anchorId,
      anchors,
    ),
    dateIso: occurrenceDate,
    dateLabel: formatSessionDateLabel(occurrenceDate),
    isToday: occurrenceDate === todayIso,
    status,
    statusLabel: STATUS_LABELS[status],
    scheduledDurationLabel: getScheduleDurationLabel(node.schedule),
    endsInLabel:
      status === "active" && activeSession
        ? formatSessionDetailLabel(activeSession, referenceDate)
        : undefined,
    coinsEarned: null,
    countedTowardGoal: status === "completed",
    insights: computeFocusNodeInsights(node, referenceDate),
  };
}

export function buildActiveSessionSnapshot(
  node: FocusNode,
  anchors: Anchor[],
  endsAt: string,
): ActiveSessionSnapshot {
  const zoneLabel = resolveZoneLabel(node.locationLabel, node.anchorId, anchors);

  return {
    nodeId: node.id,
    zoneLabel,
    headline: `${zoneLabel} is actively in session`,
    nodeTitle: node.title,
    scheduleType: node.schedule.type === "class" ? "class" : "duration",
    shieldStartsAt: endsAt,
    endsAt,
    onSiteAccumulatedMs: 0,
    onSiteLastTickAt: null,
    requiredOnSiteMs: node.schedule.type === "duration"
      ? Math.round(node.schedule.durationHours * 60 * 60 * 1000)
      : null,
    awaySince: null,
    penaltyShieldEndsAt: null,
    penaltyMinutes: null,
    presenceVerified: false,
  };
}

/** How many Focus Nodes are scheduled for the given calendar day. */
export function countScheduledSessionsToday(
  nodes: FocusNode[],
  referenceDate = new Date(),
): number {
  const todayWeekday = referenceDate.getDay();
  return nodes.filter((node) => node.schedule.weekday === todayWeekday).length;
}

/** Completions among today's scheduled Focus Nodes only. */
export function countCompletedSessionsToday(
  nodes: FocusNode[],
  referenceDate = new Date(),
): number {
  const todayWeekday = referenceDate.getDay();
  const todayIso = toIsoDateString(referenceDate);
  return nodes.filter(
    (node) =>
      node.schedule.weekday === todayWeekday &&
      node.completedDates.includes(todayIso),
  ).length;
}

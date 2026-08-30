/**
 * Builds the native widget schedule bundle from in-app stores.
 * JS syncs structure + enriched hero copy; Kotlin refreshes countdowns offline.
 */
import { buildHeroWidgetSnapshot } from "@/lib/heroWidget";
import {
  buildHeroWidgetAppearance,
  type HeroWidgetAppearancePayload,
} from "@/lib/heroWidgetAppearance";
import { estimateFocusMinutes } from "@/lib/periodStats";
import { getScheduleWindow, toIsoDateString } from "@/lib/time";
import type { HeroCardData } from "@/types/dashboard";
import type { FocusNode } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";
import type {
  WidgetActiveSessionPayload,
  WidgetFocusNodePayload,
  WidgetScheduleBundle,
} from "@/types/widgetSchedule";

function parseMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function buildFocusNodePayload(
  node: FocusNode,
  todayIso: string,
  todayWeekday: number,
): WidgetFocusNodePayload {
  const isToday = node.schedule.weekday === todayWeekday;
  const { startMinutes, endMinutes } = getScheduleWindow(node.schedule);
  return {
    id: node.id,
    title: node.title,
    kind: node.kind,
    scheduleType: node.schedule.type === "class" ? "class" : "duration",
    weekday: node.schedule.weekday,
    startMinutes,
    endMinutes,
    locationLabel: node.locationLabel,
    completedToday: isToday && node.completedDates.includes(todayIso),
    skippedToday: isToday && (node.skippedDates ?? []).includes(todayIso),
  };
}

function buildActiveSessionPayload(
  session: ActiveSessionSnapshot,
): WidgetActiveSessionPayload {
  return {
    nodeId: session.nodeId,
    nodeTitle: session.nodeTitle,
    zoneLabel: session.zoneLabel,
    scheduleType: session.scheduleType,
    shieldStartsAtMs: parseMs(session.shieldStartsAt) ?? Date.now(),
    endsAtMs: parseMs(session.endsAt) ?? Date.now(),
    presenceVerified: session.presenceVerified,
    requiredOnSiteMs: session.requiredOnSiteMs,
    onSiteAccumulatedMs: session.onSiteAccumulatedMs,
    awaySinceMs: parseMs(session.awaySince),
    penaltyShieldEndsAtMs: parseMs(session.penaltyShieldEndsAt),
    penaltyMinutes: session.penaltyMinutes,
  };
}

export function buildWidgetScheduleBundle(input: {
  focusNodes: FocusNode[];
  activeSession: ActiveSessionSnapshot | null;
  hero: HeroCardData;
  dailyGoalCompleted: number;
  dailyGoalTarget: number;
  blockedAppsCount: number;
  blockedPackageNames: string[];
  classPreBufferMinutes: number;
  sessionGapMergeMinutes: number;
  referenceDate?: Date;
  appearance: HeroWidgetAppearancePayload;
}): WidgetScheduleBundle {
  const referenceDate = input.referenceDate ?? new Date();
  const todayIso = toIsoDateString(referenceDate);
  const todayWeekday = referenceDate.getDay();

  const display = buildHeroWidgetSnapshot(
    input.hero,
    { completed: input.dailyGoalCompleted, target: input.dailyGoalTarget },
    input.activeSession,
    referenceDate,
  );

  const context = input.hero.context;

  return {
    syncedAtMs: referenceDate.getTime(),
    timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    classPreBufferMinutes: input.classPreBufferMinutes,
    sessionGapMergeMinutes: input.sessionGapMergeMinutes,
    dailyGoalCompleted: input.dailyGoalCompleted,
    dailyGoalTarget: input.dailyGoalTarget,
    blockedAppsCount: input.blockedAppsCount,
    blockedPackageNames: input.blockedPackageNames,
    totalFocusMinutes: estimateFocusMinutes(input.focusNodes),
    todayIso,
    todayWeekday,
    nodes: input.focusNodes.map((node) =>
      buildFocusNodePayload(node, todayIso, todayWeekday),
    ),
    activeSession: input.activeSession
      ? buildActiveSessionPayload(input.activeSession)
      : null,
    display,
    intelCells: context?.intelCells ?? [],
    upcomingToday: (context?.upcomingToday ?? []).map((row) => ({
      timeLabel: row.timeLabel,
      title: row.title,
      locationLabel: row.locationLabel,
    })),
    appearance: input.appearance,
  };
}

/** Stable compare key — omits syncedAtMs and display.updatedAtMs. */
export function serializeWidgetScheduleBundleForCompare(
  bundle: WidgetScheduleBundle,
): string {
  const { syncedAtMs: _syncedAtMs, display, ...rest } = bundle;
  const { updatedAtMs: _updatedAtMs, ...displayRest } = display;
  return JSON.stringify({ ...rest, display: displayRest });
}

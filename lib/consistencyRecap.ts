/**
 * Real-world consistency recaps for Stats.
 * Scores showing up (sessions, planned days, places) rather than app-usage reduction.
 */
import { getKindLabel } from "@/lib/focusNodeKindColors";
import {
  nodeSessionMinutes,
  periodRange,
} from "@/lib/periodStats";
import { addDaysToIsoDate, getScheduleWindow, toIsoDateString } from "@/lib/time";
import type { Anchor } from "@/types/anchor";
import type { FocusNode, FocusNodeKind, Weekday } from "@/types/focusNode";
import type { ConsistencyRecap, StatsPeriod } from "@/types/stats";

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function nodesScheduledOnDate(nodes: FocusNode[], dateIso: string): FocusNode[] {
  const weekday = parseIsoDate(dateIso).getDay() as Weekday;
  return nodes.filter((node) => node.schedule.weekday === weekday);
}

function isCompletedOnDate(node: FocusNode, dateIso: string): boolean {
  return node.completedDates.includes(dateIso);
}

/** Place-like kind labels — Library not Study — for the visited-places trail. */
function placeLabelForNode(node: FocusNode): string {
  if (node.kind === "custom") {
    const titled = node.title.trim();
    return titled.length > 0 ? titled : getKindLabel(node.kind);
  }
  const kindLabels: Record<Exclude<FocusNodeKind, "custom">, string> = {
    class: "Class",
    gym: "Gym",
    library: "Library",
  };
  return kindLabels[node.kind];
}

/** Stable venue key so two nodes in the same building count as one location. */
function locationKey(node: FocusNode, anchors: Anchor[]): string {
  const anchor = anchors.find((entry) => entry.id === node.anchorId);
  if (anchor?.placeId) return `place:${anchor.placeId}`;
  if (node.anchorId) return `anchor:${node.anchorId}`;
  return `kind:${node.kind}`;
}

function eachIsoDate(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  let cursor = startIso;
  while (cursor <= endIso) {
    dates.push(cursor);
    cursor = addDaysToIsoDate(cursor, 1);
  }
  return dates;
}

function recapTitle(period: StatsPeriod | "today"): string {
  switch (period) {
    case "today":
      return "Today";
    case "week":
      return "This week";
    case "month":
      return "This month";
    case "year":
      return "This year";
  }
}

function emptyMessage(period: StatsPeriod | "today", planned: number): string {
  if (period === "today") {
    return planned > 0
      ? "Nothing completed yet — today's sessions still count."
      : "No sessions planned today.";
  }
  if (planned > 0) {
    return "No completed sessions in this stretch yet.";
  }
  return period === "week"
    ? "Add a Focus Node to start this week."
    : "Add a Focus Node to start tracking consistency.";
}

function uniquePlacesInOrder(nodes: FocusNode[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  const ordered = [...nodes].sort(
    (a, b) =>
      getScheduleWindow(a.schedule).startMinutes -
      getScheduleWindow(b.schedule).startMinutes,
  );
  for (const node of ordered) {
    const label = placeLabelForNode(node);
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels;
}

function buildRecap(input: {
  period: StatsPeriod | "today";
  dates: string[];
  nodes: FocusNode[];
  anchors: Anchor[];
}): ConsistencyRecap {
  let sessionsCompleted = 0;
  let sessionsPlanned = 0;
  let focusMinutes = 0;
  let plannedMinutes = 0;
  let plannedDays = 0;
  let showedUpDays = 0;
  const locationKeys = new Set<string>();
  const completedForPlaces: FocusNode[] = [];

  for (const dateIso of input.dates) {
    const scheduled = nodesScheduledOnDate(input.nodes, dateIso);
    if (scheduled.length === 0) continue;

    plannedDays += 1;
    let completedToday = 0;

    for (const node of scheduled) {
      const minutes = nodeSessionMinutes(node);
      sessionsPlanned += 1;
      plannedMinutes += minutes;

      if (!isCompletedOnDate(node, dateIso)) continue;

      sessionsCompleted += 1;
      completedToday += 1;
      // Completions store dates only — focused time is the planned window for now.
      focusMinutes += minutes;
      locationKeys.add(locationKey(node, input.anchors));
      completedForPlaces.push(node);
    }

    if (completedToday >= scheduled.length) {
      showedUpDays += 1;
    }
  }

  const sessionCompletionPercent =
    sessionsPlanned > 0
      ? Math.round((sessionsCompleted / sessionsPlanned) * 100)
      : 0;

  return {
    title: recapTitle(input.period),
    sessionsCompleted,
    sessionsPlanned,
    focusMinutes,
    plannedMinutes,
    sessionCompletionPercent,
    plannedDays,
    showedUpDays,
    locationCount: locationKeys.size,
    placesVisited: uniquePlacesInOrder(completedForPlaces),
    emptyMessage: emptyMessage(input.period, sessionsPlanned),
  };
}

/** End-of-day receipt: sessions, places, planned vs focused time. */
export function computeTodayRecap(
  nodes: FocusNode[],
  anchors: Anchor[],
  referenceDate = new Date(),
): ConsistencyRecap {
  const todayIso = toIsoDateString(referenceDate);
  return buildRecap({
    period: "today",
    dates: [todayIso],
    nodes,
    anchors,
  });
}

/** Longer-term show-up recap for week / month / year through today. */
export function computePeriodRecap(
  nodes: FocusNode[],
  anchors: Anchor[],
  period: StatsPeriod,
  referenceDate = new Date(),
): ConsistencyRecap {
  const { startIso, endIso } = periodRange(period, referenceDate);
  return buildRecap({
    period,
    dates: eachIsoDate(startIso, endIso),
    nodes,
    anchors,
  });
}

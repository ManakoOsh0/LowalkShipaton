import { computeFocusNodeInsights } from "@/lib/focusNodeStats";
import { getScheduleWindow, toIsoDateString } from "@/lib/time";
import type { FocusNode } from "@/types/focusNode";

export type AggregateStats = {
  totalCompletions: number;
  completionsThisWeek: number;
  completionsThisMonth: number;
  overallSuccessRate: number;
  focusHoursLabel: string;
  coinsEarnedAllTime: number;
  activeNodes: number;
  nodeSummaries: Array<{
    nodeId: string;
    title: string;
    successRate: number;
    currentStreak: number;
    totalCompletions: number;
  }>;
  insightMessage: string;
};

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMondayOfWeek(referenceDate: Date): Date {
  const monday = new Date(referenceDate);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatFocusHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/** Rolls up per-node completion history into app-wide performance stats. */
export function computeAggregateStats(
  nodes: FocusNode[],
  totalFocusCoins: number,
  referenceDate = new Date(),
): AggregateStats {
  const todayIso = toIsoDateString(referenceDate);
  const monday = getMondayOfWeek(referenceDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const refMonth = referenceDate.getMonth();
  const refYear = referenceDate.getFullYear();

  let totalCompletions = 0;
  let completionsThisWeek = 0;
  let completionsThisMonth = 0;
  let totalFocusMinutes = 0;
  let completedOccurrences = 0;
  let decidedOccurrences = 0;

  const nodeSummaries = nodes.map((node) => {
    const insights = computeFocusNodeInsights(node, referenceDate);
    totalCompletions += insights.totalCompletions;

    const sessionMinutes =
      getScheduleWindow(node.schedule).endMinutes -
      getScheduleWindow(node.schedule).startMinutes;
    totalFocusMinutes += sessionMinutes * insights.totalCompletions;

    for (const entry of insights.recentHistory) {
      if (entry.dateIso > todayIso) continue;
      if (entry.outcome === "completed") {
        completedOccurrences++;
        decidedOccurrences++;
      } else if (entry.outcome === "skipped" || entry.outcome === "missed") {
        decidedOccurrences++;
      }
    }

    for (const dateIso of node.completedDates) {
      const date = parseIsoDate(dateIso);
      if (date >= monday && date <= sunday) {
        completionsThisWeek++;
      }
      if (date.getMonth() === refMonth && date.getFullYear() === refYear) {
        completionsThisMonth++;
      }
    }

    return {
      nodeId: node.id,
      title: node.title,
      successRate: insights.successRate,
      currentStreak: insights.currentStreak,
      totalCompletions: insights.totalCompletions,
    };
  });

  const overallSuccessRate =
    decidedOccurrences > 0
      ? Math.round((completedOccurrences / decidedOccurrences) * 100)
      : 0;

  let insightMessage = "Add a Focus Node to start tracking your consistency.";
  if (totalCompletions >= 10 && overallSuccessRate >= 75) {
    insightMessage = "Strong overall rhythm — you're protecting your focus time well.";
  } else if (completionsThisWeek >= 3) {
    insightMessage = "Solid week so far. Keep stacking small wins.";
  } else if (totalCompletions > 0) {
    insightMessage = "Every completed session sharpens the habit loop.";
  }

  return {
    totalCompletions,
    completionsThisWeek,
    completionsThisMonth,
    overallSuccessRate,
    focusHoursLabel: formatFocusHours(totalFocusMinutes),
    coinsEarnedAllTime: totalFocusCoins,
    activeNodes: nodes.length,
    nodeSummaries: nodeSummaries.sort((a, b) => b.totalCompletions - a.totalCompletions),
    insightMessage,
  };
}

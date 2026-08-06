import type { FocusNodeKind } from "@/types/focusNode";
import type {
  ShareOverlayContributionWeek,
  ShareOverlayMoment,
  ShareOverlayPayload,
} from "@/types/shareOverlay";
import {
  buildShareContributionWeeks,
  isConsistencyMapEligible,
} from "@/lib/shareOverlay";

type PreviewScenario = "early_class" | "gym" | "library" | "class";

function buildPreviewContributionWeeks(referenceDate: Date): ShareOverlayContributionWeek[] {
  const weeks: ShareOverlayContributionWeek[] = [];
  const monday = new Date(referenceDate);
  const day = monday.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + mondayOffset - 11 * 7);
  monday.setHours(0, 0, 0, 0);

  for (let week = 0; week < 12; week++) {
    const weekStart = new Date(monday);
    weekStart.setDate(weekStart.getDate() + week * 7);
    const weekStartIso = weekStart.toISOString().slice(0, 10);
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + dayIndex);
      const dateIso = date.toISOString().slice(0, 10);
      const seed = week * 7 + dayIndex;
      const level = seed % 5 === 0 ? 0 : ((seed % 4) + 1) as 0 | 1 | 2 | 3 | 4;
      return { dateIso, level };
    });
    weeks.push({ weekStartIso, days });
  }

  return weeks;
}

function baseWeek(referenceDate: Date) {
  const todayIso = referenceDate.toISOString().slice(0, 10);
  return ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((label, index) => {
    const date = new Date(referenceDate);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + mondayOffset + index);
    const dateIso = date.toISOString().slice(0, 10);
    const counts = [1, 2, 1, 0, 2, 1, 1];
    return {
      label,
      sessionCount: counts[index] ?? 0,
      dateIso,
      isToday: dateIso === todayIso,
    };
  });
}

const SCENARIOS: Record<
  PreviewScenario,
  {
    kind: FocusNodeKind;
    nodeTitle: string;
    kindLabel: string;
    scheduledTimeLabel: string;
    durationLabel: string;
    placeLine: string;
    moment: ShareOverlayMoment;
    momentHeadline: string;
    momentSubline: string;
    momentTertiary: string;
  }
> = {
  early_class: {
    kind: "class",
    nodeTitle: "Statistics Lecture",
    kindLabel: "CLASS",
    scheduledTimeLabel: "7:00 AM",
    durationLabel: "1H 30M",
    placeLine: "EMS Building",
    moment: "early_class",
    momentHeadline: "7AM CLASS",
    momentSubline: "I'M HERE",
    momentTertiary: "EMS Building",
  },
  gym: {
    kind: "gym",
    nodeTitle: "Morning Lift",
    kindLabel: "GYM",
    scheduledTimeLabel: "6:30 AM",
    durationLabel: "1H 15M",
    placeLine: "Virgin Active",
    moment: "gym",
    momentHeadline: "LOCKED IN",
    momentSubline: "1H 15M",
    momentTertiary: "VERIFIED AT GYM",
  },
  library: {
    kind: "library",
    nodeTitle: "Deep Work Block",
    kindLabel: "LIBRARY",
    scheduledTimeLabel: "2:00 PM",
    durationLabel: "2H 45M",
    placeLine: "Central Library",
    moment: "library",
    momentHeadline: "IN THE STACKS",
    momentSubline: "2H 45M",
    momentTertiary: "Deep Work Block",
  },
  class: {
    kind: "class",
    nodeTitle: "Organic Chemistry",
    kindLabel: "CLASS",
    scheduledTimeLabel: "10:00 AM",
    durationLabel: "1H 45M",
    placeLine: "Science Block",
    moment: "class",
    momentHeadline: "ORGANIC CHEMISTRY",
    momentSubline: "1H 45M",
    momentTertiary: "Science Block",
  },
};

export function buildShareOverlayPreviewPayload(
  scenario: PreviewScenario = "early_class",
  referenceDate = new Date(),
): ShareOverlayPayload {
  const config = SCENARIOS[scenario];
  const completedAt = referenceDate.getTime();
  const contributionWeeks = buildPreviewContributionWeeks(referenceDate);

  return {
    context: "session_complete",
    completedAt,
    nodeId: "preview-node",
    nodeTitle: config.nodeTitle,
    kind: config.kind,
    kindLabel: config.kindLabel,
    scheduleType: config.kind === "class" ? "class" : "duration",
    durationMs: 90 * 60_000,
    durationLabel: config.durationLabel,
    onSitePercent: 92,
    presenceVerified: true,
    venueName: config.placeLine,
    locationLabel: null,
    placeLine: config.placeLine,
    streak: 12,
    sessionsCompletedToday: 1,
    dailyGoalTarget: 3,
    hitDailyGoal: false,
    weekDays: baseWeek(referenceDate),
    weekSessionTotal: 8,
    todaySessions: [{ nodeTitle: config.nodeTitle, kind: config.kind, durationLabel: config.durationLabel }],
    contributionWeeks,
    activeDaysLast30: 18,
    consistencyMapEligible: isConsistencyMapEligible(contributionWeeks),
    moment: config.moment,
    scheduledTimeLabel: config.scheduledTimeLabel,
    momentHeadline: config.momentHeadline,
    momentSubline: config.momentSubline,
    momentTertiary: config.momentTertiary,
  };
}

export function buildShareOverlayDailyGoalPreviewPayload(): ShareOverlayPayload {
  const payload = {
    ...buildShareOverlayPreviewPayload("early_class"),
    context: "daily_goal" as const,
    hitDailyGoal: true,
    sessionsCompletedToday: 3,
    dailyGoalTarget: 3,
  };
  return {
    ...payload,
    contributionWeeks: buildShareContributionWeeks(payload.contributionWeeks),
    consistencyMapEligible: isConsistencyMapEligible(payload.contributionWeeks),
  };
}

export function buildShareOverlayConsistencyPreviewPayload(): ShareOverlayPayload {
  return {
    ...buildShareOverlayPreviewPayload("early_class"),
    context: "weekly_recap",
    streak: 12,
    activeDaysLast30: 18,
    contributionWeeks: buildPreviewContributionWeeks(new Date()),
    consistencyMapEligible: true,
  };
}

export const SHARE_OVERLAY_PREVIEW_SCENARIOS: Array<{ id: PreviewScenario; label: string }> = [
  { id: "early_class", label: "7AM Class" },
  { id: "gym", label: "Gym" },
  { id: "library", label: "Library" },
  { id: "class", label: "Class" },
];

export type { PreviewScenario };

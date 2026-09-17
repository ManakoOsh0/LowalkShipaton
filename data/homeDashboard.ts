import type { DailyGoal, HeroCardData, ScheduleItem } from "@/types/dashboard";

/** @deprecated Use useHomeDashboard and Zustand stores instead. Kept for reference during migration. */
export const homeDashboardMock = {
  coins: 24,
  streak: 12,
  dailyGoal: {
    completed: 1,
    target: 1,
  } satisfies DailyGoal,
  hero: {
    state: "active",
    title: "Stay focused.",
    subtitle: "41 minutes remaining.",
    icon: "flame",
    action: null,
    nodeId: "node-stats-lecture",
    countdownLabel: "41:00",
    progressRatio: 0.35,
  } satisfies HeroCardData,
  schedule: [
    {
      id: "1",
      title: "Economics 101",
      timeLabel: "10:00 AM",
      locationLabel: "EMS Building Room 2-14",
      kind: "class",
      accent: "blue",
      status: "upcoming",
      startMinutes: 10 * 60,
      endMinutes: 11 * 60 + 30,
      dateIso: "2026-01-01",
      isToday: true,
    },
    {
      id: "2",
      title: "Library session",
      timeLabel: "2:00 PM",
      locationLabel: "Engineering Library",
      kind: "library",
      accent: "green",
      status: "upcoming",
      startMinutes: 14 * 60,
      endMinutes: 16 * 60,
      dateIso: "2026-01-01",
      isToday: true,
    },
  ] satisfies ScheduleItem[],
};

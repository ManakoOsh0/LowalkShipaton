import type { StatsScreenData } from "@/types/stats";

/** Placeholder stats — swap for store / SQLite selectors when backend is ready. */
export const statsMockData: StatsScreenData = {
  streak: 12,
  weeklyProgress: {
    completed: 5,
    target: 7,
    percent: 71,
  },
  lifetimeStats: [
    { id: "sessions", icon: "🎯", value: "148", label: "Sessions", numericValue: 148 },
    { id: "focused", icon: "⏱", value: "82 hrs", label: "Focused" },
    { id: "coins", icon: "🪙", value: "41", label: "Coins Earned", numericValue: 41 },
    { id: "nodes", icon: "📍", value: "8", label: "Focus Nodes", numericValue: 8 },
  ],
  achievements: [
    { id: "first", icon: "🏅", title: "First Session", unlocked: true },
    { id: "streak-7", icon: "🔥", title: "7 Day Streak", unlocked: true },
    { id: "study", icon: "📚", title: "Study Master", unlocked: true },
    { id: "gym", icon: "🏋", title: "Gym Warrior", unlocked: false },
    { id: "century", icon: "💯", title: "100 Sessions", unlocked: false },
  ],
  contributionWeeks: buildMockContributionWeeks(),
  personalBests: [
    { id: "streak", icon: "🏆", label: "Longest Streak", value: "21 Days" },
    { id: "favourite", icon: "📚", label: "Favourite Node", value: "Engineering Library" },
    { id: "session", icon: "⏱", label: "Longest Session", value: "4h 15m" },
    { id: "rate", icon: "🎯", label: "Completion Rate", value: "92%" },
  ],
  insights: [
    {
      id: "gym",
      message: "You complete Gym sessions 94% of the time.",
    },
    {
      id: "tuesday",
      message: "Tuesday is your most productive day.",
    },
    {
      id: "month",
      message: "You've focused for 82 hours this month.",
    },
  ],
};

function buildMockContributionWeeks() {
  const pattern = [
    [0, 1, 0, 2, 1, 0, 0],
    [1, 2, 1, 0, 2, 1, 0],
    [2, 1, 3, 2, 1, 0, 1],
    [1, 0, 2, 3, 2, 1, 2],
    [2, 2, 1, 3, 2, 3, 1],
    [1, 3, 2, 2, 3, 1, 0],
    [3, 2, 3, 2, 1, 2, 3],
    [2, 1, 2, 3, 3, 2, 1],
    [1, 2, 1, 2, 3, 2, 3],
    [2, 3, 2, 1, 2, 3, 2],
    [3, 2, 3, 3, 2, 1, 2],
    [2, 1, 3, 2, 3, 2, 1],
    [1, 2, 2, 3, 2, 3, 2],
    [3, 3, 2, 2, 3, 1, 2],
    [2, 2, 3, 3, 2, 2, 3],
    [1, 3, 2, 3, 3, 2, 1],
  ] as const;

  const weeks = [];
  const start = new Date();
  start.setDate(start.getDate() - (pattern.length - 1) * 7);
  const monday = getMonday(start);

  for (let w = 0; w < pattern.length; w++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() + w * 7);
    const days = pattern[w].map((level, d) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      return {
        dateIso: toIso(date),
        level: level as 0 | 1 | 2 | 3,
      };
    });
    weeks.push({ weekStartIso: toIso(weekStart), days });
  }

  return weeks;
}

function getMonday(date: Date): Date {
  const monday = new Date(date);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

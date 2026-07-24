import type { BlockedApp } from "@/types/blockedApp";
import type { Anchor } from "@/types/anchor";
import type { FocusNode, FocusNodeInput, Weekday } from "@/types/focusNode";
import { addDaysToIsoDate, toIsoDateString } from "@/lib/time";

import type { FocusNodeTemplateId } from "@/data/quickActions";

const SEED_ANCHOR_EMS = "anchor-ems-building";
const SEED_ANCHOR_LIBRARY = "anchor-engineering-library";
const SEED_ANCHOR_WTW = "anchor-wtw-building";
const SEED_ANCHOR_GYM = "anchor-campus-gym";

export const seedAnchors: Anchor[] = [
  {
    id: SEED_ANCHOR_EMS,
    name: "EMS Building",
    placeId: "seed-ems",
    formattedAddress: "Lynnwood Rd, Hatfield, Pretoria",
    sourceLatitude: -25.7479,
    sourceLongitude: 28.2293,
    latitude: -25.7479,
    longitude: 28.2293,
    radiusMeters: 30,
    calibrated: true,
  },
  {
    id: SEED_ANCHOR_LIBRARY,
    name: "Engineering Library",
    placeId: "seed-library",
    formattedAddress: "University of Pretoria, Hatfield",
    sourceLatitude: -25.7485,
    sourceLongitude: 28.231,
    latitude: -25.7485,
    longitude: 28.231,
    radiusMeters: 45,
    calibrated: true,
  },
  {
    id: SEED_ANCHOR_WTW,
    name: "WTW Building",
    placeId: "seed-wtw",
    formattedAddress: "Lynnwood Rd, Hatfield, Pretoria",
    sourceLatitude: -25.7491,
    sourceLongitude: 28.2302,
    latitude: -25.7491,
    longitude: 28.2302,
    radiusMeters: 25,
    calibrated: true,
  },
  {
    id: SEED_ANCHOR_GYM,
    name: "Campus Recreation Centre",
    placeId: "seed-gym",
    formattedAddress: "University of Pretoria, Hatfield",
    sourceLatitude: -25.7502,
    sourceLongitude: 28.2288,
    latitude: -25.7502,
    longitude: 28.2288,
    radiusMeters: 60,
    calibrated: true,
  },
];

export type TestUserSnapshot = {
  coins: number;
  streak: number;
  lastDailyGoalAwardDateIso: string | null;
  lastStreakDateIso: string | null;
};

export type TestDataBundle = {
  anchors: Anchor[];
  focusNodes: FocusNode[];
  user: TestUserSnapshot;
  blockedApps: BlockedApp[];
};

function getTodayWeekday(): Weekday {
  return new Date().getDay() as Weekday;
}

function getTodayIsoDate(): string {
  return toIsoDateString(new Date());
}

/** Recent ISO dates matching a weekday — powers stats heatmap in dev. */
function pastIsoDatesForWeekday(weekday: Weekday, count: number): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  for (let day = 1; day <= 90 && dates.length < count; day++) {
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getDay() === weekday) {
      dates.push(toIsoDateString(cursor));
    }
  }

  return dates;
}

/** Full dev dataset — week-long schedule, history, coins, streak, blocked apps. */
export function createTestData(): TestDataBundle {
  const todayWeekday = getTodayWeekday();
  const todayIso = getTodayIsoDate();
  const yesterdayIso = addDaysToIsoDate(todayIso, -1);

  const focusNodes: FocusNode[] = [
    {
      id: "node-morning-gym",
      title: "Morning Gym",
      icon: "gym",
      kind: "gym",
      schedule: { type: "duration", weekday: todayWeekday, startTime: "07:00", durationHours: 1 },
      locationLabel: null,
      anchorId: SEED_ANCHOR_GYM,
      completedDates: [todayIso, ...pastIsoDatesForWeekday(todayWeekday, 3)],
      skippedDates: [],
    },
    {
      id: "node-stats-lecture",
      title: "Statistics Lecture",
      icon: "class",
      kind: "class",
      schedule: { type: "class", weekday: todayWeekday, startTime: "09:00", endTime: "10:30" },
      locationLabel: "WTW 310",
      anchorId: SEED_ANCHOR_WTW,
      completedDates: pastIsoDatesForWeekday(todayWeekday, 4),
      skippedDates: [],
    },
    {
      id: "node-economics-101",
      title: "Economics 101",
      icon: "class",
      kind: "class",
      schedule: { type: "class", weekday: todayWeekday, startTime: "11:00", endTime: "12:00" },
      locationLabel: "Room 2-14",
      anchorId: SEED_ANCHOR_EMS,
      completedDates: [],
      skippedDates: [],
    },
    {
      id: "node-library-session",
      title: "Library Session",
      icon: "library",
      kind: "library",
      schedule: { type: "duration", weekday: todayWeekday, startTime: "14:00", durationHours: 2 },
      locationLabel: "Level 2",
      anchorId: SEED_ANCHOR_LIBRARY,
      completedDates: [],
      skippedDates: [],
    },
    {
      id: "node-monday-class",
      title: "Data Structures",
      icon: "class",
      kind: "class",
      schedule: { type: "class", weekday: 1, startTime: "10:00", endTime: "11:30" },
      locationLabel: "IT 4-1",
      anchorId: SEED_ANCHOR_EMS,
      completedDates: pastIsoDatesForWeekday(1, 5),
      skippedDates: [],
    },
    {
      id: "node-tuesday-gym",
      title: "Evening Gym",
      icon: "gym",
      kind: "gym",
      schedule: { type: "duration", weekday: 2, startTime: "17:30", durationHours: 1.5 },
      locationLabel: null,
      anchorId: SEED_ANCHOR_GYM,
      completedDates: pastIsoDatesForWeekday(2, 4),
      skippedDates: [addDaysToIsoDate(todayIso, -14)],
    },
    {
      id: "node-wednesday-study",
      title: "Study Block",
      icon: "library",
      kind: "library",
      schedule: { type: "duration", weekday: 3, startTime: "13:00", durationHours: 2 },
      locationLabel: null,
      anchorId: SEED_ANCHOR_LIBRARY,
      completedDates: pastIsoDatesForWeekday(3, 3),
      skippedDates: [],
    },
    {
      id: "node-thursday-work",
      title: "Work Shift",
      icon: "custom",
      kind: "custom",
      schedule: { type: "duration", weekday: 4, startTime: "09:00", durationHours: 4 },
      locationLabel: "Home Office",
      anchorId: null,
      completedDates: pastIsoDatesForWeekday(4, 2),
      skippedDates: [],
    },
    {
      id: "node-friday-review",
      title: "Weekly Review",
      icon: "library",
      kind: "library",
      schedule: { type: "duration", weekday: 5, startTime: "16:00", durationHours: 1 },
      locationLabel: null,
      anchorId: SEED_ANCHOR_LIBRARY,
      completedDates: pastIsoDatesForWeekday(5, 3),
      skippedDates: [],
    },
  ];

  const blockedApps: BlockedApp[] = [
    {
      id: "blocked-instagram",
      name: "Instagram",
      packageName: "com.instagram.android",
      createdAt: new Date().toISOString(),
    },
    {
      id: "blocked-tiktok",
      name: "TikTok",
      packageName: "com.zhiliaoapp.musically",
      createdAt: new Date().toISOString(),
    },
    {
      id: "blocked-youtube",
      name: "YouTube",
      packageName: "com.google.android.youtube",
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    anchors: seedAnchors.map((anchor) => ({ ...anchor })),
    focusNodes,
    user: {
      coins: 5,
      streak: 12,
      lastDailyGoalAwardDateIso: yesterdayIso,
      lastStreakDateIso: yesterdayIso,
    },
    blockedApps,
  };
}

/** @deprecated Use createTestData() — kept for any legacy callers. */
export function createSeedFocusNodes(): FocusNode[] {
  return createTestData().focusNodes.filter(
    (node) => node.schedule.weekday === getTodayWeekday(),
  );
}

export function createNodeFromTemplate(
  templateId: FocusNodeTemplateId,
  weekday: Weekday = getTodayWeekday(),
): FocusNodeInput {
  const defaults: Record<FocusNodeTemplateId, FocusNodeInput> = {
    class: {
      title: "",
      icon: "class",
      kind: "class",
      schedule: {
        type: "class",
        weekday,
        startTime: "09:00",
        endTime: "10:00",
      },
      locationLabel: null,
      anchorId: null,
    },
    gym: {
      title: "Gym Workout",
      icon: "gym",
      kind: "gym",
      schedule: {
        type: "duration",
        weekday,
        startTime: "17:00",
        durationHours: 1.5,
      },
      locationLabel: null,
      anchorId: null,
    },
    library: {
      title: "Library Session",
      icon: "library",
      kind: "library",
      schedule: {
        type: "duration",
        weekday,
        startTime: "14:00",
        durationHours: 2,
      },
      locationLabel: null,
      anchorId: null,
    },
    custom: {
      title: "Custom Focus",
      icon: "custom",
      kind: "custom",
      schedule: {
        type: "duration",
        weekday,
        startTime: "15:00",
        durationHours: 1,
      },
      locationLabel: null,
      anchorId: null,
    },
  };

  return defaults[templateId];
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getYesterdayIso, toIsoDateString } from "@/lib/time";

/** One Focus Coin earned when the user hits their full daily session target. */
export const COINS_PER_DAILY_GOAL = 1;

/** Cost to skip today's occurrence from the schedule action sheet. */
export const FOCUS_COIN_SKIP_COST = 1;

/** @deprecated Coins are earned per daily goal, not per session. */
export const COINS_PER_COMPLETED_SESSION = COINS_PER_DAILY_GOAL;

export type DailyGoalAwardResult = {
  hitDailyGoal: boolean;
  coinAwarded: boolean;
  streak: number;
  streakIncremented: boolean;
};

import type { PenaltyTierMinutes } from "@/lib/sessionPenalty";
import type { ClassPreBufferMinutes } from "@/lib/shieldSchedule";

type UserState = {
  coins: number;
  streak: number;
  /** Last calendar day (ISO) the user earned the daily-goal Focus Coin. */
  lastDailyGoalAwardDateIso: string | null;
  /** Last calendar day (ISO) the user hit their daily session target (drives streak). */
  lastStreakDateIso: string | null;
  /** Extra app-lock duration for class away / miss penalties. */
  penaltyTierMinutes: PenaltyTierMinutes;
  /** How long before class start app shielding begins. */
  classPreBufferMinutes: ClassPreBufferMinutes;
  /** Minimum gap between sessions before the shield lifts. */
  sessionGapMergeMinutes: number;
  /** Scheduled session reminders and daily-goal celebration alerts. */
  notificationsEnabled: boolean;
  /** True after every required OS permission has been granted at least once. */
  hasCompletedOnboarding: boolean;
  setCoins: (coins: number) => void;
  /** Deduct coins when spending — returns false if the balance is too low. */
  trySpendFocusCoins: (amount?: number) => boolean;
  setStreak: (streak: number) => void;
  setPenaltyTierMinutes: (minutes: PenaltyTierMinutes) => void;
  setClassPreBufferMinutes: (minutes: ClassPreBufferMinutes) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  completeOnboarding: () => void;
  /**
   * Award one Focus Coin when completedToday reaches today's scheduled count.
   * Streak counts consecutive calendar days the full schedule was completed.
   */
  checkDailyGoalReward: (
    completedToday: number,
    scheduledToday: number,
  ) => DailyGoalAwardResult;
};

/** Focus Coins, streak, and daily goal target — persisted locally per PRODUCT.md. */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      coins: 0,
      streak: 0,
      lastDailyGoalAwardDateIso: null,
      lastStreakDateIso: null,
      hasCompletedOnboarding: false,
      penaltyTierMinutes: 30,
      classPreBufferMinutes: 30,
      sessionGapMergeMinutes: 30,
      notificationsEnabled: true,
      setCoins: (coins) => set({ coins }),
      trySpendFocusCoins: (amount = FOCUS_COIN_SKIP_COST) => {
        const state = get();
        if (amount <= 0 || state.coins < amount) return false;
        set({ coins: state.coins - amount });
        return true;
      },
      setStreak: (streak) => set({ streak }),
      setPenaltyTierMinutes: (penaltyTierMinutes) => set({ penaltyTierMinutes }),
      setClassPreBufferMinutes: (classPreBufferMinutes) => set({ classPreBufferMinutes }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      checkDailyGoalReward: (completedToday, scheduledToday) => {
        const state = get();
        const todayIso = toIsoDateString(new Date());
        const target = Math.max(scheduledToday, 0);

        if (target === 0 || completedToday < target) {
          return {
            hitDailyGoal: false,
            coinAwarded: false,
            streak: state.streak,
            streakIncremented: false,
          };
        }

        const coinAwarded = state.lastDailyGoalAwardDateIso !== todayIso;
        const streakIncremented = state.lastStreakDateIso !== todayIso;
        const yesterdayIso = getYesterdayIso();

        const streak = streakIncremented
          ? state.lastStreakDateIso === yesterdayIso
            ? state.streak + 1
            : 1
          : state.streak;

        set({
          coins: coinAwarded ? state.coins + COINS_PER_DAILY_GOAL : state.coins,
          streak,
          lastDailyGoalAwardDateIso: coinAwarded ? todayIso : state.lastDailyGoalAwardDateIso,
          lastStreakDateIso: streakIncremented ? todayIso : state.lastStreakDateIso,
        });

        return {
          hitDailyGoal: true,
          coinAwarded,
          streak,
          streakIncremented,
        };
      },
    }),
    {
      name: "lowalk-user",
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      migrate: (persisted, version) => {
        let state = { ...(persisted ?? {}) } as Partial<UserState>;
        if (version < 2) {
          state = { ...state, hasCompletedOnboarding: true };
        }
        if (version < 3) {
          state = { ...state, penaltyTierMinutes: 30 };
        }
        if (version < 4) {
          state = {
            ...state,
            classPreBufferMinutes: 30,
            sessionGapMergeMinutes: 30,
          };
        }
        if (version < 5) {
          state = { ...state, notificationsEnabled: true };
        }
        if (version < 6) {
          // Re-run the permission sheet so existing installs are not stuck skipped.
          state = { ...state, hasCompletedOnboarding: false };
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.lastDailyGoalAwardDateIso = state.lastDailyGoalAwardDateIso ?? null;
        state.lastStreakDateIso =
          state.lastStreakDateIso ?? (state as { lastCompletionDateIso?: string | null }).lastCompletionDateIso ?? null;
        state.hasCompletedOnboarding = state.hasCompletedOnboarding ?? false;
        state.penaltyTierMinutes = state.penaltyTierMinutes ?? 30;
        state.classPreBufferMinutes = state.classPreBufferMinutes ?? 30;
        state.sessionGapMergeMinutes = state.sessionGapMergeMinutes ?? 30;
        state.notificationsEnabled = state.notificationsEnabled ?? true;
      },
    },
  ),
);

/**
 * Settings screen — app preferences and focus session configuration.
 */
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DailyGoalCard } from "@/components/DailyGoalCard";
import { HeroPreviewControls } from "@/components/HeroPreviewControls";
import { WakeAlarmCard } from "@/components/WakeAlarmCard";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getBackgroundPresenceDebugState } from "@/lib/backgroundPresenceDebug";
import { ALL_HERO_STATES, HERO_STATE_LABELS } from "@/lib/heroCard";
import { isPresenceDebugEnabled } from "@/lib/presenceDebug";
import { getTestDataSummary, loadTestData } from "@/lib/loadTestData";
import {
  getBackgroundPermissionStatus,
  isSessionLocationTaskRegistered,
} from "@/services/location";
import { useArrivalCelebrationStore } from "@/store/useArrivalCelebrationStore";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useStreakCelebrationStore } from "@/store/useStreakCelebrationStore";
import { PENALTY_TIER_OPTIONS } from "@/lib/sessionPenalty";
import { CLASS_PRE_BUFFER_OPTIONS } from "@/lib/shieldSchedule";
import { useUserStore } from "@/store/useUserStore";
import type { HeroCardState, ScheduleItemKind } from "@/types/dashboard";

function PenaltyTierCard() {
  const colors = useThemeColors();
  const penaltyTierMinutes = useUserStore((state) => state.penaltyTierMinutes);
  const setPenaltyTierMinutes = useUserStore((state) => state.setPenaltyTierMinutes);

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Focus Sessions
      </Text>

      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 15,
              lineHeight: 20,
              color: colors.foreground,
            }}
          >
            Away penalty
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            Leave your venue for more than 5 minutes during a class and apps stay locked
            for this long.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {PENALTY_TIER_OPTIONS.map((option) => {
            const selected = penaltyTierMinutes === option.minutes;
            return (
              <Pressable
                key={option.minutes}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPenaltyTierMinutes(option.minutes)}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: selected ? colors.skyDeep : colors.border,
                  backgroundColor: selected ? colors.surface : colors.background,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 13,
                    color: selected ? colors.skyDeep : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ClassPreBufferCard() {
  const colors = useThemeColors();
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const setClassPreBufferMinutes = useUserStore((state) => state.setClassPreBufferMinutes);

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            lineHeight: 20,
            color: colors.foreground,
          }}
        >
          Class pre-lock
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Block distracting apps this long before class starts so you leave on time.
          Gym and library lock at your chosen start time instead.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {CLASS_PRE_BUFFER_OPTIONS.map((option) => {
          const selected = classPreBufferMinutes === option.minutes;
          return (
            <Pressable
              key={option.minutes}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setClassPreBufferMinutes(option.minutes)}
              style={{
                flex: 1,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: selected ? colors.skyDeep : colors.border,
                backgroundColor: selected ? colors.surface : colors.background,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: selected ? colors.skyDeep : colors.foreground,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BackgroundPresenceDebugCard() {
  const colors = useThemeColors();
  const [backgroundPermission, setBackgroundPermission] =
    useState<string>("checking");
  const [taskRegistered, setTaskRegistered] = useState<string>("checking");
  const [lastFixLabel, setLastFixLabel] = useState<string>("—");

  useEffect(() => {
    const refresh = async () => {
      const permission = await getBackgroundPermissionStatus();
      setBackgroundPermission(permission);

      const registered = await isSessionLocationTaskRegistered();
      setTaskRegistered(registered ? "yes" : "no");

      const { lastBackgroundFixAt, lastBackgroundError } = getBackgroundPresenceDebugState();
      if (lastBackgroundError) {
        setLastFixLabel(`error: ${lastBackgroundError}`);
      } else if (lastBackgroundFixAt) {
        setLastFixLabel(new Date(lastBackgroundFixAt).toLocaleTimeString());
      } else {
        setLastFixLabel("—");
      }
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Dev — Background Presence (field test)
      </Text>

      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 8,
        }}
      >
        <Text style={{ fontFamily: "Poppins-Regular", fontSize: 13, color: colors.foreground }}>
          Background permission: {backgroundPermission}
        </Text>
        <Text style={{ fontFamily: "Poppins-Regular", fontSize: 13, color: colors.foreground }}>
          Location task registered: {taskRegistered}
        </Text>
        <Text style={{ fontFamily: "Poppins-Regular", fontSize: 13, color: colors.foreground }}>
          Last background fix: {lastFixLabel}
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontFamily: "Poppins-Regular",
            fontSize: 12,
            lineHeight: 17,
            color: colors.muted,
          }}
        >
          Checklist: grant Always → start session at anchor → background 2+ min inside → leave
          fence (away + shield stays on) → return before 5 min or incur penalty lock → let timer
          end inside venue (complete + coin).
        </Text>
      </View>
    </View>
  );
}

function TestDataDebugCard() {
  const colors = useThemeColors();
  const [loaded, setLoaded] = useState(false);
  const summary = getTestDataSummary();

  const handleLoad = () => {
    loadTestData();
    setLoaded(true);
    Alert.alert("Test data loaded", summary);
  };

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Dev — Test Data
      </Text>

      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Populate the app with a full week of Focus Nodes, anchors, completion history, coins,
          streak, and sample blocked apps. Replaces your current local schedule.
        </Text>

        <Text
          style={{
            fontFamily: "Poppins-Medium",
            fontSize: 13,
            lineHeight: 18,
            color: colors.foreground,
          }}
        >
          {summary}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Load test data"
          onPress={handleLoad}
          style={({ pressed }) => ({
            borderRadius: 12,
            backgroundColor: colors.skyDeep,
            paddingVertical: 12,
            alignItems: "center",
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 14,
              lineHeight: 20,
              color: "#FFFFFF",
            }}
          >
            {loaded ? "Reload test data" : "Load test data"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function HeroPreviewDebugCard() {
  const colors = useThemeColors();
  const forcedState = useHeroPreviewStore((state) => state.forcedState);
  const setForcedState = useHeroPreviewStore((state) => state.setForcedState);

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Dev — Hero Card States
      </Text>

      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 14,
          gap: 10,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Force a Hero Card state on Home to review copy, accents, and CTAs.
          {forcedState ? ` Active: ${HERO_STATE_LABELS[forcedState]}` : " Showing live state."}
        </Text>

        <HeroPreviewControls embedded />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ALL_HERO_STATES.map((state) => {
            const selected = forcedState === state;
            return (
              <Pressable
                key={state}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setForcedState(selected ? null : (state as HeroCardState))}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.skyDeep : colors.border,
                  backgroundColor: selected ? colors.surface : colors.background,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 12,
                    lineHeight: 16,
                    color: selected ? colors.skyDeep : colors.foreground,
                  }}
                >
                  {HERO_STATE_LABELS[state]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {forcedState ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setForcedState(null)}
            style={{ paddingVertical: 4 }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 13,
                color: colors.skyDeep,
              }}
            >
              Clear preview
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ArrivalPreviewDebugCard() {
  const colors = useThemeColors();
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const showArrival = useArrivalCelebrationStore((state) => state.show);

  const previewNode = focusNodes[0] ?? null;
  const previewAnchor = previewNode?.anchorId
    ? anchors.find((anchor) => anchor.id === previewNode.anchorId) ?? null
    : null;

  const handlePreview = () => {
    const kind = (previewNode?.kind ?? "library") as ScheduleItemKind;
    showArrival({
      nodeId: previewNode?.id ?? "dev-preview",
      nodeTitle: previewNode?.title ?? "Study Session",
      anchorName: previewAnchor?.name ?? "Campus Library",
      kind,
      preview: true,
    });
  };

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Dev — Arrival Card
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={handlePreview}
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            color: colors.skyDeep,
          }}
        >
          Preview arrival card
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          {previewNode
            ? `Uses "${previewNode.title}" at ${previewAnchor?.name ?? "fallback venue"}`
            : "Uses sample Study Session at Campus Library"}
        </Text>
      </Pressable>
    </View>
  );
}

function DailyGoalPreviewDebugCard() {
  const colors = useThemeColors();

  return (
    <View style={{ marginTop: 24, gap: 12 }}>
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Dev — Daily Target Mascot
      </Text>

      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        Inactive (sessions still in progress):
      </Text>
      <View style={{ marginHorizontal: -16 }}>
        <DailyGoalCard completed={1} target={3} />
      </View>

      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        Active (all sessions complete):
      </Text>
      <View style={{ marginHorizontal: -16 }}>
        <DailyGoalCard completed={3} target={3} />
      </View>
    </View>
  );
}

function StreakPreviewDebugCard() {
  const colors = useThemeColors();
  const streak = useUserStore((state) => state.streak);
  const showCelebration = useStreakCelebrationStore((state) => state.show);

  const handlePreview = () => {
    showCelebration({
      streak: Math.max(streak, 1),
      coinAwarded: true,
    });
  };

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Dev — Streak Celebration
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={handlePreview}
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            color: colors.skyDeep,
          }}
        >
          Preview streak screen
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Opens the daily-goal modal (current streak: {streak || "—"})
        </Text>
      </Pressable>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 24,
            lineHeight: 32,
            color: colors.foreground,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <PenaltyTierCard />
        <ClassPreBufferCard />
        <WakeAlarmCard />

        {__DEV__ ? (
          <>
            <TestDataDebugCard />
            <HeroPreviewDebugCard />
            <ArrivalPreviewDebugCard />
            <DailyGoalPreviewDebugCard />
            <StreakPreviewDebugCard />
          </>
        ) : null}

        {isPresenceDebugEnabled() ? <BackgroundPresenceDebugCard /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

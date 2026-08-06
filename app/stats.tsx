/**
 * Activity — single stats destination from the home streak pill.
 * Hierarchy: streak context → one focus metric → chart → active days → yearly lifetime.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { SessionsBarChart } from "@/components/stats/SessionsBarChart";
import { StatsActivityHero } from "@/components/stats/StatsActivityHero";
import { StatsDayList } from "@/components/stats/StatsDayList";
import { StatsLifetimeSection } from "@/components/stats/StatsLifetimeSection";
import { StatsPeriodSheet } from "@/components/stats/StatsPeriodSheet";
import { StatsShareSheet } from "@/components/stats/StatsShareSheet";
import { usePeriodStats } from "@/hooks/usePeriodStats";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_SM } from "@/lib/cardStyle";
import { SCREEN_PADDING } from "@/lib/layout";
import {
  openShareOverlayConsistencyRecap,
  openShareOverlayWeeklyRecap,
} from "@/lib/shareOverlayActions";
import type { StatsPeriod } from "@/types/stats";

function HeaderIconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: CARD_RADIUS_SM,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardStroke,
        borderCurve: "continuous",
      }}
    >
      <Ionicons name={icon} size={20} color={colors.foreground} />
    </PressableScale>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const {
    periodStats,
    streak,
    totalSessionsAllTime,
    focusDurationLabel,
    contributionWeeks,
  } = usePeriodStats(period);

  const dayList = useMemo(() => {
    // Week already filters empties; month keeps active weeks only (top few).
    if (period === "month") {
      return periodStats.dayBreakdown.slice(0, 4);
    }
    return periodStats.dayBreakdown;
  }, [period, periodStats.dayBreakdown]);

  const maxDayMinutes = Math.max(...dayList.map((day) => day.focusMinutes), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SCREEN_PADDING,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <HeaderIconButton
          label="Go back"
          icon="chevron-back"
          onPress={() => router.back()}
        />
        <HeaderIconButton
          label="Share stats"
          icon="share-outline"
          onPress={() => setShareSheetOpen(true)}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingBottom: insets.bottom + 40,
          gap: 32,
        }}
      >
        <StatsActivityHero
          stats={periodStats}
          streak={streak}
          onPressPeriod={() => setPeriodSheetOpen(true)}
        />

        <SessionsBarChart stats={periodStats} bare metric="focusMinutes" />

        {dayList.length > 0 ? (
          <StatsDayList days={dayList} maxFocusMinutes={maxDayMinutes} />
        ) : null}

        {period === "year" ? (
          <StatsLifetimeSection
            totalSessions={totalSessionsAllTime}
            focusHoursLabel={focusDurationLabel}
            contributionWeeks={contributionWeeks}
          />
        ) : null}
      </ScrollView>

      <StatsPeriodSheet
        visible={periodSheetOpen}
        value={period}
        onClose={() => setPeriodSheetOpen(false)}
        onChange={setPeriod}
      />

      <StatsShareSheet
        visible={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        onShareWeek={openShareOverlayWeeklyRecap}
        onShareConsistency={openShareOverlayConsistencyRecap}
      />
    </SafeAreaView>
  );
}

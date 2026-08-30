/**
 * Activity — single stats destination from the home streak pill.
 * Hierarchy: today receipt → period show-up recap → chart → active days → yearly lifetime.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { StatsScreenSkeleton } from "@/components/skeleton/StatsScreenSkeleton";
import { SessionsBarChart } from "@/components/stats/SessionsBarChart";
import { StatsActivityHero } from "@/components/stats/StatsActivityHero";
import { StatsDayList } from "@/components/stats/StatsDayList";
import { StatsLifetimeSection } from "@/components/stats/StatsLifetimeSection";
import { StatsPeriodSheet } from "@/components/stats/StatsPeriodSheet";
import { StatsTodayRecap } from "@/components/stats/StatsTodayRecap";
import { usePeriodStats } from "@/hooks/usePeriodStats";
import { useCoreStoresHydrated } from "@/hooks/usePersistedStoreHydration";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_SM } from "@/lib/cardStyle";
import { SCREEN_PADDING } from "@/lib/layout";
import { FONT_FAMILY } from "@/theme/fonts";
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
  const storesReady = useCoreStoresHydrated();
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
  const {
    todayRecap,
    periodRecap,
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
        <View style={{ width: 40 }} />
      </View>

      {!storesReady ? (
        <StatsScreenSkeleton />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SCREEN_PADDING,
              paddingBottom: insets.bottom + 40,
              gap: 32,
            }}
          >
            <StatsTodayRecap recap={todayRecap} />

            <StatsActivityHero
              recap={periodRecap}
              streak={streak}
              onPressPeriod={() => setPeriodSheetOpen(true)}
            />

            <View style={{ gap: 12 }}>
              <Text
                style={{
                  fontFamily: FONT_FAMILY.semibold,
                  fontSize: 11,
                  lineHeight: 14,
                  letterSpacing: 1.4,
                  color: colors.muted,
                  textTransform: "uppercase",
                }}
              >
                Focus time
              </Text>
              <SessionsBarChart stats={periodStats} bare metric="focusMinutes" />
            </View>

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
        </>
      )}
    </SafeAreaView>
  );
}

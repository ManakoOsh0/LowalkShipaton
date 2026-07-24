/**
 * Statistics screen — stack route reachable from Hero / deep links (not a tab).
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AchievementBadge } from "@/components/stats/AchievementBadge";
import { ContributionGrid } from "@/components/stats/ContributionGrid";
import { HeroStreakCard } from "@/components/stats/HeroStreakCard";
import { InsightCard } from "@/components/stats/InsightCard";
import { PeriodToggle } from "@/components/stats/PeriodToggle";
import { PersonalBestCard } from "@/components/stats/PersonalBestCard";
import { SessionsBarChart } from "@/components/stats/SessionsBarChart";
import { StatCard } from "@/components/stats/StatCard";
import { StatsSectionHeader } from "@/components/stats/StatsSectionHeader";
import { statsMockData } from "@/data/statsMock";
import { usePeriodStats } from "@/hooks/usePeriodStats";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { StatsPeriod } from "@/types/stats";

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const { periodStats, streak, lifetimeStats, contributionWeeks } = usePeriodStats(period);
  const mock = statsMockData;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 24,
              lineHeight: 32,
              color: colors.foreground,
            }}
          >
            Statistics
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            Track your consistency over time.
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View style={{ gap: 28 }}>
          <PeriodToggle value={period} onChange={setPeriod} />

          <HeroStreakCard
            streak={streak}
            weeklyProgress={mock.weeklyProgress}
            missedCount={6}
            skippedCount={0}
          />

          <SessionsBarChart stats={periodStats} />

          <View>
            <StatsSectionHeader title="Lifetime Statistics" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {lifetimeStats.map((stat) => (
                <StatCard
                  key={stat.id}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  numericValue={stat.numericValue}
                />
              ))}
            </View>
          </View>

          <View>
            <StatsSectionHeader
              title="Achievements"
              subtitle="Small wins that add up over time."
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4 }}
            >
              {mock.achievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </ScrollView>
          </View>

          <ContributionGrid weeks={contributionWeeks} />

          <View>
            <StatsSectionHeader title="Personal Bests" />
            <View style={{ gap: 10 }}>
              {mock.personalBests.map((best) => (
                <PersonalBestCard key={best.id} best={best} />
              ))}
            </View>
          </View>

          <View>
            <StatsSectionHeader
              title="Insights"
              subtitle="Friendly patterns from your focus journey."
            />
            <View style={{ gap: 10 }}>
              {mock.insights.map((insight) => (
                <InsightCard key={insight.id} message={insight.message} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

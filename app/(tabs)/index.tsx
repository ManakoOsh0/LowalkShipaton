import { useRouter } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DailyGoalCard } from "@/components/DailyGoalCard";
import { HeroCard } from "@/components/HeroCard";
import { HomeHeader } from "@/components/HomeHeader";
import { ScheduleItemActionSheet } from "@/components/ScheduleItemActionSheet";
import { HomeDashboardSkeleton } from "@/components/skeleton/HomeDashboardSkeleton";
import { TodayScheduleSection } from "@/components/TodayScheduleSection";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { useHeroBackgroundColor } from "@/hooks/useHeroTheme";
import { useCoreStoresHydrated } from "@/hooks/usePersistedStoreHydration";
import { useScheduleItemActions } from "@/hooks/useScheduleItemActions";
import { CARD_GAP, SCREEN_PADDING } from "@/lib/layout";
import { ROUTES } from "@/lib/routes";

/** Home dashboard — answers "What should I do next?" with goal, hero, and schedule. */
export default function HomeScreen() {
  const router = useRouter();
  const heroBackground = useHeroBackgroundColor();
  const storesReady = useCoreStoresHydrated();
  const { streak, dailyGoal, hero, schedule, celebration, dismissCelebration, isHeroPreview } =
    useHomeDashboard();
  const { showScheduleItemActions, actionSheetProps } = useScheduleItemActions();

  if (!storesReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: heroBackground }} edges={["top"]}>
        <HomeDashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: heroBackground }} edges={["top"]}>
      <HomeHeader
        streak={streak}
        onStreakPress={() => router.push(ROUTES.stats)}
      />

      <View style={{ flex: 1 }}>
        <DailyGoalCard {...dailyGoal} />
        <HeroCard
          {...hero}
          isPreview={isHeroPreview}
          celebration={celebration}
          onCelebrationDismiss={dismissCelebration}
        />

        <View
          style={{
            flex: 1,
            minHeight: 0,
            marginTop: CARD_GAP,
            paddingHorizontal: SCREEN_PADDING,
          }}
        >
          <TodayScheduleSection
            items={schedule}
            onItemPress={(item) => router.push(ROUTES.sessionDetail(item.id))}
            onItemLongPress={showScheduleItemActions}
            onItemMenuPress={showScheduleItemActions}
            onEmptyPress={() => router.push(ROUTES.focusNodeNewWithTemplate("custom"))}
          />
        </View>
      </View>

      <ScheduleItemActionSheet {...actionSheetProps} />
    </SafeAreaView>
  );
}

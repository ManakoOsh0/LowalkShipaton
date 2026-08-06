import { useRouter } from "expo-router";
import { Linking, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { DailyGoalCard } from "@/components/DailyGoalCard";
import { HeroCard } from "@/components/HeroCard";
import { HomeHeader } from "@/components/HomeHeader";
import { ScheduleItemActionSheet } from "@/components/ScheduleItemActionSheet";
import { TodayScheduleSection } from "@/components/TodayScheduleSection";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { useScheduleItemActions } from "@/hooks/useScheduleItemActions";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_GAP, SCREEN_PADDING } from "@/lib/layout";
import { ROUTES } from "@/lib/routes";
import type { HeroAction } from "@/types/dashboard";

const TAB_BAR_CLEARANCE = 92;

function openMapsAt(latitude: number, longitude: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
  void Linking.openURL(url);
}

/** Home dashboard — answers "What should I do next?" with goal, hero, and schedule. */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { streak, dailyGoal, hero, schedule, celebration, dismissCelebration, isHeroPreview } =
    useHomeDashboard();
  const { showScheduleItemActions, actionSheetProps } = useScheduleItemActions();

  const handleHeroAction = (action: HeroAction) => {
    switch (action.kind) {
      case "create_focus_node":
        router.push(ROUTES.focusNodeNewWithTemplate("custom"));
        return;
      case "view_schedule":
      case "view_today_schedule":
        router.push(ROUTES.weekSchedule);
        return;
      case "view_progress":
      case "view_statistics":
        router.push(ROUTES.stats);
        return;
      case "open_maps":
      case "navigate":
        if (hero.latitude != null && hero.longitude != null) {
          openMapsAt(hero.latitude, hero.longitude);
          return;
        }
        if (hero.nodeId) {
          router.push(ROUTES.sessionDetail(hero.nodeId));
        }
        return;
      case "open_timer":
      case "resume_session":
      case "next_session":
        if (hero.nodeId) {
          router.push(ROUTES.sessionDetail(hero.nodeId));
          return;
        }
        router.push(ROUTES.weekSchedule);
        return;
      case "manage_blocked_apps":
        router.push(ROUTES.blockedApps);
        return;
      default:
        return;
    }
  };

  const scheduleBottomPadding = insets.bottom + TAB_BAR_CLEARANCE;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <HomeHeader
        streak={streak}
        onStreakPress={() => router.push(ROUTES.stats)}
      />

      <View style={{ flex: 1 }}>
        <DailyGoalCard {...dailyGoal} />
        <HeroCard
          {...hero}
          isPreview={isHeroPreview}
          onActionPress={handleHeroAction}
          onViewBlockedApps={() => router.push(ROUTES.blockedApps)}
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
            contentPaddingBottom={scheduleBottomPadding}
            onItemPress={(item) => router.push(ROUTES.sessionDetail(item.id))}
            onItemLongPress={showScheduleItemActions}
            onEmptyPress={() => router.push(ROUTES.focusNodeNewWithTemplate("custom"))}
          />
        </View>
      </View>

      <ScheduleItemActionSheet {...actionSheetProps} />
    </SafeAreaView>
  );
}

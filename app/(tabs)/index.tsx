import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AnchoringFlow } from "@/components/AnchoringFlow";
import { DailyGoalCard } from "@/components/DailyGoalCard";
import { HeroCard } from "@/components/HeroCard";
import { HomeHeader } from "@/components/HomeHeader";
import { TodayScheduleCard } from "@/components/TodayScheduleCard";
import { ScheduleEmptyState } from "@/components/ScheduleEmptyState";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { ROUTES } from "@/lib/routes";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { HeroAction } from "@/types/dashboard";

const TAB_BAR_CLEARANCE = 110;

function openMapsAt(latitude: number, longitude: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
  void Linking.openURL(url);
}

/** Home dashboard — answers "What should I do next?" with goal, hero, and schedule. */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { streak, dailyGoal, hero, schedule, anchoringRequest } = useHomeDashboard();

  const handleHeroAction = (action: HeroAction) => {
    switch (action.kind) {
      case "create_focus_node":
        router.push(ROUTES.focusNodeNew);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <HomeHeader streak={streak} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
        }}
      >
        <DailyGoalCard {...dailyGoal} />
        <HeroCard {...hero} onActionPress={handleHeroAction} />

        {anchoringRequest ? (
          <AnchoringFlow
            visible
            mode="required"
            nodeId={anchoringRequest.nodeId}
            nodeTitle={anchoringRequest.nodeTitle}
            anchorId={anchoringRequest.anchorId}
            anchorName={anchoringRequest.anchorName}
            onComplete={() => {}}
          />
        ) : null}

        <View
          style={{
            marginTop: 20,
            paddingHorizontal: 16,
            ...(schedule.length === 0 ? { flex: 1 } : {}),
          }}
        >
          <View
            style={{
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 17,
                lineHeight: 22,
                color: colors.foreground,
              }}
            >
              Today&apos;s plan
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all schedule"
              onPress={() => router.push(ROUTES.weekSchedule)}
              hitSlop={8}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.foregroundSubtle,
                }}
              >
                View all
              </Text>
            </Pressable>
          </View>

          {schedule.length > 0 ? (
            <TodayScheduleCard
              items={schedule}
              onItemPress={(item) => router.push(ROUTES.sessionDetail(item.id))}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                paddingVertical: 24,
              }}
            >
              <ScheduleEmptyState />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

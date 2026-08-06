/**
 * Weekly schedule screen — full Mon–Sun view of recurring Focus Nodes.
 * Reachable from the Home "View all" link beside Today's plan.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { ScheduleItemActionSheet } from "@/components/ScheduleItemActionSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { WeekDayScheduleSection } from "@/components/WeekDayScheduleSection";
import { useScheduleItemActions } from "@/hooks/useScheduleItemActions";
import { ROUTES } from "@/lib/routes";
import { SCREEN_PADDING, SECTION_GAP } from "@/lib/layout";
import { selectWeekSchedule } from "@/store/selectors";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Weekday } from "@/types/focusNode";

export default function WeekScheduleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const activeNodeId = useScheduleStore((state) => state.activeSession?.nodeId ?? null);
  const { showScheduleItemActions, actionSheetProps } = useScheduleItemActions();
  const week = selectWeekSchedule(focusNodes, anchors, activeNodeId);
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolledToToday = useRef(false);

  const handleSectionLayout = (weekday: Weekday, y: number, isToday: boolean) => {
    if (!isToday || hasScrolledToToday.current) return;

    hasScrolledToToday.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    });
  };

  const handleAddForDay = (weekday: Weekday) => {
    router.push(ROUTES.focusNodeNewWithWeekday(weekday));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScreenHeader
        title="Schedule"
        trailing={
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add custom session"
            onPress={() => router.push(ROUTES.focusNodeNewWithTemplate("custom"))}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={26} color={colors.sky} />
          </PressableScale>
        }
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingBottom: 40,
          gap: SECTION_GAP,
        }}
        showsVerticalScrollIndicator={false}
      >
        {week.map((day) => (
          <WeekDayScheduleSection
            key={day.weekday}
            day={day}
            onLayout={(y) => handleSectionLayout(day.weekday as Weekday, y, day.isToday)}
            onItemPress={(item) => router.push(ROUTES.sessionDetail(item.id, day.dateIso))}
            onItemLongPress={showScheduleItemActions}
            onAddPress={() => handleAddForDay(day.weekday as Weekday)}
          />
        ))}
      </ScrollView>

      <ScheduleItemActionSheet {...actionSheetProps} />
    </SafeAreaView>
  );
}

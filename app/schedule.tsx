/**
 * Weekly schedule screen — full Mon–Sun timetable of recurring Focus Nodes.
 * Reachable from the Home "View all" link beside Today's plan.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { ScheduleItemActionSheet } from "@/components/ScheduleItemActionSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScheduleScreenSkeleton } from "@/components/skeleton/ScheduleScreenSkeleton";
import { WeekTimetable } from "@/components/WeekTimetable";
import { useScheduleItemActions } from "@/hooks/useScheduleItemActions";
import { useCoreStoresHydrated } from "@/hooks/usePersistedStoreHydration";
import { ROUTES } from "@/lib/routes";
import { selectWeekSchedule } from "@/store/selectors";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Weekday } from "@/types/focusNode";

export default function WeekScheduleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const storesReady = useCoreStoresHydrated();
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const activeNodeId = useScheduleStore((state) => state.activeSession?.nodeId ?? null);
  const { showScheduleItemActions, actionSheetProps } = useScheduleItemActions();
  const week = selectWeekSchedule(focusNodes, anchors, activeNodeId);

  const handleAddForDay = (weekday: Weekday) => {
    router.push(ROUTES.focusNodeNewWithWeekday(weekday));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScreenHeader
        title="Schedule"
        centerTitle
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

      {!storesReady ? (
        <ScheduleScreenSkeleton />
      ) : (
        <WeekTimetable
          week={week}
          onItemPress={(item) => router.push(ROUTES.sessionDetail(item.id, item.dateIso))}
          onItemLongPress={showScheduleItemActions}
          onAddForDay={handleAddForDay}
        />
      )}

      <ScheduleItemActionSheet {...actionSheetProps} />
    </SafeAreaView>
  );
}

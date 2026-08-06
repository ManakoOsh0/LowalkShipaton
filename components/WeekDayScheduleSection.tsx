/**
 * WeekDayScheduleSection — one day block in the weekly schedule view with header and session cards.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { WeekScheduleDayList } from "@/components/WeekScheduleDayList";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_MD } from "@/lib/cardStyle";
import type { ScheduleItem, WeekDaySchedule } from "@/types/dashboard";

type WeekDayScheduleSectionProps = {
  day: WeekDaySchedule;
  onItemPress: (item: ScheduleItem) => void;
  onItemLongPress: (item: ScheduleItem) => void;
  onAddPress: () => void;
  onLayout?: (y: number) => void;
};

export function WeekDayScheduleSection({
  day,
  onItemPress,
  onItemLongPress,
  onAddPress,
  onLayout,
}: WeekDayScheduleSectionProps) {
  const colors = useThemeColors();
  const sessionCount = day.items.length;
  const hasSessions = sessionCount > 0;

  return (
    <View
      onLayout={(event) => onLayout?.(event.nativeEvent.layout.y)}
      style={{
        gap: 10,
        paddingHorizontal: day.isToday ? 12 : 0,
        paddingVertical: day.isToday ? 12 : 0,
        marginHorizontal: day.isToday ? -12 : 0,
        borderRadius: day.isToday ? CARD_RADIUS_MD : 0,
        backgroundColor: day.isToday ? colors.primarySoft : "transparent",
        borderCurve: "continuous",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: "Poppins-Bold",
            fontSize: 16,
            lineHeight: 22,
            color: day.isToday ? colors.primary : colors.foreground,
          }}
        >
          {day.dayLabel}
        </Text>

        <Text
          style={{
            fontFamily: day.isToday ? "Poppins-SemiBold" : "Poppins-Regular",
            fontSize: 14,
            lineHeight: 20,
            color: day.isToday ? colors.sky : colors.muted,
          }}
        >
          {day.dateLabel}
        </Text>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Add session for ${day.dayLabel}`}
          onPress={onAddPress}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={22} color={colors.sky} />
        </PressableScale>
      </View>

      {hasSessions ? (
        <WeekScheduleDayList
          items={day.items}
          onItemPress={onItemPress}
          onItemLongPress={onItemLongPress}
        />
      ) : (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Add session for ${day.dayLabel}`}
          onPress={onAddPress}
          style={{ paddingVertical: 10 }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            No sessions · Tap to add
          </Text>
        </PressableScale>
      )}
    </View>
  );
}

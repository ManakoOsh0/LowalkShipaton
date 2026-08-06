/**
 * WeekScheduleDayList — grouped day block for the full week schedule.
 * One card surface with hairline dividers instead of stacked row cards.
 */
import { View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { ScheduleRow } from "@/components/ScheduleRow";
import { CARD_RADIUS_LG } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ScheduleItem } from "@/types/dashboard";

type WeekScheduleDayListProps = {
  items: ScheduleItem[];
  onItemPress?: (item: ScheduleItem) => void;
  onItemLongPress?: (item: ScheduleItem) => void;
};

export function WeekScheduleDayList({
  items,
  onItemPress,
  onItemLongPress,
}: WeekScheduleDayListProps) {
  const colors = useThemeColors();

  return (
    <NeuCard
      borderRadius={CARD_RADIUS_LG}
      shadowVariant="sm"
      contentStyle={{ padding: 0 }}
    >
      {items.map((item, index) => (
        <View
          key={item.id}
          style={{
            borderTopWidth: index > 0 ? 1 : 0,
            borderTopColor: colors.border,
          }}
        >
          <ScheduleRow
            {...item}
            variant="week"
            onPress={onItemPress ? () => onItemPress(item) : undefined}
            onLongPress={onItemLongPress ? () => onItemLongPress(item) : undefined}
          />
        </View>
      ))}
    </NeuCard>
  );
}

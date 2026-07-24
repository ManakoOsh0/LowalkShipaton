/**
 * TodayScheduleCard — today's schedule as separate card rows with breathing room.
 */
import { View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { ScheduleRow } from "@/components/ScheduleRow";
import { CARD_RADIUS_LG } from "@/lib/cardStyle";
import type { ScheduleItem } from "@/types/dashboard";

type TodayScheduleCardProps = {
  items: ScheduleItem[];
  onItemPress?: (item: ScheduleItem) => void;
};

export function TodayScheduleCard({ items, onItemPress }: TodayScheduleCardProps) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <NeuCard
          key={item.id}
          borderRadius={CARD_RADIUS_LG}
          shadowVariant="sm"
          contentStyle={{ padding: 0 }}
        >
          <ScheduleRow
            {...item}
            onPress={onItemPress ? () => onItemPress(item) : undefined}
          />
        </NeuCard>
      ))}
    </View>
  );
}

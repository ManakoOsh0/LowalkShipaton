/**
 * TodayScheduleCard — today's schedule as separate card rows with breathing room.
 */
import { useMemo } from "react";
import { View } from "react-native";

import { TodayScheduleItemCard } from "@/components/TodayScheduleItemCard";
import type { ScheduleItem, ScheduleItemStatus } from "@/types/dashboard";

type TodayScheduleCardProps = {
  items: ScheduleItem[];
  onItemPress?: (item: ScheduleItem) => void;
  onItemLongPress?: (item: ScheduleItem) => void;
};

const FOCUS_STATUS_PRIORITY: ScheduleItemStatus[] = [
  "active",
  "overdue",
  "upcoming",
  "missed",
];

function getFocusScheduleIndex(items: ScheduleItem[]): number {
  if (items.length === 0) return -1;

  for (const status of FOCUS_STATUS_PRIORITY) {
    const index = items.findIndex((item) => item.status === status);
    if (index >= 0) return index;
  }

  const fallback = items.findIndex(
    (item) => item.status !== "completed" && item.status !== "skipped",
  );
  return fallback >= 0 ? fallback : 0;
}

export function TodayScheduleCard({
  items,
  onItemPress,
  onItemLongPress,
}: TodayScheduleCardProps) {
  const focusItemId = useMemo(() => {
    const index = getFocusScheduleIndex(items);
    return index >= 0 ? items[index]?.id : undefined;
  }, [items]);

  return (
    <View style={{ gap: 10 }}>
      {items.map((item) => (
        <TodayScheduleItemCard
          key={item.id}
          item={item}
          isFocus={item.id === focusItemId}
          onPress={onItemPress ? () => onItemPress(item) : undefined}
          onLongPress={onItemLongPress ? () => onItemLongPress(item) : undefined}
        />
      ))}
    </View>
  );
}

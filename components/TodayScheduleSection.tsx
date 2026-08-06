/**
 * TodayScheduleSection — home "Today's plan" block with separate session cards.
 */
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ScheduleEmptyState } from "@/components/ScheduleEmptyState";
import { TodayScheduleItemCard } from "@/components/TodayScheduleItemCard";
import { useThemeColors } from "@/hooks/useThemeColors";
import { ROUTES } from "@/lib/routes";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";
import type { ScheduleItem, ScheduleItemStatus } from "@/types/dashboard";

type TodayScheduleSectionProps = {
  items: ScheduleItem[];
  onItemPress?: (item: ScheduleItem) => void;
  onItemLongPress?: (item: ScheduleItem) => void;
  onEmptyPress?: () => void;
  contentPaddingBottom?: number;
};

const FOCUS_STATUS_PRIORITY: ScheduleItemStatus[] = [
  "active",
  "overdue",
  "upcoming",
  "missed",
];

/** Pick the row the user most likely needs right now — active first, then next actionable. */
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

export function TodayScheduleSection({
  items,
  onItemPress,
  onItemLongPress,
  onEmptyPress,
  contentPaddingBottom = 0,
}: TodayScheduleSectionProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const itemOffsets = useRef<Map<string, number>>(new Map());
  const [layoutVersion, setLayoutVersion] = useState(0);

  const focusIndex = useMemo(() => getFocusScheduleIndex(items), [items]);
  const focusItemId = focusIndex >= 0 ? items[focusIndex]?.id : undefined;

  useEffect(() => {
    if (!focusItemId) return;

    const y = itemOffsets.current.get(focusItemId);
    if (y == null) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
    });
  }, [focusItemId, layoutVersion]);

  const handleItemLayout = (itemId: string, y: number) => {
    const previous = itemOffsets.current.get(itemId);
    if (previous === y) return;

    itemOffsets.current.set(itemId, y);
    setLayoutVersion((version) => version + 1);
  };

  const header = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={textStyle("h4", colors.foreground, {
            fontFamily: FONT_FAMILY.bold,
            fontSize: 17,
            lineHeight: 22,
          })}
        >
          Today&apos;s plan
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View week schedule"
        onPress={() => router.push(ROUTES.weekSchedule)}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, paddingTop: 2 })}
      >
        <Text
          style={textStyle("bodyMd", colors.foregroundSubtle, {
            fontFamily: FONT_FAMILY.semibold,
          })}
        >
          View all
        </Text>
      </Pressable>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={{ gap: 10, paddingBottom: contentPaddingBottom }}>
        {header}
        <ScheduleEmptyState onPress={onEmptyPress} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, minHeight: 0, gap: 10 }}>
      {header}

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: contentPaddingBottom }}
      >
        {items.map((item) => (
          <View
            key={item.id}
            onLayout={(event) => handleItemLayout(item.id, event.nativeEvent.layout.y)}
          >
            <TodayScheduleItemCard
              item={item}
              isFocus={item.id === focusItemId}
              onPress={onItemPress ? () => onItemPress(item) : undefined}
              onLongPress={onItemLongPress ? () => onItemLongPress(item) : undefined}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

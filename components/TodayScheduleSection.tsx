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
  onItemMenuPress?: (item: ScheduleItem) => void;
  onEmptyPress?: () => void;
};

const FOCUS_STATUS_PRIORITY: ScheduleItemStatus[] = [
  "active",
  "overdue",
  "upcoming",
  "missed",
];

/** Breathing room under the last card — enough for shadow, not a tab-bar spacer. */
const LIST_BOTTOM_PAD = 12;
const FOCUS_MARGIN = 12;

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
  onItemMenuPress,
  onEmptyPress,
}: TodayScheduleSectionProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const itemMetrics = useRef<Map<string, { y: number; height: number }>>(new Map());
  const scrollYRef = useRef(0);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const focusIndex = useMemo(() => getFocusScheduleIndex(items), [items]);
  const focusItemId = focusIndex >= 0 ? items[focusIndex]?.id : undefined;

  useEffect(() => {
    if (!focusItemId || viewportHeight <= 0) return;

    const metrics = itemMetrics.current.get(focusItemId);
    if (!metrics) return;

    const viewTop = scrollYRef.current;
    const viewBottom = viewTop + viewportHeight;
    const itemTop = metrics.y;
    const itemBottom = metrics.y + metrics.height;

    // Keep the focused row on-screen without pinning it to the top.
    // Pinning the last card would scroll a blank spacer into view.
    const fullyVisible =
      itemTop >= viewTop + FOCUS_MARGIN && itemBottom <= viewBottom - FOCUS_MARGIN;
    if (fullyVisible) return;

    let nextY = viewTop;
    if (itemTop < viewTop + FOCUS_MARGIN) {
      nextY = Math.max(itemTop - FOCUS_MARGIN, 0);
    } else if (itemBottom > viewBottom - FOCUS_MARGIN) {
      nextY = Math.max(itemBottom - viewportHeight + FOCUS_MARGIN, 0);
    }

    if (Math.abs(nextY - viewTop) < 1) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: nextY, animated: true });
    });
  }, [focusItemId, layoutVersion, viewportHeight]);

  const handleItemLayout = (itemId: string, y: number, height: number) => {
    const previous = itemMetrics.current.get(itemId);
    if (previous?.y === y && previous?.height === height) return;

    itemMetrics.current.set(itemId, { y, height });
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
      <View style={{ flex: 1, minHeight: 0, gap: 10 }}>
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
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight !== viewportHeight) {
            setViewportHeight(nextHeight);
          }
        }}
        onScroll={(event) => {
          scrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: 10, paddingBottom: LIST_BOTTOM_PAD }}
      >
        {items.map((item) => (
          <View
            key={item.id}
            onLayout={(event) =>
              handleItemLayout(
                item.id,
                event.nativeEvent.layout.y,
                event.nativeEvent.layout.height,
              )
            }
          >
            <TodayScheduleItemCard
              item={item}
              isFocus={item.id === focusItemId}
              onPress={onItemPress ? () => onItemPress(item) : undefined}
              onLongPress={onItemLongPress ? () => onItemLongPress(item) : undefined}
              onMenuPress={onItemMenuPress ? () => onItemMenuPress(item) : undefined}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

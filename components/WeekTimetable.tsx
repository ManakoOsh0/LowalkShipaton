/**
 * WeekTimetable — horizontally scrollable day columns with time-proportional blocks.
 * Sticky day pills track the grid via transform (no second ScrollView).
 */
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { WeekTimetableBlock } from "@/components/WeekTimetableBlock";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PILL_RADIUS } from "@/lib/cardStyle";
import { SCREEN_PADDING } from "@/lib/layout";
import {
  dayColumnHeightForLayouts,
  getWeekdayAbbreviation,
  layoutDaySessionBlocks,
  nowLineOffsetForDay,
  resolveDayTimetableMinutes,
  resolveFocusBlockTop,
  resolveHorizontalScrollToColumn,
  resolveWeekScheduleFocus,
  resolveWeekColumnWidth,
  shouldShowNowLineForDay,
  WEEK_COLUMN_GAP,
} from "@/lib/weekTimetable";
import { FONT_FAMILY } from "@/theme/fonts";
import type { ScheduleItem, WeekDaySchedule } from "@/types/dashboard";
import type { Weekday } from "@/types/focusNode";

const DAY_PILL_ROW_HEIGHT = 38;
const FOCUS_SCROLL_PADDING = 100;

type WeekTimetableProps = {
  week: WeekDaySchedule[];
  onItemPress: (item: ScheduleItem) => void;
  onItemLongPress: (item: ScheduleItem) => void;
  onAddForDay: (weekday: Weekday) => void;
};

export function WeekTimetable({
  week,
  onItemPress,
  onItemLongPress,
  onAddForDay,
}: WeekTimetableProps) {
  const colors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const columnWidth = resolveWeekColumnWidth(screenWidth);
  const viewportWidth = screenWidth - SCREEN_PADDING * 2;
  const verticalScrollRef = useRef<ScrollView>(null);
  const horizontalScrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const pendingVerticalFocusScroll = useRef(false);
  const lastFocusKeyRef = useRef<string | null>(null);
  const [gridOffsetY, setGridOffsetY] = useState(0);

  const todayDay = week.find((day) => day.isToday);
  const focusTarget = useMemo(() => resolveWeekScheduleFocus(week), [week]);
  const focusKey = focusTarget
    ? `${focusTarget.item.id}:${focusTarget.item.dateIso}`
    : null;

  const [selectedDateIso, setSelectedDateIso] = useState(
    () =>
      focusTarget?.day.dateIso ??
      todayDay?.dateIso ??
      week[0]?.dateIso ??
      "",
  );

  const todayIndex = week.findIndex((day) => day.isToday);
  const selectedIndex = week.findIndex((day) => day.dateIso === selectedDateIso);
  const focusDayIndex = focusTarget
    ? week.findIndex((day) => day.dateIso === focusTarget.day.dateIso)
    : -1;

  const focusBlockTop = useMemo(() => {
    if (!focusTarget) return null;
    return resolveFocusBlockTop(focusTarget.day, focusTarget.item.id);
  }, [focusTarget]);

  const dayColumns = useMemo(
    () =>
      week.map((day) => {
        const isSelected = day.dateIso === selectedDateIso;
        const { startMinutes, endMinutes } = resolveDayTimetableMinutes(day);
        const layouts = layoutDaySessionBlocks(day.items, startMinutes);
        const columnHeight = dayColumnHeightForLayouts(
          layouts,
          startMinutes,
          endMinutes,
        );
        const nowOffset = day.isToday
          ? nowLineOffsetForDay(new Date(), startMinutes, endMinutes)
          : null;

        return {
          day,
          isSelected,
          layouts,
          columnHeight,
          nowOffset,
        };
      }),
    [week, selectedDateIso],
  );

  const scrollToFocusColumn = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0) return;

      const x = resolveHorizontalScrollToColumn(
        targetIndex,
        week.length,
        columnWidth,
        viewportWidth,
      );

      scrollX.value = x;
      requestAnimationFrame(() => {
        horizontalScrollRef.current?.scrollTo({ x, animated: false });
      });
    },
    [columnWidth, viewportWidth, scrollX, week.length],
  );

  const horizontalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const headerTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value }],
  }));

  useEffect(() => {
    if (!focusTarget) return;
    setSelectedDateIso(focusTarget.day.dateIso);
  }, [focusKey, focusTarget]);

  useEffect(() => {
    if (!focusKey || focusKey === lastFocusKeyRef.current) return;
    lastFocusKeyRef.current = focusKey;
    pendingVerticalFocusScroll.current = true;

    const targetIndex =
      focusDayIndex >= 0 ? focusDayIndex : selectedIndex >= 0 ? selectedIndex : todayIndex;
    scrollToFocusColumn(targetIndex);
  }, [focusKey, focusDayIndex, selectedIndex, todayIndex, scrollToFocusColumn]);

  useEffect(() => {
    if (!pendingVerticalFocusScroll.current || focusBlockTop === null || gridOffsetY <= 0) {
      return;
    }

    pendingVerticalFocusScroll.current = false;
    const targetY = gridOffsetY + focusBlockTop - FOCUS_SCROLL_PADDING;

    requestAnimationFrame(() => {
      verticalScrollRef.current?.scrollTo({
        y: Math.max(targetY, 0),
        animated: true,
      });
    });
  }, [focusBlockTop, gridOffsetY]);

  return (
    <ScrollView
      ref={verticalScrollRef}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      contentContainerStyle={{
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 4,
        paddingBottom: 40,
        gap: 12,
      }}
    >
      <View
        style={{
          marginHorizontal: -SCREEN_PADDING,
          paddingBottom: 6,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            {
              flexDirection: "row",
              gap: WEEK_COLUMN_GAP,
              height: DAY_PILL_ROW_HEIGHT,
              paddingHorizontal: SCREEN_PADDING,
              alignItems: "center",
            },
            headerTrackStyle,
          ]}
        >
          {dayColumns.map(({ day, isSelected }) => (
            <PressableScale
              key={`pill-${day.dateIso}`}
              accessibilityRole="button"
              accessibilityLabel={`View ${day.dayLabel}`}
              onPress={() => {
                setSelectedDateIso(day.dateIso);
                const index = week.findIndex((entry) => entry.dateIso === day.dateIso);
                scrollToFocusColumn(index);
              }}
              style={{
                width: columnWidth,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: PILL_RADIUS,
                  backgroundColor: isSelected ? colors.primarySoft : colors.card,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_FAMILY.bold,
                    fontSize: 11,
                    lineHeight: 14,
                    letterSpacing: 0.6,
                    color: isSelected ? colors.primary : colors.muted,
                  }}
                >
                  {getWeekdayAbbreviation(day.weekday)}
                </Text>
              </View>
            </PressableScale>
          ))}
        </Animated.View>
      </View>

      <View onLayout={(event) => setGridOffsetY(event.nativeEvent.layout.y)}>
        <Animated.ScrollView
          ref={horizontalScrollRef}
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          onScroll={horizontalScrollHandler}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: WEEK_COLUMN_GAP, paddingBottom: 4 }}
        >
          {dayColumns.map(({ day, isSelected, layouts, columnHeight, nowOffset }) => (
            <View key={day.dateIso} style={{ width: columnWidth }}>
              <View
                style={{
                  height: columnHeight,
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  backgroundColor: isSelected ? "rgba(255, 143, 51, 0.08)" : colors.card,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primarySoft : colors.border,
                }}
              >
                {day.isToday &&
                nowOffset !== null &&
                shouldShowNowLineForDay(nowOffset, layouts) ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: nowOffset,
                      left: 6,
                      right: 6,
                      height: 2,
                      backgroundColor: colors.primary,
                      borderRadius: 1,
                      zIndex: 0,
                    }}
                  />
                ) : null}

                {day.items.length === 0 ? (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Add session for ${day.dayLabel}`}
                    onPress={() => onAddForDay(day.weekday as Weekday)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={22} color={colors.sky} />
                    <Text
                      style={{
                        marginTop: 6,
                        fontFamily: FONT_FAMILY.regular,
                        fontSize: 11,
                        lineHeight: 14,
                        color: colors.muted,
                        textAlign: "center",
                      }}
                    >
                      Add
                    </Text>
                  </PressableScale>
                ) : (
                  layouts.map((layout) => {
                    const isFocused =
                      focusTarget?.item.id === layout.item.id &&
                      focusTarget?.item.dateIso === layout.item.dateIso;

                    return (
                      <WeekTimetableBlock
                        key={`${layout.item.id}-${layout.item.dateIso}`}
                        item={layout.item}
                        frame={layout.frame}
                        content={layout.content}
                        dayLabel={day.dayLabel}
                        isFocused={isFocused}
                        onPress={() => {
                          setSelectedDateIso(day.dateIso);
                          onItemPress(layout.item);
                        }}
                        onLongPress={() => onItemLongPress(layout.item)}
                      />
                    );
                  })
                )}
              </View>
            </View>
          ))}
        </Animated.ScrollView>
      </View>
    </ScrollView>
  );
}

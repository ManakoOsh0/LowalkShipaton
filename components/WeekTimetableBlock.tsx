/**
 * WeekTimetableBlock — one session tile inside a day column.
 * Status colors: green complete, red missed, orange active, blue upcoming.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { QuickActionHourglassIcon } from "@/components/QuickActionHourglassIcon";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_SM } from "@/lib/cardStyle";
import { getKindTintColor } from "@/lib/focusNodeKindColors";
import { formatMinutesToLabel } from "@/lib/time";
import {
  formatSessionDuration,
  type SessionBlockContent,
  TIMETABLE_BLOCK_INSET,
} from "@/lib/weekTimetable";
import { FONT_FAMILY } from "@/theme/fonts";
import type { ScheduleItem } from "@/types/dashboard";

const BLOCK_FILL_ALPHA = 0.34;
const STATUS_BADGE_SIZE = 16;

function tintColor(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type WeekTimetableBlockProps = {
  item: ScheduleItem;
  frame: { top: number; height: number };
  content: SessionBlockContent;
  dayLabel: string;
  isFocused?: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function formatCompactTime(minutes: number): string {
  return formatMinutesToLabel(minutes).replace(":00", "");
}

const metaTextStyle = {
  width: "100%" as const,
  fontFamily: FONT_FAMILY.medium,
  fontSize: 9,
  lineHeight: 11,
  textAlign: "center" as const,
};

export function WeekTimetableBlock({
  item,
  frame,
  content,
  dayLabel,
  isFocused = false,
  onPress,
  onLongPress,
}: WeekTimetableBlockProps) {
  const colors = useThemeColors();
  const isCompleted = item.status === "completed";
  const isSkipped = item.status === "skipped";
  const isMissed = item.status === "missed";
  const isOverdue = item.status === "overdue";
  const isActive = item.status === "active";
  const isUpcoming = item.status === "upcoming";
  const blockOpacity = isSkipped ? 0.55 : 1;
  const durationMinutes = Math.max(item.endMinutes - item.startMinutes, 0);
  const durationLabel = formatSessionDuration(durationMinutes);
  const locationLabel = item.locationLabel.trim();
  const showLocation = content.showLocation && locationLabel.length > 0;

  const backgroundColor = isCompleted
    ? tintColor(colors.success, 0.32)
    : isMissed
      ? tintColor(colors.error, 0.32)
      : isActive
        ? tintColor(colors.primary, 0.28)
        : isOverdue
          ? tintColor(colors.primary, 0.2)
          : isUpcoming
            ? tintColor(colors.skyDeep, 0.24)
            : getKindTintColor(item.kind, BLOCK_FILL_ALPHA);

  const borderColor = isActive || isOverdue
    ? colors.primary
    : isUpcoming
      ? colors.skyDeep
      : isCompleted
        ? colors.success
        : isMissed
          ? colors.error
          : colors.cardStroke;

  const borderWidth =
    isActive || isOverdue || isUpcoming || isCompleted || isMissed ? 2 : 1;
  const titleColor = isMissed ? colors.foregroundSubtle : colors.foreground;
  const startTimeColor =
    isActive || isOverdue
      ? colors.primary
      : isUpcoming
        ? colors.sky
        : colors.foregroundSubtle;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.timeLabel}, ${locationLabel || "no location"}, ${durationLabel}, ${dayLabel}`}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        position: "absolute",
        top: frame.top,
        left: TIMETABLE_BLOCK_INSET,
        right: TIMETABLE_BLOCK_INSET,
        height: frame.height,
        opacity: blockOpacity * (pressed ? 0.92 : 1),
        zIndex: isFocused ? 3 : isActive ? 2 : 1,
        elevation: isFocused ? 3 : isActive ? 2 : 1,
      })}
    >
      <View
        style={{
          flex: 1,
          borderRadius: CARD_RADIUS_SM,
          backgroundColor,
          borderWidth,
          borderColor,
          paddingHorizontal: 6,
          paddingVertical: 6,
          justifyContent: "center",
          gap: 2,
        }}
      >
        {isCompleted ? (
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: STATUS_BADGE_SIZE,
              height: STATUS_BADGE_SIZE,
              borderRadius: STATUS_BADGE_SIZE / 2,
              backgroundColor: colors.success,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
          </View>
        ) : null}

        {isMissed ? (
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: STATUS_BADGE_SIZE,
              height: STATUS_BADGE_SIZE,
              borderRadius: STATUS_BADGE_SIZE / 2,
              backgroundColor: colors.error,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={10} color="#FFFFFF" />
          </View>
        ) : null}

        {isActive ? (
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: STATUS_BADGE_SIZE,
              height: STATUS_BADGE_SIZE,
              borderRadius: STATUS_BADGE_SIZE / 2,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QuickActionHourglassIcon size={10} color="#FFFFFF" />
          </View>
        ) : null}

        {isUpcoming || isOverdue ? (
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: STATUS_BADGE_SIZE,
              height: STATUS_BADGE_SIZE,
              borderRadius: STATUS_BADGE_SIZE / 2,
              backgroundColor: isOverdue ? colors.primary : colors.skyDeep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="time-outline" size={10} color="#FFFFFF" />
          </View>
        ) : null}

        <Text
          numberOfLines={1}
          style={{
            ...metaTextStyle,
            fontSize: 10,
            lineHeight: 12,
            color: startTimeColor,
          }}
        >
          {formatCompactTime(item.startMinutes)}
        </Text>

        <Text
          numberOfLines={content.titleLines}
          style={{
            width: "100%",
            fontFamily: FONT_FAMILY.semibold,
            fontSize: 11,
            lineHeight: 14,
            color: titleColor,
            textAlign: "center",
          }}
        >
          {item.title}
        </Text>

        {showLocation ? (
          <Text
            numberOfLines={content.locationLines}
            style={{
              ...metaTextStyle,
              color: colors.foregroundSubtle,
            }}
          >
            {locationLabel}
          </Text>
        ) : null}

        <Text
          numberOfLines={1}
          style={{
            ...metaTextStyle,
            color: colors.muted,
          }}
        >
          {durationLabel}
        </Text>

        {content.showEndTime ? (
          <Text
            numberOfLines={1}
            style={{
              ...metaTextStyle,
              fontSize: 10,
              lineHeight: 12,
              color: colors.foregroundSubtle,
            }}
          >
            {formatCompactTime(item.endMinutes)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

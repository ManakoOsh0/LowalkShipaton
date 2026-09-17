/**
 * Schedule row — scannable checklist item inside a schedule card.
 * Pastel icon tile, single metadata line, circular status indicator.
 */
import { Ionicons } from "@expo/vector-icons";
import { MagicStick } from "@solar-icons/react-native/Bold";
import { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";

import { ClassKindIcon } from "@/components/ClassKindIcon";
import { GymKindIcon } from "@/components/GymKindIcon";
import { LibraryKindIcon } from "@/components/LibraryKindIcon";
import { QuickActionHourglassIcon } from "@/components/QuickActionHourglassIcon";
import { useThemeColors } from "@/hooks/useThemeColors";
import { ICON_TILE_RADIUS_LG } from "@/lib/cardStyle";
import {
  getKindAccentColor,
  getKindTintColor,
} from "@/lib/focusNodeKindColors";
import type { ScheduleItem, ScheduleItemKind } from "@/types/dashboard";
import type { IconProps } from "@solar-icons/react-native/lib/types";

const ICON_SIZE = 40;
const STATUS_SIZE = 24;
const ROW_PADDING_H = 14;
const ROW_PADDING_V = 11;
const TITLE_LINE_HEIGHT = 20;
const META_LINE_HEIGHT = 18;
const TITLE_META_GAP = 2;
/** Room for one title line plus a wrapped class time/location meta line. */
const SCHEDULE_ROW_TEXT_HEIGHT =
  TITLE_LINE_HEIGHT + TITLE_META_GAP + META_LINE_HEIGHT * 2;
/** Fixed row height — matches the natural class card footprint. */
const SCHEDULE_ROW_HEIGHT = ROW_PADDING_V * 2 + SCHEDULE_ROW_TEXT_HEIGHT;

const KIND_ICONS: Record<ScheduleItemKind, ComponentType<IconProps>> = {
  class: ClassKindIcon,
  library: LibraryKindIcon,
  gym: GymKindIcon,
  custom: MagicStick,
};

type ScheduleRowProps = ScheduleItem & {
  variant?: "default" | "today";
  onPress?: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
};

function ScheduleRowMenuButton({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Session options"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 2,
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
    </Pressable>
  );
}

function StatusRing({ status }: { status: ScheduleItem["status"] }) {
  const colors = useThemeColors();

  if (status === "completed") {
    return (
      <View
        style={{
          width: STATUS_SIZE,
          height: STATUS_SIZE,
          borderRadius: STATUS_SIZE / 2,
          backgroundColor: colors.success,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
      </View>
    );
  }

  if (status === "skipped") {
    return (
      <View
        style={{
          width: STATUS_SIZE,
          height: STATUS_SIZE,
          borderRadius: STATUS_SIZE / 2,
          borderWidth: 2,
          borderColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={12} color={colors.muted} />
      </View>
    );
  }

  if (status === "active") {
    // In-progress mark — tiny hourglass inside the ring reads as “time is running.”
    return (
      <View
        style={{
          width: STATUS_SIZE,
          height: STATUS_SIZE,
          borderRadius: STATUS_SIZE / 2,
          borderWidth: 2,
          borderColor: colors.skyDeep,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <QuickActionHourglassIcon size={14} color={colors.skyDeep} />
      </View>
    );
  }

  const ringColor =
    status === "missed" || status === "overdue" ? colors.error : colors.ring;

  return (
    <View
      style={{
        width: STATUS_SIZE,
        height: STATUS_SIZE,
        borderRadius: STATUS_SIZE / 2,
        borderWidth: 2,
        borderColor: ringColor,
      }}
    />
  );
}

function TodayScheduleRowContent({
  title,
  timeLabel,
  locationLabel,
  kind,
  status,
  onMenuPress,
}: Pick<
  ScheduleRowProps,
  "title" | "timeLabel" | "locationLabel" | "kind" | "status" | "onMenuPress"
>) {
  const colors = useThemeColors();
  const KindIcon = KIND_ICONS[kind] ?? MagicStick;
  const iconColor = getKindAccentColor(kind);
  const isCompleted = status === "completed";
  const isSkipped = status === "skipped";
  const isActive = status === "active";

  const statusPrefix =
    status === "skipped"
      ? "Skipped"
      : status === "missed"
        ? "Missed"
        : status === "overdue"
          ? "Overdue"
          : null;

  const titleColor = isCompleted
    ? colors.muted
    : isSkipped
      ? colors.muted
      : colors.foreground;

  const metaColor =
    status === "missed" || status === "overdue"
      ? colors.error
      : isCompleted || isSkipped
        ? colors.muted
        : colors.muted;

  const timeColor = isActive ? colors.primary : metaColor;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: SCHEDULE_ROW_HEIGHT,
        paddingHorizontal: ROW_PADDING_H,
        paddingVertical: ROW_PADDING_V,
        borderCurve: "continuous",
      }}
    >
      <View
        style={{
          marginRight: 10,
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: ICON_TILE_RADIUS_LG,
          borderCurve: "continuous",
          backgroundColor: getKindTintColor(kind),
          opacity: isCompleted ? 0.65 : 1,
        }}
      >
        <KindIcon size={20} color={iconColor} />
      </View>

      <View
        style={{
          flex: 1,
          marginRight: 8,
          minWidth: 0,
          height: SCHEDULE_ROW_TEXT_HEIGHT,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            lineHeight: TITLE_LINE_HEIGHT,
            color: titleColor,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: TITLE_META_GAP,
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: META_LINE_HEIGHT,
            color: metaColor,
          }}
          numberOfLines={2}
        >
          {statusPrefix ? `${statusPrefix} · ` : ""}
          <Text
            style={{
              fontFamily: isActive ? "Poppins-SemiBold" : "Poppins-Regular",
              color: timeColor,
              fontVariant: ["tabular-nums"],
            }}
          >
            {timeLabel}
          </Text>
          {locationLabel ? ` · ${locationLabel}` : ""}
        </Text>
      </View>

      {onMenuPress ? <ScheduleRowMenuButton onPress={onMenuPress} /> : null}

      <StatusRing status={status} />
    </View>
  );
}

export function ScheduleRow({
  title,
  timeLabel,
  locationLabel,
  kind,
  status,
  variant = "default",
  onPress,
  onLongPress,
  onMenuPress,
}: ScheduleRowProps) {
  const colors = useThemeColors();
  const KindIcon = KIND_ICONS[kind] ?? MagicStick;
  const iconColor = getKindAccentColor(kind);
  const isCompleted = status === "completed";
  const isSkipped = status === "skipped";

  const metaLine =
    status === "completed"
      ? `${timeLabel}`
      : status === "skipped"
        ? `Skipped · ${timeLabel}`
        : status === "missed"
          ? `Missed · ${timeLabel}`
          : status === "overdue"
            ? `Overdue · ${timeLabel}`
            : status === "active"
              ? `In progress · ${timeLabel}`
              : `${locationLabel} · ${timeLabel}`;

  const metaColor =
    status === "missed" || status === "overdue" ? colors.error : colors.muted;

  const titleColor = isCompleted
    ? colors.foreground
    : isSkipped
      ? colors.muted
      : colors.foreground;

  const titleOpacity = isCompleted ? 0.65 : isSkipped ? 0.6 : 1;

  const content =
    variant === "today" ? (
      <TodayScheduleRowContent
        title={title}
        timeLabel={timeLabel}
        locationLabel={locationLabel}
        kind={kind}
        status={status}
        onMenuPress={onMenuPress}
      />
    ) : (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: SCHEDULE_ROW_HEIGHT,
          paddingHorizontal: ROW_PADDING_H,
          paddingVertical: ROW_PADDING_V,
        }}
      >
        <View
          style={{
            marginRight: 10,
            width: ICON_SIZE,
            height: ICON_SIZE,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: ICON_TILE_RADIUS_LG,
            borderCurve: "continuous",
            backgroundColor: getKindTintColor(kind),
          }}
        >
          <KindIcon size={20} color={iconColor} />
        </View>

        <View
          style={{
            flex: 1,
            marginRight: 10,
            minWidth: 0,
            height: SCHEDULE_ROW_TEXT_HEIGHT,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 15,
              lineHeight: TITLE_LINE_HEIGHT,
              color: titleColor,
              opacity: titleOpacity,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              marginTop: TITLE_META_GAP,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: META_LINE_HEIGHT,
              color: metaColor,
            }}
            numberOfLines={2}
          >
            {metaLine}
          </Text>
        </View>

        {onMenuPress ? <ScheduleRowMenuButton onPress={onMenuPress} /> : null}

        <StatusRing status={status} />
      </View>
    );

  if (onPress || onLongPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={
          onLongPress ? "Long press for edit, skip, or delete options" : undefined
        }
        android_disableSound
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

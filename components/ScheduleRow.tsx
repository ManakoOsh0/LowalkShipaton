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
import { ICON_TILE_RADIUS_LG } from "@/lib/cardStyle";
import { getKindAccentColor, getKindTintColor } from "@/lib/focusNodeKindColors";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ScheduleItem, ScheduleItemKind } from "@/types/dashboard";
import type { IconProps } from "@solar-icons/react-native/lib/types";

const ICON_SIZE = 44;
const STATUS_SIZE = 26;

const KIND_ICONS: Record<ScheduleItemKind, ComponentType<IconProps>> = {
  class: ClassKindIcon,
  library: LibraryKindIcon,
  gym: GymKindIcon,
  custom: MagicStick,
};

type ScheduleRowProps = ScheduleItem & {
  onPress?: () => void;
};

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
        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
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
        <Ionicons name="close" size={14} color={colors.muted} />
      </View>
    );
  }

  if (status === "active") {
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
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.skyDeep,
          }}
        />
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

export function ScheduleRow({
  title,
  timeLabel,
  locationLabel,
  kind,
  status,
  onPress,
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

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <View
        style={{
          marginRight: 12,
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: ICON_TILE_RADIUS_LG,
          borderCurve: "continuous",
          backgroundColor: getKindTintColor(kind),
        }}
      >
        <KindIcon size={22} color={iconColor} />
      </View>

      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            lineHeight: 20,
            color: titleColor,
            opacity: titleOpacity,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: metaColor,
          }}
          numberOfLines={1}
        >
          {metaLine}
        </Text>
      </View>

      <StatusRing status={status} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

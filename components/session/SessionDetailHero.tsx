/**
 * SessionDetailHero — kind icon, title, and recurrence label for session detail.
 */
import { MagicStick } from "@solar-icons/react-native/Bold";
import { ComponentType } from "react";
import { Text, View } from "react-native";

import { ClassKindIcon } from "@/components/ClassKindIcon";
import { GymKindIcon } from "@/components/GymKindIcon";
import { LibraryKindIcon } from "@/components/LibraryKindIcon";
import { ICON_TILE_RADIUS_LG } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getKindAccentColor, getKindTintColor } from "@/lib/focusNodeKindColors";
import { formatScheduleFrequencyLabel } from "@/lib/focusNodeStats";
import type { ScheduleItemKind } from "@/types/dashboard";
import type { FocusNodeSchedule } from "@/types/focusNode";
import type { IconProps } from "@solar-icons/react-native/lib/types";

const KIND_ICONS: Record<ScheduleItemKind, ComponentType<IconProps>> = {
  class: ClassKindIcon,
  library: LibraryKindIcon,
  gym: GymKindIcon,
  custom: MagicStick,
};

type SessionDetailHeroProps = {
  title: string;
  kind: ScheduleItemKind;
  schedule: FocusNodeSchedule;
  timeLabel: string;
};

export function SessionDetailHero({
  title,
  kind,
  schedule,
  timeLabel,
}: SessionDetailHeroProps) {
  const colors = useThemeColors();
  const KindIcon = KIND_ICONS[kind] ?? MagicStick;

  return (
    <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 20, gap: 12 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: ICON_TILE_RADIUS_LG + 4,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: getKindTintColor(kind, 0.2),
        }}
      >
        <KindIcon size={34} color={getKindAccentColor(kind)} />
      </View>

      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 26,
          lineHeight: 32,
          color: colors.foreground,
          textAlign: "center",
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 14,
          lineHeight: 20,
          color: colors.muted,
          textAlign: "center",
        }}
      >
        {formatScheduleFrequencyLabel(schedule)} · {timeLabel}
      </Text>
    </View>
  );
}

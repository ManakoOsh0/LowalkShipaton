/**
 * Focus habit card — one recurring session with recent-week dots, not success rates.
 * Duolingo-style streak feel for each Focus Node the user is building.
 */
import { MagicStick } from "@solar-icons/react-native/Bold";
import { ComponentType } from "react";
import { Text, View } from "react-native";

import { ClassKindIcon } from "@/components/ClassKindIcon";
import { GymKindIcon } from "@/components/GymKindIcon";
import { LibraryKindIcon } from "@/components/LibraryKindIcon";

import { NeuCard } from "@/components/NeuCard";
import { ICON_TILE_RADIUS_MD } from "@/lib/cardStyle";
import type { FocusHabitDotOutcome, FocusHabitSummary } from "@/lib/consistencyStats";
import { getKindAccentColor, getKindTintColor } from "@/lib/focusNodeKindColors";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FocusNodeKind } from "@/types/focusNode";
import type { IconProps } from "@solar-icons/react-native/lib/types";

const KIND_ICONS: Record<FocusNodeKind, ComponentType<IconProps>> = {
  class: ClassKindIcon,
  library: LibraryKindIcon,
  gym: GymKindIcon,
  custom: MagicStick,
};

const DOT_COLORS: Record<Exclude<FocusHabitDotOutcome, "today">, string> = {
  completed: "#21C16B",
  skipped: "#9CA3AF",
  missed: "#C97B4A",
  upcoming: "#E5E7EB",
};

function dotColor(outcome: FocusHabitDotOutcome, kind: FocusHabitSummary["kind"]): string {
  if (outcome === "today") {
    return getKindAccentColor(kind);
  }
  return DOT_COLORS[outcome];
}

type FocusHabitCardProps = {
  habit: FocusHabitSummary;
};

export function FocusHabitCard({ habit }: FocusHabitCardProps) {
  const colors = useThemeColors();
  const KindIcon = KIND_ICONS[habit.kind] ?? MagicStick;
  const accentColor = getKindAccentColor(habit.kind);

  const streakCopy =
    habit.weekStreak >= 2
      ? `${habit.weekStreak} weeks in a row`
      : habit.totalSessions > 0
        ? `${habit.totalSessions} session${habit.totalSessions === 1 ? "" : "s"} logged`
        : "Just getting started";

  return (
    <NeuCard
      contentStyle={{
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: ICON_TILE_RADIUS_MD,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: getKindTintColor(habit.kind),
          }}
        >
          <KindIcon size={20} color={accentColor} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 15,
              lineHeight: 20,
              color: colors.foreground,
            }}
          >
            {habit.title}
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            {streakCopy}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        {habit.recentDots.map((outcome, index) => (
          <View
            key={`${habit.nodeId}-${index}`}
            style={{
              flex: 1,
              maxWidth: 28,
              height: 8,
              borderRadius: 4,
              backgroundColor: dotColor(outcome, habit.kind),
              opacity: outcome === "upcoming" ? 0.55 : 1,
            }}
          />
        ))}
      </View>
    </NeuCard>
  );
}

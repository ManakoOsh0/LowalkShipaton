/**
 * Home screen header — weekday, date subtitle, and streak count.
 */
import { Text, View } from "react-native";

import { StreakFlame } from "@/components/StreakFlame";
import { PILL_RADIUS } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";

const SCREEN_PADDING = 16;

type HomeHeaderProps = {
  streak: number;
};

function formatWeekday(date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function formatDateSubtitle(date = new Date()): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

function StreakPill({ streak }: { streak: number }) {
  const colors = useThemeColors();
  const label = `${streak} day streak`;

  return (
    <View
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: PILL_RADIUS,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardStroke,
        borderCurve: "continuous",
      }}
    >
      <StreakFlame height={20} />

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <Text
          selectable
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            lineHeight: 20,
            marginTop: 2,
            color: colors.foreground,
            fontVariant: ["tabular-nums"],
          }}
        >
          {streak}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Medium",
            fontSize: 12,
            lineHeight: 16,
            color: colors.foregroundSubtle,
          }}
        >
          day streak
        </Text>
      </View>
    </View>
  );
}

export function HomeHeader({ streak }: HomeHeaderProps) {
  const colors = useThemeColors();
  const today = new Date();
  const weekday = formatWeekday(today);
  const dateSubtitle = formatDateSubtitle(today);

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={`${weekday}, ${dateSubtitle}`}
      style={{
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 14,
        paddingBottom: 20,
        gap: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Text
          style={{
            flexShrink: 1,
            fontFamily: "Poppins-Bold",
            fontSize: 22,
            lineHeight: 28,
            color: colors.foreground,
          }}
        >
          {weekday}
        </Text>

        <StreakPill streak={streak} />
      </View>

      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        {dateSubtitle}
      </Text>
    </View>
  );
}

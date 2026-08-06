/**
 * Home screen header — weekday, date subtitle, and streak pill (opens Activity).
 */
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { StreakFlame } from "@/components/StreakFlame";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PILL_RADIUS } from "@/lib/cardStyle";
import { SCREEN_PADDING } from "@/lib/layout";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";

type HomeHeaderProps = {
  streak: number;
  /** Opens Activity — the streak pill is the single stats entry point. */
  onStreakPress?: () => void;
};

function formatWeekday(date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function formatDateSubtitle(date = new Date()): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

function StreakBadge({ streak, onPress }: { streak: number; onPress?: () => void }) {
  const colors = useThemeColors();
  const label = `${streak} day streak`;

  return (
    <NeuCard
      borderRadius={PILL_RADIUS}
      shadowVariant="sm"
      style={{ alignSelf: "flex-start" }}
      contentStyle={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={onPress ? `${label}. View activity.` : label}
    >
      <StreakFlame height={18} color={colors.streak} />
      <Text
        selectable
        style={{
          fontFamily: FONT_FAMILY.bold,
          fontSize: 16,
          lineHeight: 20,
          color: colors.streak,
          fontVariant: ["tabular-nums"],
        }}
      >
        {streak}
      </Text>
    </NeuCard>
  );
}

export function HomeHeader({ streak, onStreakPress }: HomeHeaderProps) {
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
        paddingTop: 10,
        paddingBottom: 12,
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
          style={textStyle("h3", colors.foreground, {
            flexShrink: 1,
            fontFamily: FONT_FAMILY.bold,
          })}
          numberOfLines={1}
        >
          {weekday}
        </Text>

        <StreakBadge streak={streak} onPress={onStreakPress} />
      </View>

      <Text style={textStyle("bodySm", colors.muted)}>{dateSubtitle}</Text>
    </View>
  );
}

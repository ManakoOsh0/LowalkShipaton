/**
 * StatsDayList — flat day rows under the chart (Brick-style, not card tiles).
 */
import { Text, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_MD } from "@/lib/cardStyle";
import { formatFocusDuration } from "@/lib/periodStats";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";
import type { PeriodDayStat } from "@/types/stats";

type StatsDayListProps = {
  days: PeriodDayStat[];
  /** Max minutes in the list — scales the thin progress bars. */
  maxFocusMinutes: number;
};

export function StatsDayList({ days, maxFocusMinutes }: StatsDayListProps) {
  const colors = useThemeColors();

  if (days.length === 0) return null;

  const ceiling = Math.max(maxFocusMinutes, 1);

  return (
    <View
      style={{
        borderRadius: CARD_RADIUS_MD,
        borderCurve: "continuous",
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      {days.map((day, index) => {
        const fill = Math.min(1, day.focusMinutes / ceiling);
        const sessionLabel =
          day.sessions === 1 ? "1 session" : `${day.sessions} sessions`;

        return (
          <View
            key={day.dateIso}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={{
                  fontFamily: FONT_FAMILY.semibold,
                  fontSize: 11,
                  lineHeight: 14,
                  letterSpacing: 1.2,
                  color: colors.muted,
                }}
              >
                {day.label}
              </Text>
              <Text
                style={{
                  fontFamily: FONT_FAMILY.bold,
                  fontSize: 26,
                  lineHeight: 32,
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatFocusDuration(day.focusMinutes)}
              </Text>
              <Text style={textStyle("bodySm", colors.muted)}>{sessionLabel}</Text>
            </View>

            <View
              style={{
                width: 64,
                height: 4,
                borderRadius: 999,
                backgroundColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${Math.max(fill * 100, day.focusMinutes > 0 ? 10 : 0)}%`,
                  borderRadius: 999,
                  backgroundColor: colors.foreground,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

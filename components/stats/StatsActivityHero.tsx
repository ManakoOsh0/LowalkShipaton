/**
 * Period consistency recap — sessions first, then hours, show-up days, and places.
 * Period picker stays here so week / month / year share one story shape.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { StreakFlame } from "@/components/StreakFlame";
import { useThemeColors } from "@/hooks/useThemeColors";
import { formatFocusDuration } from "@/lib/periodStats";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";
import type { ConsistencyRecap } from "@/types/stats";

type StatsActivityHeroProps = {
  recap: ConsistencyRecap;
  streak: number;
  onPressPeriod: () => void;
};

export function StatsActivityHero({
  recap,
  streak,
  onPressPeriod,
}: StatsActivityHeroProps) {
  const colors = useThemeColors();
  const sessionNoun = recap.sessionsCompleted === 1 ? "session" : "sessions";
  const dayNoun = recap.plannedDays === 1 ? "day" : "days";
  const locationNoun = recap.locationCount === 1 ? "location" : "locations";
  const hasPlan = recap.sessionsPlanned > 0;

  return (
    <View style={{ gap: 28, paddingTop: 4 }}>
      <View style={{ gap: 10, alignItems: "center" }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Change period, currently ${recap.title}`}
          onPress={onPressPeriod}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 4,
            paddingHorizontal: 8,
          }}
        >
          <Text
            style={{
              fontFamily: FONT_FAMILY.bold,
              fontSize: 28,
              lineHeight: 34,
              color: colors.foreground,
            }}
          >
            {recap.title}
          </Text>
          <Ionicons name="chevron-down" size={22} color={colors.muted} />
        </PressableScale>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StreakFlame height={14} color={colors.streak} />
          <Text
            style={{
              fontFamily: FONT_FAMILY.semibold,
              fontSize: 14,
              lineHeight: 18,
              color: colors.streak,
              fontVariant: ["tabular-nums"],
            }}
          >
            {streak}-day streak
          </Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: FONT_FAMILY.bold,
            fontSize: 56,
            lineHeight: 62,
            letterSpacing: -1.5,
            color: colors.foreground,
            fontVariant: ["tabular-nums"],
          }}
        >
          {recap.sessionsCompleted}
        </Text>
        <Text
          style={{
            fontFamily: FONT_FAMILY.medium,
            fontSize: 15,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          {sessionNoun} completed
        </Text>
        {hasPlan ? (
          <View style={{ gap: 4 }}>
            <Text style={textStyle("bodyMd", colors.foregroundSubtle)}>
              {formatFocusDuration(recap.focusMinutes)} focused
            </Text>
            <Text style={textStyle("bodyMd", colors.foregroundSubtle)}>
              {recap.sessionCompletionPercent}% of planned sessions
            </Text>
            {recap.plannedDays > 0 ? (
              <Text style={textStyle("bodyMd", colors.foregroundSubtle)}>
                {recap.showedUpDays}/{recap.plannedDays} planned {dayNoun} showed up
                {recap.locationCount > 0
                  ? ` · ${recap.locationCount} ${locationNoun}`
                  : ""}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={textStyle("bodyMd", colors.muted)}>{recap.emptyMessage}</Text>
        )}
      </View>
    </View>
  );
}

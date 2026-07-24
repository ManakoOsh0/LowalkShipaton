/**
 * Consistency hero — answers "Am I becoming more consistent?" with streak and calm copy.
 * No percentages or analytics tiles; motivation-first headline only.
 */
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { StreakFlame } from "@/components/StreakFlame";
import { CARD_RADIUS_XL } from "@/lib/cardStyle";
import type { ConsistencyStats } from "@/lib/consistencyStats";
import { useThemeColors } from "@/hooks/useThemeColors";

type ConsistencyHeroProps = Pick<
  ConsistencyStats,
  "headline" | "subline" | "dayStreak" | "totalSessions" | "activeDaysLast30"
>;

export function ConsistencyHero({
  headline,
  subline,
  dayStreak,
  totalSessions,
  activeDaysLast30,
}: ConsistencyHeroProps) {
  const colors = useThemeColors();

  return (
    <NeuCard
      borderRadius={CARD_RADIUS_XL}
      shadowVariant="md"
      contentStyle={{
        paddingHorizontal: 20,
        paddingVertical: 22,
      }}
    >
      {dayStreak > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <StreakFlame height={22} />
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 28,
              lineHeight: 34,
              color: colors.streak,
            }}
          >
            {dayStreak}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 15,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            day streak
          </Text>
        </View>
      ) : null}

      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 22,
          lineHeight: 28,
          color: colors.foreground,
        }}
      >
        {headline}
      </Text>

      <Text
        style={{
          marginTop: 8,
          fontFamily: "Poppins-Regular",
          fontSize: 15,
          lineHeight: 22,
          color: colors.muted,
        }}
      >
        {subline}
      </Text>

      {totalSessions > 0 ? (
        <View
          style={{
            marginTop: 18,
            flexDirection: "row",
            gap: 20,
          }}
        >
          <HeroStat label="Sessions" value={String(totalSessions)} colors={colors} />
          <HeroStat
            label="Active days"
            value={String(activeDaysLast30)}
            hint="last 30 days"
            colors={colors}
          />
        </View>
      ) : null}
    </NeuCard>
  );
}

function HeroStat({
  label,
  value,
  hint,
  colors,
}: {
  label: string;
  value: string;
  hint?: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View>
      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 12,
          lineHeight: 16,
          color: colors.muted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontFamily: "Poppins-Bold",
          fontSize: 20,
          lineHeight: 26,
          color: colors.foreground,
        }}
      >
        {value}
      </Text>
      {hint ? (
        <Text
          style={{
            marginTop: 2,
            fontFamily: "Poppins-Regular",
            fontSize: 11,
            lineHeight: 14,
            color: colors.muted,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

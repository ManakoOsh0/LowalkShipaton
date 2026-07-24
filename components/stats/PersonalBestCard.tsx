/**
 * PersonalBestCard — simple highlight for a single personal record.
 */
import { Text, View } from "react-native";

import { StatsCardShell } from "@/components/stats/StatsCardShell";
import type { PersonalBest } from "@/types/stats";
import { useThemeColors } from "@/hooks/useThemeColors";

type PersonalBestCardProps = {
  best: PersonalBest;
};

export function PersonalBestCard({ best }: PersonalBestCardProps) {
  const colors = useThemeColors();

  return (
    <StatsCardShell>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <Text style={{ fontSize: 24, lineHeight: 28 }}>{best.icon}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            {best.label}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 17,
              lineHeight: 22,
              color: colors.foreground,
            }}
          >
            {best.value}
          </Text>
        </View>
      </View>
    </StatsCardShell>
  );
}

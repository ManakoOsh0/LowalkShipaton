/**
 * StatCard — lifetime stat tile for the 2×2 grid on the Statistics tab.
 */
import { Text, View } from "react-native";

import { StatsCardShell } from "@/components/stats/StatsCardShell";
import { useCountUp } from "@/hooks/useCountUp";
import { useThemeColors } from "@/hooks/useThemeColors";

type StatCardProps = {
  icon: string;
  value: string;
  label: string;
  numericValue?: number;
};

export function StatCard({ icon, value, label, numericValue }: StatCardProps) {
  const colors = useThemeColors();
  const animated = useCountUp(numericValue ?? 0);
  const displayValue =
    numericValue != null ? String(animated) : value;

  return (
    <StatsCardShell style={{ flex: 1, minWidth: "46%" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 20,
          alignItems: "center",
          minHeight: 128,
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 28, lineHeight: 32 }}>{icon}</Text>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 26,
            lineHeight: 32,
            color: colors.foreground,
          }}
        >
          {displayValue}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      </View>
    </StatsCardShell>
  );
}

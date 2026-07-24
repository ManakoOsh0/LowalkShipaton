/**
 * InsightCard — conversational tip on the Statistics tab.
 */
import { Text, View } from "react-native";

import { StatsCardShell } from "@/components/stats/StatsCardShell";
import { useThemeColors } from "@/hooks/useThemeColors";

type InsightCardProps = {
  message: string;
};

export function InsightCard({ message }: InsightCardProps) {
  const colors = useThemeColors();

  return (
    <StatsCardShell>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <Text style={{ fontSize: 22, lineHeight: 26 }}>💡</Text>
        <Text
          style={{
            flex: 1,
            fontFamily: "Poppins-Regular",
            fontSize: 15,
            lineHeight: 22,
            color: colors.foreground,
          }}
        >
          {message}
        </Text>
      </View>
    </StatsCardShell>
  );
}

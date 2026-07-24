/**
 * StatsSectionHeader — section title with optional subtitle for the Statistics tab.
 */
import { Text, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type StatsSectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function StatsSectionHeader({ title, subtitle }: StatsSectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={{ gap: 4, marginBottom: 12 }}>
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 16,
          lineHeight: 22,
          color: colors.foreground,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

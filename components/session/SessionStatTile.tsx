/**
 * SessionStatTile — compact metric card for the session detail stats row.
 */
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { useThemeColors } from "@/hooks/useThemeColors";

type SessionStatTileProps = {
  icon: ReactNode;
  value: string;
  label: string;
};

export function SessionStatTile({ icon, value, label }: SessionStatTileProps) {
  const colors = useThemeColors();

  return (
    <NeuCard
      borderRadius={16}
      style={{ flex: 1 }}
      contentStyle={{
        paddingHorizontal: 10,
        paddingVertical: 14,
        alignItems: "center",
        gap: 6,
        minHeight: 108,
        justifyContent: "center",
      }}
    >
      {icon}
      <Text
        selectable
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 22,
          lineHeight: 26,
          color: colors.foreground,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 11,
          lineHeight: 14,
          color: colors.muted,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </NeuCard>
  );
}

/**
 * HeroMetaBar — top meta row: kind chip, live clock, status chip.
 */
import { View } from "react-native";

import { TrmnlText } from "@/components/trmnl/TrmnlText";
import type { HeroMetaChip } from "@/types/dashboard";

type HeroMetaBarProps = {
  metaLeft: HeroMetaChip;
  metaRight: HeroMetaChip;
  clockLabel: string;
};

export function HeroMetaBar({ metaLeft, metaRight, clockLabel }: HeroMetaBarProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 12,
      }}
    >
      <TrmnlText variant="labelSmall" color="muted" numberOfLines={1}>
        {metaLeft.label}
      </TrmnlText>
      <TrmnlText variant="labelSmall" numberOfLines={1}>
        {clockLabel}
      </TrmnlText>
      <TrmnlText variant="labelSmall" color="muted" numberOfLines={1}>
        {metaRight.label}
      </TrmnlText>
    </View>
  );
}

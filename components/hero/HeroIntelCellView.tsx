/**
 * HeroIntelCellView — shared symmetric cell for intel grid and active context rails.
 */
import { View } from "react-native";

import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { HERO_ZONE_INTEL_HEIGHT } from "@/lib/heroEink";

export type HeroIntelCellViewProps = {
  label: string;
  value: string;
  subline?: string;
  borderedLeft?: boolean;
};

export function HeroIntelCellView({
  label,
  value,
  subline,
  borderedLeft = false,
}: HeroIntelCellViewProps) {
  const displayValue = subline ? `${value} · ${subline}` : value;

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        height: HERO_ZONE_INTEL_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        ...(borderedLeft
          ? { borderLeftWidth: 1, borderLeftColor: "rgba(0, 0, 0, 0.12)" }
          : {}),
      }}
    >
      <TrmnlText
        variant="labelSmall"
        color="mutedWell"
        numberOfLines={1}
        style={{ textAlign: "center", fontSize: 14, lineHeight: 14 }}
      >
        {label}
      </TrmnlText>
      <TrmnlText
        variant="labelSmall"
        numberOfLines={1}
        style={{ marginTop: 1, textAlign: "center", fontSize: 14, lineHeight: 14 }}
      >
        {displayValue}
      </TrmnlText>
    </View>
  );
}

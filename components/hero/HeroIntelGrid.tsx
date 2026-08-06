/**
 * HeroIntelGrid — symmetric inline intel row with centered columns.
 */
import { View } from "react-native";

import { HeroIntelCellView } from "@/components/hero/HeroIntelCellView";
import type { HeroIntelCell } from "@/types/dashboard";

type HeroIntelGridProps = {
  cells: HeroIntelCell[];
};

export function HeroIntelGrid({ cells }: HeroIntelGridProps) {
  if (cells.length === 0) return null;

  const displayCells = cells.slice(0, 2);

  return (
    <View style={{ flexDirection: "row", width: "100%" }}>
      {displayCells.map((cell, index) => (
        <HeroIntelCellView
          key={`${cell.label}-${index}`}
          label={cell.label}
          value={cell.value}
          borderedLeft={index > 0}
        />
      ))}
    </View>
  );
}

/**
 * HeroUpcomingStrip — next sessions only (not the current one); max 1 row in hero.
 */
import { View } from "react-native";

import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { HERO_ZONE_UPCOMING_HEIGHT } from "@/lib/heroEink";
import type { HeroUpcomingRow } from "@/types/dashboard";

type HeroUpcomingStripProps = {
  rows: HeroUpcomingRow[];
};

export function HeroUpcomingStrip({ rows }: HeroUpcomingStripProps) {
  const upcomingOnly = rows.filter((row) => row.status !== "current").slice(0, 1);
  if (upcomingOnly.length === 0) return null;

  return (
    <View
      style={{
        height: HERO_ZONE_UPCOMING_HEIGHT,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
      }}
    >
      <TrmnlText
        variant="labelSmall"
        color="mutedWell"
        numberOfLines={1}
        style={{ textAlign: "center", fontSize: 14, lineHeight: 14 }}
      >
        Then today
      </TrmnlText>
      {upcomingOnly.map((row, index) => (
        <TrmnlText
          key={`${row.timeLabel}-${row.title}-${index}`}
          variant="labelSmall"
          numberOfLines={1}
          style={{ textAlign: "center", fontSize: 14, lineHeight: 14 }}
        >
          {`${row.timeLabel} · ${row.title}`}
        </TrmnlText>
      ))}
    </View>
  );
}

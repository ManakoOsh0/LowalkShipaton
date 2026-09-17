/**
 * HeroUpNextPanel — scannable next-session block: what, when, and where.
 */
import { View } from "react-native";

import { HeroFlipClock } from "@/components/hero/HeroFlipClock";
import { HeroMetricGrid } from "@/components/HeroMetricGrid";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { formatStartClock24 } from "@/lib/time";
import type { HeroTravelStats, HeroUpNextSnapshot } from "@/types/dashboard";

type HeroUpNextPanelProps = {
  upNext: HeroUpNextSnapshot;
  travelStats?: HeroTravelStats | null;
};

export function HeroUpNextPanel({ upNext, travelStats }: HeroUpNextPanelProps) {
  return (
    <View style={{ gap: 10 }}>
      <TrmnlText variant="title" numberOfLines={2} style={{ textAlign: "center" }}>
        {upNext.sessionTitle}
      </TrmnlText>

      <HeroFlipClock
        countdownLabel={formatStartClock24(upNext.timeLabel)}
        static
      />

      <TrmnlText variant="description" color="muted" style={{ textAlign: "center" }}>
        {upNext.startsInLabel}
      </TrmnlText>

      {travelStats ? <HeroMetricGrid stats={travelStats} /> : null}
    </View>
  );
}

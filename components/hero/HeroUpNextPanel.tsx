/**
 * HeroUpNextPanel — scannable next-session block: what, when, and where.
 */
import { View } from "react-native";

import { HeroMetricGrid } from "@/components/HeroMetricGrid";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { HERO_EINK_BUTTON_RADIUS } from "@/lib/heroEink";
import type { HeroTravelStats, HeroUpNextSnapshot } from "@/types/dashboard";

type HeroUpNextPanelProps = {
  upNext: HeroUpNextSnapshot;
  travelStats?: HeroTravelStats | null;
};

function DetailCell({
  label,
  value,
  borderedLeft = false,
}: {
  label: string;
  value: string;
  borderedLeft?: boolean;
}) {
  return (
    <View className={`flex-1 p-2 ${borderedLeft ? "border-l border-trmnl-ink" : ""}`}>
      <TrmnlText variant="labelSmall" color="muted">
        {label}
      </TrmnlText>
      <TrmnlText variant="value" numberOfLines={2} style={{ marginTop: 2 }}>
        {value}
      </TrmnlText>
    </View>
  );
}

export function HeroUpNextPanel({ upNext, travelStats }: HeroUpNextPanelProps) {
  return (
    <View style={{ gap: 10 }}>
      <TrmnlText variant="title" numberOfLines={2} style={{ textAlign: "center" }}>
        {upNext.sessionTitle}
      </TrmnlText>

      <View
        className="flex-row overflow-hidden border border-trmnl-ink"
        style={{ borderRadius: HERO_EINK_BUTTON_RADIUS }}
      >
        <DetailCell label="Time" value={upNext.timeLabel} />
        <DetailCell label="Where" value={upNext.locationLabel} borderedLeft />
      </View>

      <TrmnlText variant="description" color="muted" style={{ textAlign: "center" }}>
        {upNext.startsInLabel}
      </TrmnlText>

      {travelStats ? <HeroMetricGrid stats={travelStats} /> : null}
    </View>
  );
}

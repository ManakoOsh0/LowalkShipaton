/**
 * HeroMetricGrid — TRMNL Classic stats row (label over value).
 */
import { View } from "react-native";

import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { HERO_EINK_BUTTON_RADIUS } from "@/lib/heroEink";
import type { HeroTravelStats } from "@/types/dashboard";

type HeroMetricGridProps = {
  stats: HeroTravelStats;
};

function MetricCell({
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
      <TrmnlText variant="value" style={{ marginTop: 2 }}>
        {value}
      </TrmnlText>
    </View>
  );
}

export function HeroMetricGrid({ stats }: HeroMetricGridProps) {
  return (
    <View
      className="flex-row overflow-hidden border border-trmnl-ink"
      style={{ borderRadius: HERO_EINK_BUTTON_RADIUS }}
    >
      <MetricCell label="Distance" value={stats.distance} />
      <MetricCell label="Est. time" value={stats.duration} borderedLeft />
    </View>
  );
}

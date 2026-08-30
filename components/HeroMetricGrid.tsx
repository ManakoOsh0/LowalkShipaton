/**
 * HeroMetricGrid — TRMNL Classic stats row (label over value).
 */
import { View } from "react-native";

import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useHeroTheme } from "@/hooks/useHeroTheme";
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
  const theme = useHeroTheme();

  return (
    <View
      style={{
        flex: 1,
        padding: 8,
        borderLeftWidth: borderedLeft ? 1 : 0,
        borderColor: theme.textPrimary,
      }}
    >
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
  const theme = useHeroTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.textPrimary,
        borderRadius: HERO_EINK_BUTTON_RADIUS,
      }}
    >
      <MetricCell label="Distance" value={stats.distance} />
      <MetricCell label="Est. time" value={stats.duration} borderedLeft />
    </View>
  );
}

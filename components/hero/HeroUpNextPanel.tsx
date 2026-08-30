/**
 * HeroUpNextPanel — scannable next-session block: what, when, and where.
 */
import { View } from "react-native";

import { HeroMetricGrid } from "@/components/HeroMetricGrid";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useHeroTheme } from "@/hooks/useHeroTheme";
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
      <TrmnlText variant="value" numberOfLines={2} style={{ marginTop: 2 }}>
        {value}
      </TrmnlText>
    </View>
  );
}

export function HeroUpNextPanel({ upNext, travelStats }: HeroUpNextPanelProps) {
  const theme = useHeroTheme();

  return (
    <View style={{ gap: 10 }}>
      <TrmnlText variant="title" numberOfLines={2} style={{ textAlign: "center" }}>
        {upNext.sessionTitle}
      </TrmnlText>

      <View
        style={{
          flexDirection: "row",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.textPrimary,
          borderRadius: HERO_EINK_BUTTON_RADIUS,
        }}
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

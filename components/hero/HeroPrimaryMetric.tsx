/**
 * HeroPrimaryMetric — Framework value + optional flip-clock countdown.
 */
import { View } from "react-native";

import { HeroFlipClock } from "@/components/hero/HeroFlipClock";
import { parseClockPair } from "@/lib/heroFlipClock";
import { HeroVerifyingPulse } from "@/components/hero/HeroVerifyingPulse";
import { TrmnlDescription } from "@/components/trmnl/TrmnlDescription";
import { TrmnlValue } from "@/components/trmnl/TrmnlValue";
import type { HeroDisplayPhase } from "@/lib/heroDisplay";
import { resolveHeroValueSize, TRMNL_GAP } from "@/lib/trmnlFramework";

type HeroPrimaryMetricProps = {
  metric: string;
  suffix?: string;
  phase: HeroDisplayPhase;
  useCountdownTypography?: boolean;
  verifyPulse?: boolean;
};

export function HeroPrimaryMetric({
  metric,
  suffix,
  phase,
  useCountdownTypography = false,
  verifyPulse = false,
}: HeroPrimaryMetricProps) {
  const valueSize = resolveHeroValueSize(phase);
  const showFlipClock =
    useCountdownTypography && parseClockPair(metric) != null;

  return (
    <View style={{ width: "100%", alignItems: "center", gap: TRMNL_GAP.xsmall }}>
      <HeroVerifyingPulse active={verifyPulse}>
        {showFlipClock ? (
          <HeroFlipClock countdownLabel={metric} compact={valueSize === "small"} />
        ) : (
          <TrmnlValue size={valueSize} tabular>
            {metric}
          </TrmnlValue>
        )}
      </HeroVerifyingPulse>

      {suffix ? (
        <TrmnlDescription size="base" muted>
          {suffix}
        </TrmnlDescription>
      ) : null}
    </View>
  );
}

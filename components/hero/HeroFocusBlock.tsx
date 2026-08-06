/**
 * HeroFocusBlock — single dominant metric for non-active hero states.
 */
import Animated from "react-native-reanimated";

import { HeroTimerWell } from "@/components/hero/HeroTimerWell";
import { heroFocusEntering } from "@/lib/heroMotion";
import type { HeroCenterMetric } from "@/types/dashboard";

type HeroFocusBlockProps = {
  center: HeroCenterMetric;
  contextLabel?: string;
  compact?: boolean;
  motionKey?: string;
  reduceMotion?: boolean;
  verifyPulse?: boolean;
};

export function HeroFocusBlock({
  center,
  contextLabel,
  compact = false,
  motionKey,
  reduceMotion = false,
  verifyPulse = false,
}: HeroFocusBlockProps) {
  const showCountdown = Boolean(center.countdownLabel);

  return (
    <Animated.View
      key={motionKey ? `${motionKey}-focus` : undefined}
      entering={heroFocusEntering(reduceMotion)}
      style={{ width: "100%" }}
    >
      <HeroTimerWell
        contextLabel={contextLabel}
        countdownLabel={showCountdown ? (center.countdownLabel ?? undefined) : undefined}
        headline={showCountdown ? undefined : center.headline}
        subline={center.subline}
        progressRatio={center.progressRatio}
        compact={compact}
        verifyPulse={verifyPulse}
      />
    </Animated.View>
  );
}

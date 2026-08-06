/**
 * HeroTimerWell — hero-scale countdown on the gray display well.
 * Uses BlockKie (TRMNL countdown) so the timer matches the card type system.
 */
import { View } from "react-native";

import { HeroCounterProgress } from "@/components/hero/HeroCounterProgress";
import { HeroFlipClock } from "@/components/hero/HeroFlipClock";
import { HeroVerifyingPulse } from "@/components/hero/HeroVerifyingPulse";
import { HeroInsetEdge } from "@/components/hero/HeroInsetEdge";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { TRMNL_THEME } from "@/lib/heroEink";

type HeroTimerWellProps = {
  contextLabel?: string;
  countdownLabel?: string;
  headline?: string;
  subline?: string;
  progressRatio?: number | null;
  compact?: boolean;
  verifyPulse?: boolean;
};

export function HeroTimerWell({
  contextLabel,
  countdownLabel,
  headline,
  subline,
  progressRatio,
  compact = false,
  verifyPulse = false,
}: HeroTimerWellProps) {
  const showCountdown = Boolean(countdownLabel);
  const progressFill = Math.min(Math.max(progressRatio ?? 0, 0), 1);
  const showProgress =
    !showCountdown &&
    progressRatio != null &&
    progressRatio >= 0;

  const timerBody = showCountdown ? (
    <HeroFlipClock countdownLabel={countdownLabel ?? ""} compact={compact} />
  ) : headline ? (
    <TrmnlText
      variant="title"
      numberOfLines={compact ? 1 : 2}
      style={{
        textAlign: "center",
        fontSize: compact ? 16 : 20,
        lineHeight: compact ? 18 : 22,
      }}
    >
      {headline}
    </TrmnlText>
  ) : null;

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        gap: compact ? 2 : 3,
        paddingVertical: compact ? 0 : 2,
      }}
    >
      {contextLabel ? (
        <TrmnlText
          variant="labelSmall"
          color="mutedWell"
          numberOfLines={1}
          style={{ textAlign: "center" }}
        >
          {contextLabel}
        </TrmnlText>
      ) : null}

      <HeroVerifyingPulse active={verifyPulse}>
        {showCountdown ? (
          timerBody
        ) : (
          <View
            style={{
              alignSelf: "center",
              borderRadius: 10,
              borderCurve: "continuous",
              paddingVertical: compact ? 4 : 6,
              paddingHorizontal: compact ? 10 : 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: TRMNL_THEME.plaque,
              overflow: "hidden",
            }}
          >
            <HeroInsetEdge edgeSize={8} opacity={0.14} />
            <View style={{ zIndex: 1 }}>{timerBody}</View>
          </View>
        )}
      </HeroVerifyingPulse>

      {subline ? (
        <TrmnlText
          variant="labelSmall"
          color="mutedWell"
          numberOfLines={compact ? 1 : 2}
          style={{ textAlign: "center" }}
        >
          {subline}
        </TrmnlText>
      ) : null}

      {showProgress ? (
        <View style={{ width: "100%", marginTop: compact ? 2 : 3 }}>
          <HeroCounterProgress progressRatio={progressFill} />
        </View>
      ) : null}
    </View>
  );
}

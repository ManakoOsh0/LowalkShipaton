/**
 * HeroContextRails — LAST / center metric / NEXT layout inspired by Desk Rhythm.
 */
import { Platform, Text, View } from "react-native";

import { HeroCounterProgress } from "@/components/hero/HeroCounterProgress";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useHeroTheme } from "@/hooks/useHeroTheme";
import {
  HERO_DIGITAL_CLOCK_LETTER_SPACING,
  HERO_DIGITAL_CLOCK_LINE_HEIGHT,
  HERO_DIGITAL_CLOCK_SIZE,
  HERO_ZONE_RAILS_HEIGHT,
} from "@/lib/heroEink";
import { FONT_FAMILY } from "@/theme/fonts";
import type { HeroCenterMetric, HeroContextRail } from "@/types/dashboard";

type HeroContextRailsProps = {
  leftRail?: HeroContextRail;
  rightRail?: HeroContextRail;
  center: HeroCenterMetric;
};

function RailColumn({ rail }: { rail: HeroContextRail }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
      <TrmnlText variant="labelSmall" color="muted" numberOfLines={1}>
        {rail.label}
      </TrmnlText>
      <TrmnlText variant="value" numberOfLines={1}>
        {rail.headline}
      </TrmnlText>
      <TrmnlText variant="labelSmall" color="muted" numberOfLines={1}>
        {rail.subline}
      </TrmnlText>
    </View>
  );
}

function CenterMetric({ center }: { center: HeroCenterMetric }) {
  const theme = useHeroTheme();
  const showCountdown = Boolean(center.countdownLabel);
  const progressFill = Math.min(Math.max(center.progressRatio ?? 0, 0), 1);
  const showProgress = center.progressRatio != null && center.progressRatio >= 0;

  return (
    <View style={{ flex: 1.4, alignItems: "center", gap: 2 }}>
      {showCountdown ? (
        <Text
          allowFontScaling={false}
          selectable
          style={{
            fontFamily: FONT_FAMILY.monoBold,
            fontSize: HERO_DIGITAL_CLOCK_SIZE - 14,
            lineHeight: HERO_DIGITAL_CLOCK_LINE_HEIGHT - 14,
            color: theme.textPrimary,
            letterSpacing: HERO_DIGITAL_CLOCK_LETTER_SPACING,
            fontVariant: ["tabular-nums"],
            ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
          }}
        >
          {center.countdownLabel}
        </Text>
      ) : (
        <TrmnlText variant="title" numberOfLines={1} style={{ fontSize: 20, lineHeight: 22 }}>
          {center.headline}
        </TrmnlText>
      )}
      {center.subline ? (
        <TrmnlText variant="labelSmall" color="muted" numberOfLines={1} style={{ textAlign: "center" }}>
          {center.subline}
        </TrmnlText>
      ) : null}
      {showCountdown && showProgress ? (
        <View style={{ width: "100%", marginTop: 2 }}>
          <HeroCounterProgress progressRatio={progressFill} />
        </View>
      ) : null}
    </View>
  );
}

export function HeroContextRails({ leftRail, rightRail, center }: HeroContextRailsProps) {
  return (
    <View
      style={{
        height: HERO_ZONE_RAILS_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
    >
      {leftRail ? <RailColumn rail={leftRail} /> : <View style={{ flex: 1 }} />}
      <CenterMetric center={center} />
      {rightRail ? <RailColumn rail={rightRail} /> : <View style={{ flex: 1 }} />}
    </View>
  );
}

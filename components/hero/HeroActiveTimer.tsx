/**
 * HeroActiveTimer — bold mono countdown with venue context for in-session hero.
 */
import { Platform, Text, View } from "react-native";

import { HeroCounterProgress } from "@/components/hero/HeroCounterProgress";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import {
    HERO_DIGITAL_CLOCK_LETTER_SPACING,
    HERO_DIGITAL_CLOCK_LINE_HEIGHT,
    HERO_DIGITAL_CLOCK_SIZE,
    HERO_EINK_BUTTON_RADIUS,
    TRMNL_THEME,
} from "@/lib/heroEink";
import { FONT_FAMILY } from "@/theme/fonts";

type HeroActiveTimerProps = {
  countdownLabel: string;
  locationLabel?: string | null;
  subtitle?: string;
  progressRatio?: number | null;
};

export function HeroActiveTimer({
  countdownLabel,
  locationLabel,
  subtitle,
  progressRatio,
}: HeroActiveTimerProps) {
  const showProgress = progressRatio != null && progressRatio >= 0;
  const progressFill = Math.min(Math.max(progressRatio ?? 0, 0), 1);

  return (
    <View style={{ width: "100%", gap: 8 }}>
      <View
        className="border-2 border-trmnl-ink"
        style={{
          borderRadius: HERO_EINK_BUTTON_RADIUS,
          paddingVertical: 10,
          paddingHorizontal: 12,
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text
          allowFontScaling={false}
          selectable
          style={{
            fontFamily: FONT_FAMILY.monoBold,
            fontSize: HERO_DIGITAL_CLOCK_SIZE,
            lineHeight: HERO_DIGITAL_CLOCK_LINE_HEIGHT,
            color: TRMNL_THEME.textPrimary,
            letterSpacing: HERO_DIGITAL_CLOCK_LETTER_SPACING,
            fontVariant: ["tabular-nums"],
            ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
          }}
        >
          {countdownLabel}
        </Text>

        {locationLabel ? (
          <TrmnlText variant="value" numberOfLines={2} style={{ textAlign: "center" }}>
            {locationLabel}
          </TrmnlText>
        ) : null}

        {subtitle ? (
          <TrmnlText variant="description" color="muted" numberOfLines={2} style={{ textAlign: "center" }}>
            {subtitle}
          </TrmnlText>
        ) : null}
      </View>

      {showProgress ? <HeroCounterProgress progressRatio={progressFill} /> : null}
    </View>
  );
}

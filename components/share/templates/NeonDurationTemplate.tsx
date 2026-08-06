import { Text, View } from "react-native";

import {
  ShareAuraStatRow,
  ShareAuraWatermark,
} from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { resolveHeroPrimaryText, shareScale } from "@/lib/shareOverlay";

const AURA_PINK = "#FF2D8A";

function neonSecondaryStats(
  payload: ShareOverlayTemplateProps["payload"],
  heroStat: ShareOverlayTemplateProps["heroStat"],
): [string, string, string] {
  if (heroStat === "duration") {
    const a = payload.onSitePercent != null ? `${payload.onSitePercent}%` : "VERIFIED";
    const b = payload.streak > 0 ? `${payload.streak}D` : `${payload.sessionsCompletedToday}/${payload.dailyGoalTarget}`;
    const c = payload.kindLabel;
    return [a, b, c];
  }

  return [payload.durationLabel, payload.kindLabel, payload.streak > 0 ? `${payload.streak}D` : "TODAY"];
}

export function NeonDurationTemplate({
  payload,
  heroStat,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const heroText = resolveHeroPrimaryText(payload, heroStat);
  const heroFontSize = heroText.length > 9 ? 58 * scale : heroText.length > 6 ? 72 * scale : 92 * scale;
  const secondary = neonSecondaryStats(payload, heroStat);

  return (
    <View style={{ width, height }}>
      <View
        style={{
          position: "absolute",
          top: height * 0.36,
          left: 0,
          right: 0,
          alignItems: "center",
          paddingHorizontal: 20 * scale,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: heroFontSize,
            lineHeight: heroFontSize * 1.02,
            color: AURA_PINK,
            textAlign: "center",
            letterSpacing: -1.5 * scale,
          }}
        >
          {heroText}
        </Text>

        <ShareAuraStatRow stats={secondary} scale={scale} color={AURA_PINK} />
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

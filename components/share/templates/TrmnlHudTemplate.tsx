import { View } from "react-native";

import { ShareAuraHudLabel, ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import {
  formatShareShortDate,
  formatShareTimeOfDay,
  resolveHeroPrimaryText,
  shareScale,
} from "@/lib/shareOverlay";

export function TrmnlHudTemplate({
  payload,
  heroStat,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const inset = 44 * scale;
  const heroValue = resolveHeroPrimaryText(payload, heroStat);
  const paceLine =
    payload.onSitePercent != null ? `${payload.onSitePercent}%` : payload.presenceVerified ? "✓" : "—";

  return (
    <View style={{ width, height }}>
      <ShareAuraHudLabel
        style={{
          position: "absolute",
          top: inset,
          left: inset,
          fontSize: 18 * scale,
          lineHeight: 22 * scale,
        }}
      >
        {payload.kindLabel}
      </ShareAuraHudLabel>

      <ShareAuraHudLabel
        style={{
          position: "absolute",
          top: inset,
          right: inset,
          fontSize: 18 * scale,
          lineHeight: 22 * scale,
          textAlign: "right",
        }}
      >
        {heroValue}
      </ShareAuraHudLabel>

      <View style={{ position: "absolute", bottom: inset + 24 * scale, left: inset }}>
        <ShareAuraHudLabel style={{ fontSize: 15 * scale, lineHeight: 20 * scale }}>
          {formatShareTimeOfDay(payload.completedAt)}
        </ShareAuraHudLabel>
        <ShareAuraHudLabel
          style={{ marginTop: 4 * scale, fontSize: 15 * scale, lineHeight: 20 * scale }}
        >
          {formatShareShortDate(payload.completedAt)}
        </ShareAuraHudLabel>
      </View>

      <View
        style={{ position: "absolute", bottom: inset + 24 * scale, right: inset, alignItems: "flex-end" }}
      >
        <ShareAuraHudLabel style={{ fontSize: 15 * scale, lineHeight: 20 * scale, textAlign: "right" }}>
          {paceLine}
        </ShareAuraHudLabel>
        <ShareAuraHudLabel
          style={{ marginTop: 4 * scale, fontSize: 15 * scale, lineHeight: 20 * scale, textAlign: "right" }}
        >
          {payload.durationLabel}
        </ShareAuraHudLabel>
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

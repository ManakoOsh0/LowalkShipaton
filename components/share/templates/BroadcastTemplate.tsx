import { Text, View } from "react-native";

import { ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { shareScale } from "@/lib/shareOverlay";

/** Breaking-news ticker — dramatic bottom bar flex. */
export function BroadcastTemplate({
  payload,
  showVenue,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const headline =
    payload.hitDailyGoal && payload.streak >= 2
      ? `${payload.streak}-DAY STREAK — ALL SESSIONS DONE`
      : payload.presenceVerified
        ? `VERIFIED AT ${(showVenue && payload.placeLine ? payload.placeLine : payload.kindLabel).toUpperCase()}`
        : `${payload.durationLabel} FOCUS LOCKED IN`;

  return (
    <View style={{ width, height }}>
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: height * 0.14,
          backgroundColor: "#DC2626",
          paddingVertical: 14 * scale,
          borderTopWidth: 3 * scale,
          borderBottomWidth: 3 * scale,
          borderColor: "#FFFFFF",
        }}
      >
        <Text
          style={{
            fontFamily: "SpaceMono-Bold",
            fontSize: 10 * scale,
            letterSpacing: 3,
            color: "#FEE2E2",
            textAlign: "center",
            marginBottom: 6 * scale,
          }}
        >
          ● LIVE
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 16 * scale,
            lineHeight: 22 * scale,
            letterSpacing: 0.5,
            color: "#FFFFFF",
            textAlign: "center",
            paddingHorizontal: 12 * scale,
          }}
          numberOfLines={2}
        >
          {headline}
        </Text>
      </View>

      <Text
        style={{
          position: "absolute",
          top: height * 0.12,
          left: 24 * scale,
          fontFamily: "Poppins-Bold",
          fontSize: 72 * scale,
          lineHeight: 76 * scale,
          color: "rgba(255,255,255,0.12)",
          letterSpacing: -2,
        }}
      >
        {payload.durationLabel}
      </Text>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import {
  ShareAuraVerifiedBadge,
  ShareAuraWatermark,
} from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { shareScale } from "@/lib/shareOverlay";

const DAWN_GOLD = "#FFD60A";

/**
 * Early class moment — "yay I'm in the 7am class."
 * Warm sunrise energy, not athletic stats.
 */
export function EarlyClassTemplate({
  payload,
  showVenue,
  showVerifiedBadge,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);

  return (
    <View style={{ width, height }}>
      <LinearGradient
        colors={["rgba(255, 180, 60, 0.35)", "rgba(255, 120, 40, 0.08)", "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.55,
        }}
      />

      <View
        style={{
          position: "absolute",
          top: height * 0.2,
          left: 0,
          right: 0,
          alignItems: "center",
          paddingHorizontal: 24 * scale,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 46 * scale,
            lineHeight: 52 * scale,
            letterSpacing: 8 * scale,
            color: DAWN_GOLD,
            textAlign: "center",
          }}
        >
          {payload.momentHeadline}
        </Text>

        <View
          style={{
            marginTop: 14 * scale,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 30 * scale,
              letterSpacing: 10 * scale,
              color: "#FFFFFF",
            }}
          >
            {payload.momentSubline}
          </Text>
          {showVerifiedBadge && payload.presenceVerified ? (
            <ShareAuraVerifiedBadge scale={scale * 0.9} />
          ) : null}
        </View>

        {(showVenue && payload.placeLine) || payload.momentTertiary ? (
          <Text
            style={{
              marginTop: 16 * scale,
              fontFamily: "Poppins-Medium",
              fontSize: 16 * scale,
              color: "rgba(255,255,255,0.82)",
              textAlign: "center",
              letterSpacing: 0.5,
            }}
            numberOfLines={2}
          >
            {showVenue && payload.placeLine ? payload.placeLine : payload.momentTertiary}
          </Text>
        ) : null}

        {payload.scheduledTimeLabel ? (
          <Text
            style={{
              marginTop: 10 * scale,
              fontFamily: "Poppins-Regular",
              fontSize: 14 * scale,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            started {payload.scheduledTimeLabel}
          </Text>
        ) : null}
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

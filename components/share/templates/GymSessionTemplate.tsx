import { Text, View } from "react-native";

import {
  ShareAuraStatRow,
  ShareAuraWatermark,
} from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { shareScale } from "@/lib/shareOverlay";

const GYM_PINK = "#FF2D8A";

/** Gym mirror selfie energy — duration flex after a verified session. */
export function GymSessionTemplate({
  payload,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const secondary: [string, string, string] = [
    payload.presenceVerified ? "VERIFIED" : "DONE",
    payload.streak > 0 ? `${payload.streak}D` : payload.durationLabel,
    "GYM",
  ];

  return (
    <View style={{ width, height }}>
      <View
        style={{
          position: "absolute",
          top: height * 0.34,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 22 * scale,
            letterSpacing: 8 * scale,
            color: "#FFFFFF",
            marginBottom: 10 * scale,
          }}
        >
          {payload.momentHeadline}
        </Text>

        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 88 * scale,
            lineHeight: 92 * scale,
            color: GYM_PINK,
            letterSpacing: -2 * scale,
          }}
        >
          {payload.momentSubline}
        </Text>

        <ShareAuraStatRow stats={secondary} scale={scale} color={GYM_PINK} />
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

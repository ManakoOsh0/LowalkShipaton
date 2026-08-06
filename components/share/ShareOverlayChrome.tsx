import { Text, View } from "react-native";

import { shareScale } from "@/lib/shareOverlay";

type ShareOverlayWatermarkProps = {
  width: number;
  visible: boolean;
};

export function ShareOverlayWatermark({ width, visible }: ShareOverlayWatermarkProps) {
  if (!visible) return null;
  const scale = shareScale(width);

  return (
    <Text
      style={{
        position: "absolute",
        bottom: 32 * scale,
        alignSelf: "center",
        fontFamily: "Poppins-Regular",
        fontSize: 11 * scale,
        lineHeight: 14 * scale,
        color: "rgba(255,255,255,0.6)",
        letterSpacing: 1.2,
      }}
    >
      lowalk
    </Text>
  );
}

type ShareOverlayVerifiedBadgeProps = {
  scale: number;
};

export function ShareOverlayVerifiedBadge({ scale }: ShareOverlayVerifiedBadgeProps) {
  return (
    <View
      style={{
        width: 24 * scale,
        height: 24 * scale,
        borderRadius: 12 * scale,
        backgroundColor: "#3B82F6",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8 * scale,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: "Poppins-Bold",
          fontSize: 14 * scale,
          lineHeight: 16 * scale,
          marginTop: -1 * scale,
        }}
      >
        ✓
      </Text>
    </View>
  );
}

export const SHARE_TEXT_SHADOW = {
  textShadowColor: "rgba(0,0,0,0.55)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
} as const;

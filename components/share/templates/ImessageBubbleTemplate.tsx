import { Text, View } from "react-native";

import { ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { formatShareTimeOfDay, shareScale } from "@/lib/shareOverlay";

const BUBBLE_BLUE = "#007AFF";

export function ImessageBubbleTemplate({
  payload,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const bubbleText = `${payload.durationLabel}, ${payload.kindLabel.toLowerCase()}`;
  const subline = `Focused ${formatShareTimeOfDay(payload.completedAt)}`;

  return (
    <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
      <View style={{ alignItems: "flex-end", paddingHorizontal: 32 * scale }}>
        <View
          style={{
            backgroundColor: BUBBLE_BLUE,
            borderRadius: 22 * scale,
            paddingHorizontal: 18 * scale,
            paddingVertical: 11 * scale,
            maxWidth: width * 0.72,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 21 * scale,
              lineHeight: 26 * scale,
              color: "#FFFFFF",
            }}
          >
            {bubbleText}
          </Text>
        </View>

        <View
          style={{
            width: 0,
            height: 0,
            marginRight: 18 * scale,
            borderLeftWidth: 8 * scale,
            borderRightWidth: 8 * scale,
            borderTopWidth: 10 * scale,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: BUBBLE_BLUE,
          }}
        />

        <Text
          style={{
            marginTop: 10 * scale,
            alignSelf: "center",
            fontFamily: "Poppins-Regular",
            fontSize: 14 * scale,
            color: "rgba(255,255,255,0.42)",
          }}
        >
          {subline}
        </Text>
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

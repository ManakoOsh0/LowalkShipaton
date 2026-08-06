import { Text, View } from "react-native";

import {
  ShareAuraVerifiedBadge,
  ShareAuraWatermark,
} from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { formatShareDurationLowercase, shareScale } from "@/lib/shareOverlay";

export function MinimalVerifiedTemplate({
  payload,
  showVerifiedBadge,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const line = `${formatShareDurationLowercase(payload.durationMs)} verified`;

  return (
    <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 36 * scale,
            lineHeight: 42 * scale,
            color: "#FFFFFF",
            letterSpacing: 0.2,
          }}
        >
          {line}
        </Text>
        {showVerifiedBadge && payload.presenceVerified ? (
          <ShareAuraVerifiedBadge scale={scale} />
        ) : null}
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

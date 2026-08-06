import { Text, View } from "react-native";

import { ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { shareScale } from "@/lib/shareOverlay";

const LIBRARY_INK = "#F4EFE6";

/** Library quiet flex — deep work, not hustle culture. */
export function LibrarySessionTemplate({
  payload,
  showVenue,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);

  return (
    <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
      <View style={{ alignItems: "center", paddingHorizontal: 28 * scale, marginTop: height * 0.02 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 26 * scale,
            letterSpacing: 12 * scale,
            color: LIBRARY_INK,
            textAlign: "center",
          }}
        >
          {payload.momentHeadline}
        </Text>

        <Text
          style={{
            marginTop: 18 * scale,
            fontFamily: "Poppins-Bold",
            fontSize: 56 * scale,
            lineHeight: 60 * scale,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          {payload.momentSubline}
        </Text>

        <Text
          style={{
            marginTop: 14 * scale,
            fontFamily: "Poppins-Regular",
            fontSize: 17 * scale,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.72)",
            textAlign: "center",
          }}
          numberOfLines={2}
        >
          {showVenue && payload.placeLine ? payload.placeLine : payload.momentTertiary}
        </Text>
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

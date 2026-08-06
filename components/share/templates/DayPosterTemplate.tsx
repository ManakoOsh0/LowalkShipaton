import { Text, View } from "react-native";

import { ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { FocusNodeKindIcon } from "@/components/FocusNodeKindIcon";
import {
  formatShareWeekdayHeader,
  resolveHeroPrimaryText,
  shareScale,
} from "@/lib/shareOverlay";

const POSTER_BLUE = "#007AFF";

export function DayPosterTemplate({
  payload,
  heroStat,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const weekday = formatShareWeekdayHeader(payload.completedAt);
  const heroText = resolveHeroPrimaryText(payload, heroStat);
  const mainStat =
    heroStat === "duration" || heroStat === "node_title" || heroStat === "streak"
      ? heroText
      : payload.durationLabel;

  return (
    <View style={{ width, height }}>
      <View
        style={{
          position: "absolute",
          top: height * 0.22,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 38 * scale,
            letterSpacing: 14 * scale,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          {weekday}
        </Text>

        <View style={{ marginTop: 18 * scale }}>
          <FocusNodeKindIcon kind={payload.kind} size={56 * scale} color={POSTER_BLUE} />
        </View>

        <Text
          style={{
            marginTop: 16 * scale,
            fontFamily: "Poppins-Bold",
            fontSize: 48 * scale,
            lineHeight: 52 * scale,
            letterSpacing: 1 * scale,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          {mainStat}
        </Text>
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

import { Text, View } from "react-native";

import {
  ShareAuraStrokedHeadline,
  ShareAuraStrokedValue,
  ShareAuraWatermark,
} from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { shareScale } from "@/lib/shareOverlay";

const WEEK_BLUE = "#5B9BFF";

export function WeeklyGridTemplate({
  payload,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const sessionNoun = payload.weekSessionTotal === 1 ? "session" : "sessions";
  const headline = `This Week: ${payload.weekSessionTotal} ${sessionNoun}`;

  return (
    <View style={{ width, height }}>
      <View
        style={{
          position: "absolute",
          top: height * 0.34,
          left: 20 * scale,
          right: 20 * scale,
          alignItems: "center",
        }}
      >
        <ShareAuraStrokedHeadline scale={scale} fontSize={28}>
          {headline}
        </ShareAuraStrokedHeadline>

        <View
          style={{
            marginTop: 20 * scale,
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {payload.weekDays.map((day) => (
            <View key={day.dateIso} style={{ alignItems: "center", flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 11 * scale,
                  color: WEEK_BLUE,
                  fontStyle: "italic",
                  transform: [{ skewX: "-8deg" }],
                  marginBottom: 4 * scale,
                }}
              >
                {day.label}
              </Text>
              <ShareAuraStrokedValue scale={scale} fontSize={22} color={WEEK_BLUE}>
                {day.sessionCount > 0 ? String(day.sessionCount) : "·"}
              </ShareAuraStrokedValue>
            </View>
          ))}
        </View>
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

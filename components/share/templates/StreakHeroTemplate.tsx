import { Text, View } from "react-native";

import { ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { shareScale } from "@/lib/shareOverlay";

const AURA_PINK = "#FF2D8A";

export function StreakHeroTemplate({
  payload,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const streakValue = Math.max(payload.streak, 1);

  return (
    <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 128 * scale,
          lineHeight: 132 * scale,
          color: AURA_PINK,
          letterSpacing: -4 * scale,
        }}
      >
        {streakValue}
      </Text>
      <Text
        style={{
          marginTop: -4 * scale,
          fontFamily: "Poppins-Bold",
          fontSize: 34 * scale,
          lineHeight: 38 * scale,
          color: AURA_PINK,
          letterSpacing: 10 * scale,
        }}
      >
        DAYS
      </Text>

      {payload.hitDailyGoal ? (
        <Text
          style={{
            marginTop: 18 * scale,
            fontFamily: "Poppins-Medium",
            fontSize: 16 * scale,
            color: "rgba(255,255,255,0.88)",
            letterSpacing: 2,
          }}
        >
          ALL SESSIONS DONE
        </Text>
      ) : null}

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

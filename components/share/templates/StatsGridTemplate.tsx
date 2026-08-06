import { Text, View } from "react-native";

import { ShareAuraGridCell, ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { formatShareWeekdayHeader, shareScale } from "@/lib/shareOverlay";

export function StatsGridTemplate({
  payload,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const weekday = formatShareWeekdayHeader(payload.completedAt).slice(0, 3);
  const onSiteValue =
    payload.onSitePercent != null ? `${payload.onSitePercent}%` : payload.presenceVerified ? "✓" : "—";

  return (
    <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 30 * scale,
          color: "#FF3B30",
          letterSpacing: 2 * scale,
          marginBottom: 28 * scale,
        }}
      >
        {weekday}
      </Text>

      <View style={{ gap: 30 * scale }}>
        <View style={{ flexDirection: "row", gap: 56 * scale }}>
          <ShareAuraGridCell value={payload.durationLabel} label="DURATION" scale={scale} />
          <ShareAuraGridCell value={onSiteValue} label="ON-SITE" scale={scale} />
        </View>
        <View style={{ flexDirection: "row", gap: 56 * scale }}>
          <ShareAuraGridCell value={String(payload.streak)} label="STREAK" scale={scale} />
          <ShareAuraGridCell
            value={`${payload.sessionsCompletedToday}/${payload.dailyGoalTarget}`}
            label="TODAY"
            scale={scale}
          />
        </View>
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

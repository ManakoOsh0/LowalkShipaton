import { Text, View } from "react-native";

import { ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { formatShareHudDate, formatShareTimeOfDay, shareScale } from "@/lib/shareOverlay";

function ReceiptLine({
  label,
  value,
  scale,
  bold,
}: {
  label: string;
  value: string;
  scale: number;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12 * scale,
        marginBottom: 8 * scale,
      }}
    >
      <Text
        style={{
          fontFamily: bold ? "SpaceMono-Bold" : "SpaceMono-Regular",
          fontSize: 12 * scale,
          color: "#1A1A1A",
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: bold ? "SpaceMono-Bold" : "SpaceMono-Regular",
          fontSize: 12 * scale,
          color: "#1A1A1A",
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/** TRMNL thermal receipt — proof you showed up, printed on paper. */
export function ReceiptTemplate({
  payload,
  showVenue,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const receiptWidth = width * 0.78;

  return (
    <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
      <View
        style={{
          width: receiptWidth,
          backgroundColor: "#EEEDE8",
          borderRadius: 4 * scale,
          paddingHorizontal: 18 * scale,
          paddingTop: 20 * scale,
          paddingBottom: 24 * scale,
          transform: [{ rotate: "-2deg" }],
          borderWidth: 1,
          borderColor: "#D6D6D0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 * scale },
          shadowOpacity: 0.35,
          shadowRadius: 16 * scale,
        }}
      >
        <Text
          style={{
            fontFamily: "SpaceMono-Bold",
            fontSize: 11 * scale,
            letterSpacing: 2,
            color: "#1A1A1A",
            textAlign: "center",
            marginBottom: 4 * scale,
          }}
        >
          LOWALK FOCUS RECEIPT
        </Text>
        <Text
          style={{
            fontFamily: "SpaceMono-Regular",
            fontSize: 10 * scale,
            color: "#5C5C58",
            textAlign: "center",
            marginBottom: 14 * scale,
          }}
        >
          {formatShareHudDate(payload.completedAt)} · {formatShareTimeOfDay(payload.completedAt)}
        </Text>

        <View
          style={{
            borderTopWidth: 1,
            borderStyle: "dashed",
            borderColor: "#A8A8A2",
            marginBottom: 12 * scale,
          }}
        />

        <ReceiptLine label="SESSION" value={payload.nodeTitle} scale={scale} bold />
        <ReceiptLine label="TYPE" value={payload.kindLabel} scale={scale} />
        <ReceiptLine label="DURATION" value={payload.durationLabel} scale={scale} bold />
        {payload.onSitePercent != null ? (
          <ReceiptLine label="ON-SITE" value={`${payload.onSitePercent}%`} scale={scale} />
        ) : null}
        {showVenue && payload.placeLine ? (
          <ReceiptLine label="VENUE" value={payload.placeLine} scale={scale} />
        ) : null}
        <ReceiptLine label="STREAK" value={`${payload.streak} days`} scale={scale} />
        <ReceiptLine
          label="TODAY"
          value={`${payload.sessionsCompletedToday}/${payload.dailyGoalTarget}`}
          scale={scale}
        />

        <View
          style={{
            borderTopWidth: 1,
            borderStyle: "dashed",
            borderColor: "#A8A8A2",
            marginTop: 8 * scale,
            marginBottom: 12 * scale,
          }}
        />

        <Text
          style={{
            fontFamily: "SpaceMono-Bold",
            fontSize: 13 * scale,
            color: "#F26430",
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          {payload.presenceVerified ? "✓ VERIFIED PRESENCE" : "SESSION LOGGED"}
        </Text>
        <Text
          style={{
            fontFamily: "SpaceMono-Regular",
            fontSize: 9 * scale,
            color: "#8E8E93",
            textAlign: "center",
            marginTop: 8 * scale,
          }}
        >
          THANK YOU FOR SHOWING UP
        </Text>
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

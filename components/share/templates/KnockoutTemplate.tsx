import { Text, View } from "react-native";

import { ShareAuraWatermark } from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { resolveHeroPrimaryText, shareScale } from "@/lib/shareOverlay";

const STROKE_OFFSETS = [
  [-3, -3],
  [3, -3],
  [-3, 3],
  [3, 3],
  [-4, 0],
  [4, 0],
  [0, -4],
  [0, 4],
] as const;

function KnockoutText({
  children,
  fontSize,
  scale,
  letterSpacing = 0,
}: {
  children: string;
  fontSize: number;
  scale: number;
  letterSpacing?: number;
}) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {STROKE_OFFSETS.map(([x, y]) => (
        <Text
          key={`${x}-${y}`}
          style={{
            position: "absolute",
            fontFamily: "Poppins-Bold",
            fontSize,
            letterSpacing,
            color: "#FFFFFF",
            transform: [{ translateX: x * scale }, { translateY: y * scale }],
          }}
        >
          {children}
        </Text>
      ))}
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize,
          letterSpacing,
          color: "rgba(0,0,0,0.15)",
        }}
      >
        {children}
      </Text>
    </View>
  );
}

/** Hollow oversized type — the photo shows through the letters. */
export function KnockoutTemplate({
  payload,
  heroStat,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const heroText = resolveHeroPrimaryText(payload, heroStat);
  const fontSize = heroText.length > 10 ? 52 * scale : heroText.length > 6 ? 68 * scale : 88 * scale;
  const headline =
    heroStat === "node_title" ? heroText : heroStat === "streak" ? heroText : "SHOWED UP";

  return (
    <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
      <KnockoutText fontSize={fontSize} scale={scale} letterSpacing={2 * scale}>
        {headline}
      </KnockoutText>
      <Text
        style={{
          marginTop: 18 * scale,
          fontFamily: "Poppins-SemiBold",
          fontSize: 18 * scale,
          letterSpacing: 6 * scale,
          color: "rgba(255,255,255,0.85)",
          textTransform: "uppercase",
        }}
      >
        {payload.durationLabel} · {payload.kindLabel}
      </Text>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}

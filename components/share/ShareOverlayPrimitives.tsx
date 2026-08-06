import type { ReactNode } from "react";
import { Text, View, type TextStyle } from "react-native";

import { shareScale } from "@/lib/shareOverlay";

/** Aura-style bottom mark — light serif feel, never competes with the stats. */
export function ShareAuraWatermark({ width, visible }: { width: number; visible: boolean }) {
  if (!visible) return null;
  const scale = shareScale(width);

  return (
    <Text
      style={{
        position: "absolute",
        bottom: 28 * scale,
        alignSelf: "center",
        fontFamily: "VarelaRound-Regular",
        fontSize: 13 * scale,
        color: "rgba(255,255,255,0.72)",
        letterSpacing: 0.3,
      }}
    >
      lowalk
    </Text>
  );
}

/** iOS-style verified badge — matches Aura scenic minimal template. */
export function ShareAuraVerifiedBadge({ scale }: { scale: number }) {
  return (
    <View
      style={{
        width: 28 * scale,
        height: 28 * scale,
        borderRadius: 14 * scale,
        backgroundColor: "#1D9BF0",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10 * scale,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: "Poppins-Bold",
          fontSize: 15 * scale,
          marginTop: -1 * scale,
        }}
      >
        ✓
      </Text>
    </View>
  );
}

/** Three-column stat row under the neon hero — Aura 8'48" / 2H 38M / 909 FT rhythm. */
export function ShareAuraStatRow({
  stats,
  scale,
  color = "#FF2D8A",
}: {
  stats: [string, string, string];
  scale: number;
  color?: string;
}) {
  return (
    <View
      style={{
        marginTop: 14 * scale,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 22 * scale,
        paddingHorizontal: 8 * scale,
      }}
    >
      {stats.map((stat, index) => (
        <Text
          key={`${stat}-${index}`}
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 19 * scale,
            lineHeight: 24 * scale,
            color,
            letterSpacing: 0.2,
          }}
        >
          {stat}
        </Text>
      ))}
    </View>
  );
}

/** Smaller stroked value for weekly day counts. */
export function ShareAuraStrokedValue({
  children,
  scale,
  fontSize = 24,
  color = "#5B9BFF",
}: {
  children: string;
  scale: number;
  fontSize?: number;
  color?: string;
}) {
  const size = fontSize * scale;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", minHeight: size * 1.2 }}>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([x, y]) => (
        <Text
          key={`${x}-${y}`}
          style={{
            position: "absolute",
            fontFamily: "Poppins-Bold",
            fontSize: size,
            color: "#0A0A0A",
            fontStyle: "italic",
            transform: [{ skewX: "-8deg" }, { translateX: x * scale }, { translateY: y * scale }],
          }}
        >
          {children}
        </Text>
      ))}
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: size,
          color,
          fontStyle: "italic",
          transform: [{ skewX: "-8deg" }],
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export function ShareAuraStrokedHeadline({
  children,
  scale,
  fontSize = 34,
  color = "#5B9BFF",
}: {
  children: string;
  scale: number;
  fontSize?: number;
  color?: string;
}) {
  const size = fontSize * scale;
  const strokeStyle: TextStyle = {
    position: "absolute",
    fontFamily: "Poppins-Bold",
    fontSize: size,
    lineHeight: size * 1.1,
    color: "#0A0A0A",
    fontStyle: "italic",
    transform: [{ skewX: "-10deg" }],
  };

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {[
        [-2, -2],
        [2, -2],
        [-2, 2],
        [2, 2],
      ].map(([x, y]) => (
        <Text
          key={`${x}-${y}`}
          style={{
            ...strokeStyle,
            transform: [{ skewX: "-10deg" }, { translateX: x * scale }, { translateY: y * scale }],
          }}
        >
          {children}
        </Text>
      ))}
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: size,
          lineHeight: size * 1.1,
          color,
          fontStyle: "italic",
          transform: [{ skewX: "-10deg" }],
          textAlign: "center",
        }}
      >
        {children}
      </Text>
    </View>
  );
}

/** Frosted activity pill — cycling/running stacked cards ref. */
export function ShareAuraGlassCard({
  label,
  heroValue,
  subline,
  icon,
  scale,
}: {
  label: string;
  heroValue: string;
  subline: string;
  icon: ReactNode;
  scale: number;
}) {
  return (
    <View
      style={{
        borderRadius: 20 * scale,
        minWidth: 228 * scale,
        paddingHorizontal: 18 * scale,
        paddingVertical: 16 * scale,
        backgroundColor: "rgba(198, 236, 152, 0.62)",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255, 0.48)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 * scale },
        shadowOpacity: 0.18,
        shadowRadius: 12 * scale,
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 16 * scale,
          color: "#111111",
          marginBottom: 10 * scale,
        }}
      >
        {label}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 * scale }}>
        {icon}
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 30 * scale,
            lineHeight: 34 * scale,
            color: "#111111",
            flexShrink: 1,
          }}
        >
          {heroValue}
        </Text>
      </View>

      <Text
        style={{
          marginTop: 8 * scale,
          fontFamily: "Poppins-Medium",
          fontSize: 13 * scale,
          color: "rgba(17,17,17,0.78)",
          textAlign: "right",
        }}
        numberOfLines={1}
      >
        {subline}
      </Text>
    </View>
  );
}

/** Corner HUD label — film metadata, no drop shadow. */
export function ShareAuraHudLabel({
  children,
  style,
}: {
  children: string;
  style?: TextStyle;
}) {
  return (
    <Text
      style={{
        fontFamily: "SpaceMono-Bold",
        fontSize: style?.fontSize,
        lineHeight: style?.lineHeight,
        color: "#FFFFFF",
        letterSpacing: 0.5,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

/** 2×2 stat cell — Thursday shoes grid ref. */
export function ShareAuraGridCell({
  value,
  label,
  scale,
}: {
  value: string;
  label: string;
  scale: number;
}) {
  return (
    <View style={{ alignItems: "center", minWidth: 108 * scale }}>
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 38 * scale,
          lineHeight: 42 * scale,
          color: "#FFFFFF",
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          marginTop: 2 * scale,
          fontFamily: "Poppins-SemiBold",
          fontSize: 10 * scale,
          letterSpacing: 1.4,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

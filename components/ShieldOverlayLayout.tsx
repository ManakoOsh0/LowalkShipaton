/**
 * Full-screen app-blocked layout — black canvas, schedule kind icon, dynamic copy, and CTA pill.
 */
import { Pressable, Text, View } from "react-native";

import { ShieldBlockedIcon } from "@/components/ShieldBlockedIcon";
import type { FocusNodeKind } from "@/types/focusNode";

type ShieldOverlayLayoutProps = {
  kind: FocusNodeKind;
  subtitle: string;
  ctaLabel: string;
  onCtaPress: () => void;
};

export function ShieldOverlayLayout({
  kind,
  subtitle,
  ctaLabel,
  onCtaPress,
}: ShieldOverlayLayoutProps) {
  const [headline, ...timingLines] = subtitle.split("\n");
  const timing = timingLines.join("\n").trim();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        paddingHorizontal: 28,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View style={{ alignItems: "center", width: "100%", maxWidth: 340 }}>
        <ShieldBlockedIcon kind={kind} />

        <Text
          style={{
            marginTop: 32,
            fontFamily: "Poppins-Bold",
            fontSize: 30,
            lineHeight: 38,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          App Blocked
        </Text>

        <Text
          style={{
            marginTop: 12,
            fontFamily: "Poppins-Regular",
            fontSize: 18,
            lineHeight: 26,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          {headline}
        </Text>

        {timing ? (
          <Text
            style={{
              marginTop: 8,
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: "rgba(255, 255, 255, 0.62)",
              textAlign: "center",
            }}
          >
            {timing}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          onPress={onCtaPress}
          style={({ pressed }) => ({
            marginTop: 40,
            width: "100%",
            opacity: pressed ? 0.9 : 1,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.35)",
            backgroundColor: "#FFFFFF",
            paddingVertical: 16,
            paddingHorizontal: 24,
            alignItems: "center",
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 16,
              lineHeight: 22,
              color: "#0D132B",
            }}
          >
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

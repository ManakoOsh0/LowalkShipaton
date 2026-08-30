/**
 * Full-screen app-blocked layout — centred copy with a bottom Close pill.
 */
import { Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ShieldBlockedIcon } from "@/components/ShieldBlockedIcon";
import { ShieldOpenLowalkButton } from "@/components/ShieldOpenLowalkButton";
import { colors } from "@/theme/tokens";
import { FONT_FAMILY } from "@/theme/fonts";

type ShieldOverlayLayoutProps = {
  headline: string;
  subtitle: string;
  onCtaPress: () => void;
  ctaLabel?: string;
};

export function ShieldOverlayLayout({
  headline,
  subtitle,
  onCtaPress,
  ctaLabel,
}: ShieldOverlayLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 28,
      }}
      edges={["top", "left", "right"]}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{ alignItems: "center", width: "100%", maxWidth: 340 }}>
          <ShieldBlockedIcon />

          <Text
            style={{
              marginTop: 28,
              fontFamily: FONT_FAMILY.bold,
              fontSize: 28,
              lineHeight: 36,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            {headline}
          </Text>

          <Text
            style={{
              marginTop: 12,
              fontFamily: FONT_FAMILY.regular,
              fontSize: 15,
              lineHeight: 22,
              color: colors.foregroundSubtle,
              textAlign: "center",
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          paddingBottom: Math.max(insets.bottom, 12) + 24,
        }}
      >
        <ShieldOpenLowalkButton onPress={onCtaPress} label={ctaLabel} />
      </View>
    </SafeAreaView>
  );
}

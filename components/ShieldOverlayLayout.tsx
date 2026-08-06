/**
 * Full-screen app-blocked layout — centered logo and copy with a bottom Close pill.
 */
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ShieldBlockedIcon } from "@/components/ShieldBlockedIcon";
import { ShieldOpenLowalkButton } from "@/components/ShieldOpenLowalkButton";
import { SHIELD_OVERLAY_FONTS } from "@/lib/shieldTypography";
import { colors } from "@/theme/tokens";

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
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 28,
      }}
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
              fontFamily: SHIELD_OVERLAY_FONTS.headline,
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
              fontFamily: SHIELD_OVERLAY_FONTS.subtitle,
              fontSize: 15,
              lineHeight: 22,
              color: colors.foreground,
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
          marginTop: -24,
          paddingBottom: Math.max(insets.bottom, 12) + 24,
        }}
      >
        <ShieldOpenLowalkButton onPress={onCtaPress} label={ctaLabel} />
      </View>
    </View>
  );
}

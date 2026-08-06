/**
 * HeroSoftButton — recessed mono pill CTA carved into the hero outer frame rail.
 */
import { Platform, Pressable, Text, View } from "react-native";

import { HeroInsetEdge } from "@/components/hero/HeroInsetEdge";
import {
    formatSoftActionLabel,
    HERO_EINK_BUTTON_RADIUS,
    HERO_EINK_FOOTER_HEIGHT,
    TRMNL_THEME,
} from "@/lib/heroEink";
import { FONT_FAMILY } from "@/theme/fonts";

type HeroSoftButtonProps = {
  label: string;
  onPress?: () => void;
};

export function HeroSoftButton({ label, onPress }: HeroSoftButtonProps) {
  const displayLabel = formatSoftActionLabel(label);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        height: HERO_EINK_FOOTER_HEIGHT,
        borderRadius: HERO_EINK_BUTTON_RADIUS,
        borderCurve: "continuous",
        overflow: "hidden",
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: TRMNL_THEME.recessed,
        }}
      >
        <HeroInsetEdge edgeSize={10} opacity={0.18} />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{
            fontFamily: FONT_FAMILY.monoBold,
            fontSize: 14,
            lineHeight: 18,
            color: TRMNL_THEME.textPrimary,
            letterSpacing: 0.5,
            zIndex: 1,
            ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
          }}
        >
          {displayLabel}
        </Text>
      </View>
    </Pressable>
  );
}

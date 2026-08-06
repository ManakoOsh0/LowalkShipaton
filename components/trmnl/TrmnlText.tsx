/**
 * TrmnlText — enforces TRMNL Classic pixel fonts at native sizes only.
 * Prevents antialiased scaling that makes bitmap type look too smooth.
 */
import { Platform, Text, type TextProps } from "react-native";

import { TRMNL_THEME } from "@/lib/heroEink";
import { TRMNL_VARIANT_STYLES, type TrmnlTextVariant } from "@/lib/trmnlTypography";

type TrmnlTextColor = "ink" | "inverse" | "muted" | "mutedWell";

type TrmnlTextProps = TextProps & {
  variant: TrmnlTextVariant;
  color?: TrmnlTextColor;
  children: string;
};

const COLOR_MAP: Record<TrmnlTextColor, string> = {
  ink: TRMNL_THEME.textPrimary,
  inverse: TRMNL_THEME.textInverse,
  muted: TRMNL_THEME.muted,
  mutedWell: TRMNL_THEME.mutedOnWell,
};

export function TrmnlText({
  variant,
  color = "ink",
  style,
  children,
  ...rest
}: TrmnlTextProps) {
  const spec = TRMNL_VARIANT_STYLES[variant];

  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          fontFamily: spec.family,
          fontSize: spec.size,
          lineHeight: spec.lineHeight,
          color: COLOR_MAP[color],
          letterSpacing: 0,
          textTransform: spec.uppercase ? "uppercase" : "none",
          ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

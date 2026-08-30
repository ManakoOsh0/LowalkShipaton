/**
 * TrmnlText — enforces TRMNL Classic pixel fonts at native sizes only.
 * Prevents antialiased scaling that makes bitmap type look too smooth.
 */
import { Platform, Text, type TextProps } from "react-native";

import { useHeroTheme } from "@/hooks/useHeroTheme";
import { TRMNL_VARIANT_STYLES, type TrmnlTextVariant } from "@/lib/trmnlTypography";

type TrmnlTextColor = "ink" | "inverse" | "muted" | "mutedWell";

type TrmnlTextProps = TextProps & {
  variant: TrmnlTextVariant;
  color?: TrmnlTextColor;
  children: string;
};

export function TrmnlText({
  variant,
  color = "ink",
  style,
  children,
  ...rest
}: TrmnlTextProps) {
  const theme = useHeroTheme();
  const spec = TRMNL_VARIANT_STYLES[variant];
  const colorMap: Record<TrmnlTextColor, string> = {
    ink: theme.textPrimary,
    inverse: theme.textInverse,
    muted: theme.muted,
    mutedWell: theme.mutedOnWell,
  };

  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          fontFamily: spec.family,
          fontSize: spec.size,
          lineHeight: spec.lineHeight,
          color: colorMap[color],
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

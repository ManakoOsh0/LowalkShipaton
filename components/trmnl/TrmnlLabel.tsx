/**
 * TrmnlLabel — Framework label element.
 */
import { Text, type TextProps } from "react-native";

import { useHeroTheme } from "@/hooks/useHeroTheme";
import { TRMNL_LABEL, type TrmnlLabelSize } from "@/lib/trmnlFramework";

type TrmnlLabelProps = TextProps & {
  size?: TrmnlLabelSize;
  children: string;
  muted?: boolean;
};

export function TrmnlLabel({
  size = "base",
  children,
  muted = false,
  style,
  ...rest
}: TrmnlLabelProps) {
  const theme = useHeroTheme();
  const spec = TRMNL_LABEL[size];

  return (
    <Text
      allowFontScaling={false}
      numberOfLines={2}
      style={[
        {
          fontFamily: spec.family,
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          color: muted ? theme.mutedOnWell : theme.textPrimary,
          textAlign: "center",
          textTransform: spec.uppercase ? "uppercase" : "none",
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

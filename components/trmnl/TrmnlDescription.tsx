/**
 * TrmnlDescription — Framework description element (sentence case).
 */
import { Text, type TextProps } from "react-native";

import { useHeroTheme } from "@/hooks/useHeroTheme";
import {
  TRMNL_DESCRIPTION,
  type TrmnlDescriptionSize,
} from "@/lib/trmnlFramework";

type TrmnlDescriptionProps = TextProps & {
  size?: TrmnlDescriptionSize;
  children: string;
  muted?: boolean;
};

export function TrmnlDescription({
  size = "base",
  children,
  muted = true,
  style,
  ...rest
}: TrmnlDescriptionProps) {
  const theme = useHeroTheme();
  const spec = TRMNL_DESCRIPTION[size];

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
          paddingHorizontal: 4,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

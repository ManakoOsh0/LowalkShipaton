/**
 * TrmnlValue — Framework value element with size ladder.
 */
import { Text, type TextProps } from "react-native";

import { useHeroTheme } from "@/hooks/useHeroTheme";
import {
  TRMNL_VALUE_SIZE,
  type TrmnlValueSize,
} from "@/lib/trmnlFramework";

type TrmnlValueProps = TextProps & {
  size?: TrmnlValueSize;
  children: string;
  tabular?: boolean;
};

export function TrmnlValue({
  size = "base",
  children,
  tabular = false,
  style,
  ...rest
}: TrmnlValueProps) {
  const theme = useHeroTheme();
  const spec = TRMNL_VALUE_SIZE[size];

  return (
    <Text
      allowFontScaling={false}
      numberOfLines={1}
      style={[
        {
          fontFamily: spec.family,
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          color: theme.textPrimary,
          textAlign: "center",
          fontVariant: tabular ? ["tabular-nums"] : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

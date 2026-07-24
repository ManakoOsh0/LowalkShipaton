/**
 * SectionLabel — uppercase section heading for dashboard groupings.
 */
import { Text, type TextProps } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type SectionLabelProps = TextProps & {
  children: string;
};

export function SectionLabel({ children, style, ...rest }: SectionLabelProps) {
  const colors = useThemeColors();

  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.muted,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

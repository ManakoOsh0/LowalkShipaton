/**
 * Typography helpers — maps theme token scale to Poppins TextStyle objects.
 */
import type { TextStyle } from "react-native";

import { FONT_FAMILY } from "@/theme/fonts";
import { typography, type TypographyToken } from "@/theme/tokens";

const WEIGHT_TO_FAMILY = {
  regular: FONT_FAMILY.regular,
  medium: FONT_FAMILY.medium,
  semibold: FONT_FAMILY.semibold,
  bold: FONT_FAMILY.bold,
} as const;

export function textStyle(
  token: TypographyToken,
  color: string,
  extra?: TextStyle,
): TextStyle {
  const scale = typography[token];
  return {
    fontFamily: WEIGHT_TO_FAMILY[scale.weight],
    fontSize: scale.size,
    lineHeight: Math.round(scale.size * scale.lineHeight),
    color,
    ...extra,
  };
}

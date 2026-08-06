/**
 * LowalkLogoIcon — canonical pixel brand mark from Lowalk-finale-logo.png.
 */
import { Image, type ImageStyle, type StyleProp } from "react-native";

import { lowalkLogoImage } from "@/constants/images";

/** Finale logo is roughly square at 1:1. */
const LOGO_ASPECT = 1;

type LowalkLogoIconProps = {
  /** Rendered height; width follows the logo aspect ratio. */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function LowalkLogoIcon({ size = 36, style }: LowalkLogoIconProps) {
  const height = size;
  const width = size * LOGO_ASPECT;

  return (
    <Image
      source={lowalkLogoImage}
      accessibilityLabel="Lowalk"
      style={[{ width, height, resizeMode: "contain" }, style]}
    />
  );
}

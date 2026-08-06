/**
 * Shield overlay brand mark — Lowalk finale logo shown above blocked-app copy.
 */
import { Image } from "react-native";

import { lowalkLogoImage } from "@/constants/images";

const LOGO_SIZE = 124;
const LOGO_OFFSET_X = -6;

type ShieldBlockedIconProps = {
  size?: number;
  offsetX?: number;
};

export function ShieldBlockedIcon({
  size = LOGO_SIZE,
  offsetX = LOGO_OFFSET_X,
}: ShieldBlockedIconProps) {
  return (
    <Image
      source={lowalkLogoImage}
      accessibilityLabel="Lowalk"
      accessibilityIgnoresInvertColors
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
        transform: [{ translateX: offsetX }],
      }}
    />
  );
}

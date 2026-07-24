/**
 * LowalkLogoIcon — Dawn Path brand mark for the home header and branding slots.
 */
import { SvgXml } from "react-native-svg";

import { LOWALK2_LOGO_ASPECT, lowalk2LogoXml } from "@/constants/lowalk2Logo";

type LowalkLogoIconProps = {
  /** Rendered height; width follows the logo aspect ratio. */
  size?: number;
};

export function LowalkLogoIcon({ size = 36 }: LowalkLogoIconProps) {
  const height = size;
  const width = size * LOWALK2_LOGO_ASPECT;

  return <SvgXml xml={lowalk2LogoXml} width={width} height={height} />;
}

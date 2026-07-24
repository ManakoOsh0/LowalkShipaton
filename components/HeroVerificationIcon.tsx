/**
 * HeroVerificationIcon — pixel signal mascot for the "verification" Hero Card state.
 */
import { SvgXml } from "react-native-svg";

import { pixelVerificationXml } from "@/constants/pixelVerification";

type HeroVerificationIconProps = {
  size?: number;
};

export function HeroVerificationIcon({ size = 76 }: HeroVerificationIconProps) {
  return <SvgXml xml={pixelVerificationXml} width={size} height={size} />;
}

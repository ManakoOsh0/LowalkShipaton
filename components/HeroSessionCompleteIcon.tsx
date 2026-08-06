/**
 * HeroSessionCompleteIcon — pixel trophy for the session-complete hero beat.
 */
import { SvgXml } from "react-native-svg";

import { pixelFocusSecuredXml } from "@/constants/pixelFocusSecured";

type HeroSessionCompleteIconProps = {
  size?: number;
};

export function HeroSessionCompleteIcon({ size = 56 }: HeroSessionCompleteIconProps) {
  return <SvgXml xml={pixelFocusSecuredXml} width={size} height={size} />;
}

/**
 * HeroSessionCompleteIcon — pixel trophy for the session-complete hero beat.
 * Source art is black for the light e-ink well; pass `color` on dark surfaces.
 */
import { SvgXml } from "react-native-svg";

import { pixelFocusSecuredXml } from "@/constants/pixelFocusSecured";

type HeroSessionCompleteIconProps = {
  size?: number;
  color?: string;
};

export function HeroSessionCompleteIcon({
  size = 56,
  color = "#000000",
}: HeroSessionCompleteIconProps) {
  const xml =
    color === "#000000"
      ? pixelFocusSecuredXml
      : pixelFocusSecuredXml.replaceAll("#000000", color);
  return <SvgXml xml={xml} width={size} height={size} />;
}

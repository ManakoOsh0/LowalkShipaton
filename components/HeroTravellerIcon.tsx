/**
 * HeroTravellerIcon — pixel map pin for the "travelling" Hero Card state.
 */
import { SvgXml } from "react-native-svg";

import { pixelTravellerXml } from "@/constants/pixelTraveller";

type HeroTravellerIconProps = {
  size?: number;
};

export function HeroTravellerIcon({ size = 76 }: HeroTravellerIconProps) {
  return <SvgXml xml={pixelTravellerXml} width={size} height={size} />;
}

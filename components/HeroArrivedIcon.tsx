/**
 * HeroArrivedIcon — pixel flag for the "arrived" Hero Card state.
 */
import { SvgXml } from "react-native-svg";

import { pixelArrivedXml } from "@/constants/pixelArrived";

type HeroArrivedIconProps = {
  size?: number;
};

export function HeroArrivedIcon({ size = 76 }: HeroArrivedIconProps) {
  return <SvgXml xml={pixelArrivedXml} width={size} height={size} />;
}

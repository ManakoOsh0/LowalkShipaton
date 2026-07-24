/**
 * HeroSunriseIcon — pixel sun for the "no sessions today" Hero Card state.
 */
import { SvgXml } from "react-native-svg";

import { pixelSunriseXml } from "@/constants/pixelSunrise";

type HeroSunriseIconProps = {
  size?: number;
};

export function HeroSunriseIcon({ size = 52 }: HeroSunriseIconProps) {
  return <SvgXml xml={pixelSunriseXml} width={size} height={size} />;
}

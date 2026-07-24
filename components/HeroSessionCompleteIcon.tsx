/**
 * HeroSessionCompleteIcon — pixel trophy mascot for the "session complete" Hero Card state.
 */
import { SvgXml } from "react-native-svg";

import { pixelSessionCompleteXml } from "@/constants/pixelSessionComplete";

type HeroSessionCompleteIconProps = {
  size?: number;
};

export function HeroSessionCompleteIcon({ size = 76 }: HeroSessionCompleteIconProps) {
  return <SvgXml xml={pixelSessionCompleteXml} width={size} height={size} />;
}

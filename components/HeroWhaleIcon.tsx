/**
 * HeroWhaleIcon — pixel whale for the "upcoming session" Hero Card state.
 */
import { SvgXml } from "react-native-svg";

import { pixelWhaleXml } from "@/constants/pixelWhale";

type HeroWhaleIconProps = {
  size?: number;
};

export function HeroWhaleIcon({ size = 64 }: HeroWhaleIconProps) {
  return <SvgXml xml={pixelWhaleXml} width={size} height={size} />;
}

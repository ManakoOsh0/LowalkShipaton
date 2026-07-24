/**
 * FocusCoinIcon — pixelated golden coin artwork for Focus Coin balance displays.
 */
import { SvgXml } from "react-native-svg";

import { pixelatedGoldenCoinXml } from "@/constants/pixelatedGoldenCoin";

type FocusCoinIconProps = {
  size?: number;
};

export function FocusCoinIcon({ size = 18 }: FocusCoinIconProps) {
  return <SvgXml xml={pixelatedGoldenCoinXml} width={size} height={size} />;
}

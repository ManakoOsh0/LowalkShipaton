/**
 * HeroPausedIcon — pixel alert mascot for the "session paused" Hero Card state.
 */
import { SvgXml } from "react-native-svg";

import { pixelPausedXml } from "@/constants/pixelPaused";

type HeroPausedIconProps = {
  size?: number;
};

export function HeroPausedIcon({ size = 76 }: HeroPausedIconProps) {
  return <SvgXml xml={pixelPausedXml} width={size} height={size} />;
}

/**
 * HeroWalkingIcon — pedestrian glyph for on-the-way / travel hero states.
 */
import Svg, { Path } from "react-native-svg";

import { heroWalkingPath } from "@/constants/heroWalking";
import { TRMNL_THEME } from "@/lib/heroEink";

type HeroWalkingIconProps = {
  size?: number;
  color?: string;
};

export function HeroWalkingIcon({
  size = 32,
  color = TRMNL_THEME.textPrimary,
}: HeroWalkingIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d={heroWalkingPath} fill={color} />
    </Svg>
  );
}

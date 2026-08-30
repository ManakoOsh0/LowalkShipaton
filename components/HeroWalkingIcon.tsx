/**
 * HeroWalkingIcon — pedestrian glyph for on-the-way / travel hero states.
 */
import Svg, { Path } from "react-native-svg";

import { heroWalkingPath } from "@/constants/heroWalking";
import { useHeroTheme } from "@/hooks/useHeroTheme";

type HeroWalkingIconProps = {
  size?: number;
  color?: string;
};

export function HeroWalkingIcon({
  size = 32,
  color,
}: HeroWalkingIconProps) {
  const theme = useHeroTheme();
  const fill = color ?? theme.textPrimary;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d={heroWalkingPath} fill={fill} />
    </Svg>
  );
}

/**
 * StreakFlame — streak mark icon for streak count displays in the header and stats.
 */
import Svg, { Path } from "react-native-svg";

import { useThemeColors } from "@/hooks/useThemeColors";

type StreakFlameProps = {
  height?: number;
  color?: string;
  /** Outline stroke in SVG viewBox units — rendered behind the fill. */
  stroke?: string;
  strokeWidth?: number;
};

const FLAME_PATH =
  "M33.483,62.693c-0.569,0-1.149-0.094-1.72-0.289c-2.387-0.817-3.812-3.134-3.467-5.633l1.907-13.781h-5.06c-1.455,0-2.835-0.632-3.785-1.733c-0.951-1.102-1.374-2.56-1.161-3.999l3.548-23.96c0.361-2.434,2.487-4.268,4.946-4.268h11.205c1.618,0,3.143,0.788,4.078,2.107c0.936,1.318,1.176,3.018,0.641,4.544L41.009,25.99l7.923,0.007c1.805,0.001,3.422,0.936,4.325,2.499s0.904,3.431,0.003,4.996L37.954,60.079C36.997,61.742,35.294,62.693,33.483,62.693z";

export function StreakFlame({
  height = 16,
  color,
  stroke,
  strokeWidth = 5,
}: StreakFlameProps) {
  const colors = useThemeColors();
  const fill = color ?? colors.primary;
  const visualSize = Math.round(height * 1.15);

  return (
    <Svg width={visualSize} height={visualSize} viewBox="0 0 72 72" fill="none">
      {stroke ? (
        <Path
          d={FLAME_PATH}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      <Path d={FLAME_PATH} fill={fill} />
    </Svg>
  );
}

/**
 * HeroScanlineTexture — faint horizontal CRT/LCD stripes over the recessed well.
 * Absolute overlay; does not affect layout or touch targets.
 */
import { StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

import { HERO_BENTO_SCANLINE_OPACITY } from "@/lib/heroEink";

type HeroScanlineTextureProps = {
  opacity?: number;
};

export function HeroScanlineTexture({
  opacity = HERO_BENTO_SCANLINE_OPACITY,
}: HeroScanlineTextureProps) {
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <Defs>
        <Pattern
          id="heroScanlines"
          patternUnits="userSpaceOnUse"
          width={1}
          height={4}
        >
          <Rect width={1} height={2} fill="transparent" />
          <Rect
            y={2}
            width={1}
            height={2}
            fill={`rgba(0, 0, 0, ${opacity})`}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#heroScanlines)" />
    </Svg>
  );
}

/**
 * HeroInsetEdge — fakes inset or raised box-shadow on hero plastic surfaces.
 * inset: carved recess (dark rim on all sides; stronger top/left).
 * raised: extruded shell (light top/left, dark bottom/right).
 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import {
  HERO_BENTO_FRAME_RAISED_OPACITY,
  HERO_BENTO_FRAME_SHADOW_OPACITY,
  HERO_BENTO_WELL_INSET_BOTTOM_RIGHT_OPACITY,
  HERO_BENTO_WELL_INSET_OPACITY,
} from "@/lib/heroEink";

const DEFAULT_EDGE_SIZE = 14;

type HeroInsetEdgeVariant = "inset" | "raised";

type HeroInsetEdgeProps = {
  /** Dark edge on primary sides (top/left for inset, bottom/right for raised). */
  opacity?: number;
  /** Dark edge on secondary inset sides (bottom/right rim). */
  rimOpacity?: number;
  /** Light edge on raised top/left only. */
  highlightOpacity?: number;
  edgeSize?: number;
  variant?: HeroInsetEdgeVariant;
};

export function HeroInsetEdge({
  opacity,
  rimOpacity,
  highlightOpacity,
  edgeSize = DEFAULT_EDGE_SIZE,
  variant = "inset",
}: HeroInsetEdgeProps) {
  if (variant === "inset") {
    const topLeftOpacity = opacity ?? HERO_BENTO_WELL_INSET_OPACITY;
    const bottomRightOpacity =
      rimOpacity ?? HERO_BENTO_WELL_INSET_BOTTOM_RIGHT_OPACITY;
    const topLeftShadow = `rgba(0, 0, 0, ${topLeftOpacity})`;
    const bottomRightShadow = `rgba(0, 0, 0, ${bottomRightOpacity})`;

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[topLeftShadow, "transparent"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: edgeSize,
          }}
        />
        <LinearGradient
          colors={["transparent", bottomRightShadow]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: edgeSize,
          }}
        />
        <LinearGradient
          colors={[topLeftShadow, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: edgeSize,
          }}
        />
        <LinearGradient
          colors={["transparent", bottomRightShadow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: edgeSize,
          }}
        />
      </View>
    );
  }

  const shadowOpacity = opacity ?? HERO_BENTO_FRAME_SHADOW_OPACITY;
  const lightOpacity = highlightOpacity ?? HERO_BENTO_FRAME_RAISED_OPACITY;
  const shadow = `rgba(0, 0, 0, ${shadowOpacity})`;
  const highlight = `rgba(255, 255, 255, ${lightOpacity})`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[highlight, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: edgeSize,
        }}
      />
      <LinearGradient
        colors={["transparent", shadow]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: edgeSize,
        }}
      />
      <LinearGradient
        colors={[highlight, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: edgeSize,
        }}
      />
      <LinearGradient
        colors={["transparent", shadow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: edgeSize,
        }}
      />
    </View>
  );
}

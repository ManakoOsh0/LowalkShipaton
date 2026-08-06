/**
 * HeroSoftFrameShell — soft-touch rubber case for the hero outer frame.
 * Pillow shading via diffuse ambient occlusion — no sharp plastic highlights or grain.
 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { HeroInsetEdge } from "@/components/hero/HeroInsetEdge";
import {
  HERO_BENTO_FRAME_AMBIENT_EDGE,
  HERO_BENTO_FRAME_AMBIENT_OPACITY,
  HERO_BENTO_FRAME_AMBIENT_RIM_OPACITY,
  HERO_BENTO_FRAME_OPENING_LIP_OPACITY,
  HERO_EINK_FRAME_PADDING,
  HERO_EINK_FRAME_RADIUS,
  HERO_EINK_PAPER_RADIUS,
  TRMNL_THEME,
} from "@/lib/heroEink";

const OPENING_LIP_DEPTH = 22;

export function HeroSoftFrameShell() {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: HERO_EINK_FRAME_RADIUS,
          borderCurve: "continuous",
        },
      ]}
    >
      <LinearGradient
        colors={[TRMNL_THEME.frameShellTop, TRMNL_THEME.frameShellBottom]}
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: HERO_EINK_FRAME_RADIUS,
          borderCurve: "continuous",
        }}
      />

      {/* Soft pillow vignette — dark edges only, no specular rim. */}
      <HeroInsetEdge
        variant="inset"
        edgeSize={HERO_BENTO_FRAME_AMBIENT_EDGE}
        opacity={HERO_BENTO_FRAME_AMBIENT_OPACITY}
        rimOpacity={HERO_BENTO_FRAME_AMBIENT_RIM_OPACITY}
      />

      {/* LCD cutout occlusion — frame overhang casts a soft shadow inward. */}
      <View
        style={{
          position: "absolute",
          top: HERO_EINK_FRAME_PADDING,
          left: HERO_EINK_FRAME_PADDING,
          right: HERO_EINK_FRAME_PADDING,
          bottom: HERO_EINK_FRAME_PADDING,
          borderRadius: HERO_EINK_PAPER_RADIUS,
          borderCurve: "continuous",
        }}
      >
        <LinearGradient
          colors={[
            `rgba(0, 0, 0, ${HERO_BENTO_FRAME_OPENING_LIP_OPACITY})`,
            "transparent",
          ]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: OPENING_LIP_DEPTH,
            borderTopLeftRadius: HERO_EINK_PAPER_RADIUS,
            borderTopRightRadius: HERO_EINK_PAPER_RADIUS,
            borderCurve: "continuous",
          }}
        />
        <LinearGradient
          colors={[
            `rgba(0, 0, 0, ${HERO_BENTO_FRAME_OPENING_LIP_OPACITY})`,
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: OPENING_LIP_DEPTH,
            borderTopLeftRadius: HERO_EINK_PAPER_RADIUS,
            borderBottomLeftRadius: HERO_EINK_PAPER_RADIUS,
            borderCurve: "continuous",
          }}
        />
      </View>
    </View>
  );
}

/**
 * HeroSoftFrameShell — outer case surface. Lighting comes from the active
 * case style; color still comes from the case swatch.
 * Recess lives on the well bezel only — no extra cutout lip here.
 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { HeroInsetEdge } from "@/components/hero/HeroInsetEdge";
import { useHeroCaseStyle } from "@/hooks/useHeroCaseStyle";
import { useHeroTheme } from "@/hooks/useHeroTheme";
import { HERO_EINK_FRAME_PADDING } from "@/lib/heroEink";

const BUMPER_RING_INSET = 3;

export function HeroSoftFrameShell() {
  const theme = useHeroTheme();
  const style = useHeroCaseStyle();
  const crown = `rgba(255, 255, 255, ${style.crownOpacity})`;

  // absoluteFill only covers the padded content box — bleed into the frame rail
  // so the matte case wraps the LCD instead of leaving a transparent gutter.
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -HERO_EINK_FRAME_PADDING,
        left: -HERO_EINK_FRAME_PADDING,
        right: -HERO_EINK_FRAME_PADDING,
        bottom: -HERO_EINK_FRAME_PADDING,
        borderRadius: style.radius,
        borderCurve: "continuous",
        zIndex: 0,
      }}
    >
      <LinearGradient
        colors={[theme.frameShellTop, theme.frameShellBottom]}
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: style.radius,
          borderCurve: "continuous",
        }}
      />

      {style.edgeStrokeOpacity > 0 ? (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: style.radius,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: `rgba(0, 0, 0, ${style.edgeStrokeOpacity})`,
          }}
        />
      ) : null}

      {style.bumperRing ? (
        <View
          style={{
            position: "absolute",
            top: BUMPER_RING_INSET,
            left: BUMPER_RING_INSET,
            right: BUMPER_RING_INSET,
            bottom: BUMPER_RING_INSET,
            borderRadius: Math.max(style.radius - BUMPER_RING_INSET, 8),
            borderCurve: "continuous",
            borderWidth: 1.5,
            borderColor: "rgba(0, 0, 0, 0.12)",
          }}
        />
      ) : null}

      <LinearGradient
        colors={[crown, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: style.crownEdge,
        }}
      />
      <LinearGradient
        colors={[crown, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: style.crownEdge,
        }}
      />

      <HeroInsetEdge
        variant="inset"
        edgeSize={style.ambientEdge}
        opacity={style.ambientOpacity}
        rimOpacity={style.ambientRimOpacity}
      />
    </View>
  );
}

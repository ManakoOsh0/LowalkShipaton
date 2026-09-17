/**
 * HeroWellGlassOverlay — soft LCD lens drawn above copy.
 * iPod-style inner vignette + faint veil so the screen reads recessed under glass,
 * not a flat sticker on the case.
 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { useHeroCaseStyle } from "@/hooks/useHeroCaseStyle";

export function HeroWellGlassOverlay() {
  const style = useHeroCaseStyle();
  const vignette = `rgba(0, 0, 0, ${style.glassVignetteOpacity})`;
  const veil = `rgba(255, 255, 255, ${style.glassVeilOpacity})`;
  const specular = `rgba(255, 255, 255, ${style.glassWashOpacity * 1.35})`;
  const edge = style.glassVignetteSize;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: veil }]}
      />

      <LinearGradient
        colors={[vignette, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: edge,
        }}
      />
      <LinearGradient
        colors={["transparent", vignette]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: edge,
        }}
      />
      <LinearGradient
        colors={[vignette, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: edge,
        }}
      />
      <LinearGradient
        colors={["transparent", vignette]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: edge,
        }}
      />

      <LinearGradient
        colors={[specular, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "34%",
        }}
      />
    </View>
  );
}

/**
 * HeroWellBezel — case lip shadow where the frame opening meets the LCD well.
 * Dark occlusion on top/left sells the screen sitting behind the plastic bezel.
 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { HERO_BENTO_WELL_BEZEL_OPACITY } from "@/lib/heroEink";

const BEZEL_SIZE = 12;

type HeroWellBezelProps = {
  opacity?: number;
};

export function HeroWellBezel({
  opacity = HERO_BENTO_WELL_BEZEL_OPACITY,
}: HeroWellBezelProps) {
  const shadow = `rgba(0, 0, 0, ${opacity})`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[shadow, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: BEZEL_SIZE,
        }}
      />
      <LinearGradient
        colors={[shadow, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: BEZEL_SIZE,
        }}
      />
    </View>
  );
}

/**
 * HeroWellGloss — faint top wash on the LCD well. Strength follows case style
 * (ceramic glossier, skin/bumper more matte).
 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { useHeroCaseStyle } from "@/hooks/useHeroCaseStyle";

export function HeroWellGloss() {
  const style = useHeroCaseStyle();
  const wash = `rgba(255, 255, 255, ${style.glassWashOpacity})`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[wash, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "38%",
        }}
      />
    </View>
  );
}

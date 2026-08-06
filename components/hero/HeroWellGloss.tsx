/**
 * HeroWellGloss — faint top wash on the LCD well. No diagonal streak — it
 * brightened the bottom/right rim and fought inset shadows.
 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { HERO_BENTO_GLASS_WASH_OPACITY } from "@/lib/heroEink";

export function HeroWellGloss() {
  const wash = `rgba(255, 255, 255, ${HERO_BENTO_GLASS_WASH_OPACITY})`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[wash, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "32%",
        }}
      />
    </View>
  );
}

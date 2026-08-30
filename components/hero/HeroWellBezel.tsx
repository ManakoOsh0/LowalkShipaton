/**
 * HeroWellBezel — case lip shadow where the opening meets the LCD well.
 * Depth follows the active case style.
 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { useHeroCaseStyle } from "@/hooks/useHeroCaseStyle";

export function HeroWellBezel() {
  const style = useHeroCaseStyle();
  const shadow = `rgba(0, 0, 0, ${style.wellBezelOpacity})`;
  const rim = `rgba(0, 0, 0, ${style.wellBezelRimOpacity})`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[shadow, "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: style.wellBezelSize,
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
          width: style.wellBezelSize,
        }}
      />
      {style.wellBezelRimOpacity > 0 ? (
        <>
          <LinearGradient
            colors={["transparent", rim]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: style.wellBezelSize,
            }}
          />
          <LinearGradient
            colors={["transparent", rim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: style.wellBezelSize,
            }}
          />
        </>
      ) : null}
    </View>
  );
}

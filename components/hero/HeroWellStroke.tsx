/**
 * HeroWellStroke — crisp black outline around the LCD cutout.
 * Rendered above bezels and gloss so the screen edge reads like a punched gadget.
 */
import { StyleSheet, View } from "react-native";

import { useHeroCaseStyle } from "@/hooks/useHeroCaseStyle";

type HeroWellStrokeProps = {
  radius: number;
};

export function HeroWellStroke({ radius }: HeroWellStrokeProps) {
  const style = useHeroCaseStyle();

  if (style.wellStrokeWidth <= 0 || style.wellStrokeOpacity <= 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        ...StyleSheet.absoluteFillObject,
        borderRadius: radius,
        borderCurve: "continuous",
        borderWidth: style.wellStrokeWidth,
        borderColor: `rgba(0, 0, 0, ${style.wellStrokeOpacity})`,
        zIndex: 2,
      }}
    />
  );
}

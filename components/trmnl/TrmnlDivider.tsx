/**
 * TrmnlDivider — Framework divider (border level 6 dither rail).
 */
import { useState } from "react";
import { LayoutChangeEvent, View } from "react-native";

import { useHeroTheme } from "@/hooks/useHeroTheme";
import { borderDotVisible, TRMNL_BORDER_DOT } from "@/lib/trmnlBorders";
import { TRMNL_DIVIDER_LEVEL } from "@/lib/trmnlFramework";

type TrmnlDividerProps = {
  level?: number;
};

export function TrmnlDivider({ level = TRMNL_DIVIDER_LEVEL }: TrmnlDividerProps) {
  const theme = useHeroTheme();
  const [dotCount, setDotCount] = useState(48);

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    const pitch = TRMNL_BORDER_DOT + 2;
    setDotCount(Math.max(16, Math.floor(width / pitch)));
  };

  return (
    <View
      onLayout={onLayout}
      style={{
        width: "100%",
        height: TRMNL_BORDER_DOT,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: dotCount }, (_, index) =>
        borderDotVisible(index, level) ? (
          <View
            key={index}
            style={{
              width: TRMNL_BORDER_DOT,
              height: TRMNL_BORDER_DOT,
              borderRadius: 1,
              backgroundColor: theme.textPrimary,
            }}
          />
        ) : (
          <View key={index} style={{ width: TRMNL_BORDER_DOT, height: TRMNL_BORDER_DOT }} />
        ),
      )}
    </View>
  );
}

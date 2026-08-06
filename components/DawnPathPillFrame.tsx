/**
 * DawnPathPillFrame — raised orange gradient pill with depth lip (Shield CTA pattern).
 */
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { PILL_RADIUS } from "@/lib/cardStyle";
import { colors } from "@/theme/tokens";

export const DAWN_PILL_LIP = "#D96500";
export const DAWN_PILL_GRADIENT = ["#FFB84D", colors.primary] as const;

type DawnPathPillFrameProps = {
  children: ReactNode;
  /** Flat fill instead of the default gradient (e.g. hold-track background). */
  backgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  lipDepth?: number;
};

export function DawnPathPillFrame({
  children,
  backgroundColor,
  contentStyle,
  borderRadius = PILL_RADIUS,
  lipDepth = 4,
}: DawnPathPillFrameProps) {
  return (
    <View
      style={{
        borderRadius,
        borderCurve: "continuous",
        backgroundColor: DAWN_PILL_LIP,
        paddingBottom: lipDepth,
      }}
    >
      <View
        style={{
          borderRadius,
          borderCurve: "continuous",
          overflow: "hidden",
        }}
      >
        {backgroundColor ? (
          <View style={[{ backgroundColor }, contentStyle]}>{children}</View>
        ) : (
          <LinearGradient
            colors={[...DAWN_PILL_GRADIENT]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={contentStyle}
          >
            {children}
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

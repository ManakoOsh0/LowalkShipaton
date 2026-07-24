/**
 * HeroEinkFrame — e-reader bezel with concentric paper screen.
 * Paper radius is derived from the outer frame so corners nest cleanly.
 */
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import {
  HERO_EINK,
  HERO_EINK_BORDER_WIDTH,
  HERO_EINK_FRAME_BG,
  HERO_EINK_FRAME_PADDING,
  HERO_EINK_FRAME_RADIUS,
  HERO_EINK_FRAME_STROKE,
  HERO_EINK_OUTER_HEIGHT,
  HERO_EINK_PAPER_RADIUS,
} from "@/lib/heroEink";
import { getCardShadowStyle } from "@/lib/cardStyle";

type HeroEinkFrameProps = {
  children: ReactNode;
  /** Weekly report — sizes to ledger content; paper bg is layered so labels are not clipped. */
  journey?: boolean;
  /** No footer CTA — frame height follows content instead of the tall fixed shell. */
  compact?: boolean;
};

export function HeroEinkFrame({
  children,
  journey = false,
  compact = false,
}: HeroEinkFrameProps) {
  const colors = useThemeColors();
  const isFluid = journey || compact;

  return (
    <View
      style={{
        ...(isFluid ? { overflow: "visible" as const } : { height: HERO_EINK_OUTER_HEIGHT }),
        borderRadius: HERO_EINK_FRAME_RADIUS,
        borderCurve: "continuous",
        padding: HERO_EINK_FRAME_PADDING,
        backgroundColor: HERO_EINK_FRAME_BG,
        borderWidth: HERO_EINK_BORDER_WIDTH,
        borderColor: HERO_EINK_FRAME_STROKE,
        ...getCardShadowStyle(colors, "md"),
      }}
    >
      {journey ? (
        <View>
          <View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: HERO_EINK_PAPER_RADIUS,
              borderCurve: "continuous",
              backgroundColor: HERO_EINK.paper,
            }}
          />
          {children}
        </View>
      ) : isFluid ? (
        <View
          style={{
            borderRadius: HERO_EINK_PAPER_RADIUS,
            borderCurve: "continuous",
            backgroundColor: HERO_EINK.paper,
            overflow: "hidden",
          }}
        >
          {children}
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            borderRadius: HERO_EINK_PAPER_RADIUS,
            borderCurve: "continuous",
            backgroundColor: HERO_EINK.paper,
            overflow: "hidden",
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

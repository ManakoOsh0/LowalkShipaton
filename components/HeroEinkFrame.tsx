/**
 * HeroEinkFrame — soft framed card with a recessed inner display well.
 */
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { HeroInsetEdge } from "@/components/hero/HeroInsetEdge";
import { HeroSoftFrameShell } from "@/components/hero/HeroSoftFrameShell";
import { HeroWellBezel } from "@/components/hero/HeroWellBezel";
import { HeroWellGloss } from "@/components/hero/HeroWellGloss";
import {
  getHeroInnerWellHeight,
  getHeroOuterHeight,
  HERO_EINK_FRAME_PADDING,
  HERO_EINK_FRAME_RADIUS,
  HERO_EINK_PAPER_RADIUS,
  TRMNL_THEME,
} from "@/lib/heroEink";

type HeroEinkFrameProps = {
  children: ReactNode;
  /** Renders on the outer frame rail below the inner well (e.g. primary CTA). */
  footer?: ReactNode;
};

function getHeroFrameShadowStyle(): ViewStyle {
  return (
    Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.11,
        shadowRadius: 22,
      },
      android: { elevation: 7 },
      default: {
        boxShadow: "0 8px 22px rgba(0, 0, 0, 0.11)",
      },
    }) ?? {
      boxShadow: "0 8px 22px rgba(0, 0, 0, 0.11)",
    }
  );
}

export function HeroEinkFrame({
  children,
  footer,
}: HeroEinkFrameProps) {
  const hasFooter = Boolean(footer);

  return (
    <View style={getHeroFrameShadowStyle()}>
      <View
        style={{
          height: getHeroOuterHeight(hasFooter),
          borderRadius: HERO_EINK_FRAME_RADIUS,
          borderCurve: "continuous",
          padding: HERO_EINK_FRAME_PADDING,
          overflow: "hidden",
        }}
      >
        <HeroSoftFrameShell />

        <View
          style={{
            height: getHeroInnerWellHeight(),
            borderRadius: HERO_EINK_PAPER_RADIUS,
            borderCurve: "continuous",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[TRMNL_THEME.wellBgTop, TRMNL_THEME.wellBgBottom]}
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: HERO_EINK_PAPER_RADIUS,
              borderCurve: "continuous",
            }}
          />
          <HeroWellBezel />
          <HeroWellGloss />
          <HeroInsetEdge edgeSize={14} />
          <View style={{ flex: 1, overflow: "hidden", zIndex: 1 }}>{children}</View>
        </View>

        {footer ? (
          <View style={{ marginTop: HERO_EINK_FRAME_PADDING, zIndex: 1 }}>
            {footer}
          </View>
        ) : null}
      </View>
    </View>
  );
}

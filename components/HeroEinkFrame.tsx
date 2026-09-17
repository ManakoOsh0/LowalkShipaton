/**
 * HeroEinkFrame — framed card with a recessed inner display well.
 * Outer size is fixed; radius and shadows follow the active case style.
 */
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { HeroInsetEdge } from "@/components/hero/HeroInsetEdge";
import { HeroSoftFrameShell } from "@/components/hero/HeroSoftFrameShell";
import { HeroWellBezel } from "@/components/hero/HeroWellBezel";
import { HeroWellGlassOverlay } from "@/components/hero/HeroWellGlassOverlay";
import { HeroWellGloss } from "@/components/hero/HeroWellGloss";
import { HeroWellStroke } from "@/components/hero/HeroWellStroke";
import { useHeroCaseStyle } from "@/hooks/useHeroCaseStyle";
import { useHeroTheme } from "@/hooks/useHeroTheme";
import { getHeroStylePaperRadius } from "@/lib/heroCaseStyle";
import {
  getHeroInnerWellHeight,
  getHeroOuterHeight,
  HERO_EINK_FRAME_PADDING,
} from "@/lib/heroEink";

type HeroEinkFrameProps = {
  children: ReactNode;
  /** Renders on the outer frame rail below the inner well (e.g. primary CTA). */
  footer?: ReactNode;
};

export function HeroEinkFrame({
  children,
  footer,
}: HeroEinkFrameProps) {
  const theme = useHeroTheme();
  const style = useHeroCaseStyle();
  const paperRadius = getHeroStylePaperRadius(style);
  const hasFooter = Boolean(footer);

  return (
    <View
      style={{
        borderRadius: style.radius,
        borderCurve: "continuous",
        boxShadow: style.ambientShadow,
      }}
    >
      <View
        style={{
          borderRadius: style.radius,
          borderCurve: "continuous",
          boxShadow: style.contactShadow,
        }}
      >
        <View
          style={{
            height: getHeroOuterHeight(hasFooter),
            borderRadius: style.radius,
            borderCurve: "continuous",
            padding: HERO_EINK_FRAME_PADDING,
            overflow: "hidden",
            backgroundColor: theme.frameShellTop,
            position: "relative",
          }}
        >
          <HeroSoftFrameShell />

          <View
            style={{
              width: "100%",
              height: getHeroInnerWellHeight(),
              borderRadius: paperRadius,
              borderCurve: "continuous",
              overflow: "hidden",
              zIndex: 1,
            }}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[theme.wellBgTop, theme.wellBgBottom]}
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: paperRadius,
                borderCurve: "continuous",
                zIndex: 0,
              }}
            />
            {/* Recess under copy; glass lens + stroke sit above for inset depth. */}
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]}
            >
              <HeroWellBezel />
              <HeroWellGloss />
            </View>
            <View style={{ flex: 1, overflow: "hidden", zIndex: 2 }}>
              {children}
            </View>
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { zIndex: 3 }]}
            >
              <HeroWellGlassOverlay />
              {style.wellInsetEdge > 0 ? (
                <HeroInsetEdge edgeSize={style.wellInsetEdge} />
              ) : null}
            </View>
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { zIndex: 4 }]}
            >
              <HeroWellStroke radius={paperRadius} />
            </View>
          </View>

          {footer ? (
            <View style={{ marginTop: HERO_EINK_FRAME_PADDING, zIndex: 1 }}>
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

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
    <View style={{ boxShadow: style.ambientShadow }}>
      <View style={{ boxShadow: style.contactShadow }}>
        <View
          style={{
            height: getHeroOuterHeight(hasFooter),
            borderRadius: style.radius,
            borderCurve: "continuous",
            padding: HERO_EINK_FRAME_PADDING,
            overflow: "hidden",
          }}
        >
          <HeroSoftFrameShell />

          <View
            style={{
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
              }}
            />
            <View style={{ flex: 1, overflow: "hidden", zIndex: 1 }}>
              {children}
            </View>
            <HeroWellBezel />
            <HeroWellGloss />
            <HeroWellStroke radius={paperRadius} />
            {style.wellInsetEdge > 0 ? (
              <HeroInsetEdge edgeSize={style.wellInsetEdge} />
            ) : null}
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

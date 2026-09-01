/**
 * HeroLookEditor — case style, swatches, and live preview for hero appearance.
 */
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HeroSoftFrameShell } from "@/components/hero/HeroSoftFrameShell";
import { HeroWellBezel } from "@/components/hero/HeroWellBezel";
import { WidgetPreviewPanel } from "@/components/settings/WidgetPreviewPanel";
import { HeroWellGloss } from "@/components/hero/HeroWellGloss";
import { HeroWellStroke } from "@/components/hero/HeroWellStroke";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useHeroCaseStyle } from "@/hooks/useHeroCaseStyle";
import { useHeroBackgroundColor, useHeroTheme } from "@/hooks/useHeroTheme";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  HERO_BACKGROUND_SWATCHES,
  HERO_CASE_SWATCHES,
  HERO_WELL_SWATCHES,
} from "@/lib/heroAppearance";
import {
  getHeroStylePaperRadius,
  HERO_CASE_STYLES,
  type HeroCaseStyleId,
} from "@/lib/heroCaseStyle";
import { HERO_EINK_FRAME_PADDING } from "@/lib/heroEink";
import { useHeroAppearanceStore } from "@/store/useHeroAppearanceStore";

const CHIP_SIZE = 32;
const CHIP_INNER = 24;
const PREVIEW_HEIGHT = 128;

function SwatchChip({
  label,
  selected,
  colors,
  onPress,
}: {
  label: string;
  selected: boolean;
  colors: readonly [string, string];
  onPress: () => void;
}) {
  const themeColors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        width: CHIP_SIZE,
        height: CHIP_SIZE,
        borderRadius: CHIP_SIZE / 2,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? themeColors.foreground : themeColors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LinearGradient
        colors={colors}
        style={{
          width: CHIP_INNER,
          height: CHIP_INNER,
          borderRadius: CHIP_INNER / 2,
        }}
      />
    </Pressable>
  );
}

function StylePill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderCurve: "continuous",
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.foreground : colors.border,
        backgroundColor: selected ? colors.foreground : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 12,
          lineHeight: 16,
          color: selected ? colors.background : colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SwatchRow({ title, children }: { title: string; children: ReactNode }) {
  const colors = useThemeColors();

  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 12,
          lineHeight: 16,
          color: colors.foregroundSubtle,
        }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{children}</View>
    </View>
  );
}

function HeroLookPreview() {
  const theme = useHeroTheme();
  const style = useHeroCaseStyle();
  const background = useHeroBackgroundColor();
  const paperRadius = getHeroStylePaperRadius(style);

  return (
    <View
      style={{
        backgroundColor: background,
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 16,
      }}
    >
      <View style={{ boxShadow: style.ambientShadow }}>
        <View style={{ boxShadow: style.contactShadow }}>
          <View
            style={{
              height: PREVIEW_HEIGHT,
              borderRadius: style.radius,
              borderCurve: "continuous",
              padding: HERO_EINK_FRAME_PADDING,
              overflow: "hidden",
            }}
          >
            <HeroSoftFrameShell />
            <View
              style={{
                flex: 1,
                borderRadius: paperRadius,
                borderCurve: "continuous",
                overflow: "hidden",
                zIndex: 1,
              }}
            >
              <LinearGradient
                colors={[theme.wellBgTop, theme.wellBgBottom]}
                style={StyleSheet.absoluteFillObject}
              />
              <HeroWellBezel />
              <HeroWellGloss />
              <HeroWellStroke radius={paperRadius} />
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  zIndex: 1,
                }}
              >
                <TrmnlText
                  variant="countdown"
                  numberOfLines={1}
                  style={{ fontSize: 28, lineHeight: 30 }}
                >
                  12:34
                </TrmnlText>
                <TrmnlText variant="labelSmall" color="mutedWell" numberOfLines={1}>
                  FOCUS
                </TrmnlText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export function HeroLookEditor() {
  const colors = useThemeColors();
  const caseId = useHeroAppearanceStore((state) => state.caseId);
  const wellId = useHeroAppearanceStore((state) => state.wellId);
  const backgroundId = useHeroAppearanceStore((state) => state.backgroundId);
  const caseStyleId = useHeroAppearanceStore((state) => state.caseStyleId);
  const setCaseId = useHeroAppearanceStore((state) => state.setCaseId);
  const setWellId = useHeroAppearanceStore((state) => state.setWellId);
  const setBackgroundId = useHeroAppearanceStore((state) => state.setBackgroundId);
  const setCaseStyleId = useHeroAppearanceStore((state) => state.setCaseStyleId);

  return (
    <View
      style={{
        gap: 16,
        paddingTop: 4,
        paddingBottom: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: colors.foregroundSubtle,
        }}
      >
        In-app hero
      </Text>
      <HeroLookPreview />

      <SwatchRow title="Style">
        {HERO_CASE_STYLES.map((pack) => (
          <StylePill
            key={pack.id}
            label={pack.label}
            selected={caseStyleId === pack.id}
            onPress={() => setCaseStyleId(pack.id as HeroCaseStyleId)}
          />
        ))}
      </SwatchRow>

      <SwatchRow title="Case">
        {HERO_CASE_SWATCHES.map((swatch) => (
          <SwatchChip
            key={swatch.id}
            label={swatch.label}
            selected={caseId === swatch.id}
            colors={[swatch.top, swatch.bottom]}
            onPress={() => setCaseId(swatch.id)}
          />
        ))}
      </SwatchRow>

      <SwatchRow title="Background">
        {HERO_BACKGROUND_SWATCHES.map((swatch) => (
          <SwatchChip
            key={swatch.id}
            label={swatch.label}
            selected={backgroundId === swatch.id}
            colors={[swatch.color, swatch.color]}
            onPress={() => setBackgroundId(swatch.id)}
          />
        ))}
      </SwatchRow>

      <SwatchRow title="Screen">
        {HERO_WELL_SWATCHES.map((swatch) => (
          <SwatchChip
            key={swatch.id}
            label={swatch.label}
            selected={wellId === swatch.id}
            colors={[swatch.top, swatch.bottom]}
            onPress={() => setWellId(swatch.id)}
          />
        ))}
      </SwatchRow>

      <WidgetPreviewPanel />

    </View>
  );
}

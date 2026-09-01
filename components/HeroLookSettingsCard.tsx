/**
 * HeroLookSettingsCard — collapsible Settings row for hero case, screen, and background.
 * Hero look is in-app only; home screen widgets use a fixed neutral palette.
 */
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { FormSectionCard } from "@/components/form/FormSectionCard";
import { HeroLookEditor } from "@/components/HeroLookEditor";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  HERO_CASE_SWATCHES,
  HERO_WELL_SWATCHES,
} from "@/lib/heroAppearance";
import { HERO_CASE_STYLES } from "@/lib/heroCaseStyle";
import { useHeroAppearanceStore } from "@/store/useHeroAppearanceStore";

function useHeroLookSummary(): string {
  const caseStyleId = useHeroAppearanceStore((state) => state.caseStyleId);
  const caseId = useHeroAppearanceStore((state) => state.caseId);
  const wellId = useHeroAppearanceStore((state) => state.wellId);

  const styleLabel = HERO_CASE_STYLES.find((pack) => pack.id === caseStyleId)?.label ?? "Style";
  const caseLabel = HERO_CASE_SWATCHES.find((swatch) => swatch.id === caseId)?.label ?? "Case";
  const wellLabel = HERO_WELL_SWATCHES.find((swatch) => swatch.id === wellId)?.label ?? "Screen";

  return `${styleLabel} · ${caseLabel} · ${wellLabel}`;
}

export function HeroLookSettingsCard() {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const summary = useHeroLookSummary();

  return (
    <View style={{ marginBottom: 24 }}>
      <FormSectionCard title="Appearance">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`Hero look, ${summary}`}
          onPress={() => setExpanded((open) => !open)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 14,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 16,
                lineHeight: 22,
                color: colors.foreground,
              }}
            >
              Hero look
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              Hero look is in-app only · widgets stay neutral gray
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.muted}
          />
        </Pressable>

        {expanded ? <HeroLookEditor /> : null}
      </FormSectionCard>
    </View>
  );
}

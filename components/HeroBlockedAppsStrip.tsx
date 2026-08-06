/**
 * Hero blocked-apps CTA — text-only row on the active-session hero card.
 */
import { Pressable, Text } from "react-native";

import { HeroEinkFlash } from "@/components/HeroEinkFlash";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useBlockedAppsRemovalLocked } from "@/hooks/useBlockedAppsRemovalLocked";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  formatTrmnlActionLabel,
  HERO_ACTIVE_BLOCKED_HEIGHT,
  HERO_EINK_BUTTON_RADIUS,
  HERO_EINK_FOOTER_HEIGHT,
  TRMNL_THEME,
} from "@/lib/heroEink";

type HeroBlockedAppsStripProps = {
  onEditPress?: () => void;
  embedded?: boolean;
  compact?: boolean;
  eink?: boolean;
};

export function HeroBlockedAppsStrip({
  onEditPress,
  embedded = false,
  compact = false,
  eink = false,
}: HeroBlockedAppsStripProps) {
  const colors = useThemeColors();
  const apps = useBlockedAppsStore((state) => state.apps);
  const removalLocked = useBlockedAppsRemovalLocked();
  const hasApps = apps.length > 0;

  const label = removalLocked
    ? hasApps
      ? `Manage blocked apps (${apps.length})`
      : "Add blocked apps"
    : hasApps
      ? `Blocked apps (${apps.length})`
      : "Choose distracting apps";

  if (eink) {
    const displayLabel = formatTrmnlActionLabel(label);

    return (
      <HeroEinkFlash
        accessibilityLabel={label}
        onPress={onEditPress}
        baseBackgroundColor={TRMNL_THEME.paper}
        style={{
          marginTop: embedded ? 0 : 14,
          height: compact ? (eink ? HERO_ACTIVE_BLOCKED_HEIGHT : HERO_EINK_FOOTER_HEIGHT) : undefined,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: HERO_EINK_BUTTON_RADIUS,
          borderWidth: 2,
          borderColor: TRMNL_THEME.textPrimary,
          paddingHorizontal: 14,
          paddingVertical: compact ? 0 : 12,
          opacity: 1,
        }}
      >
        {({ inverted }) => (
          <TrmnlText
            variant="action"
            color={inverted ? "inverse" : "ink"}
            numberOfLines={1}
          >
            {displayLabel}
          </TrmnlText>
        )}
      </HeroEinkFlash>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onEditPress}
      style={({ pressed }) => ({
        marginTop: embedded ? 0 : 14,
        height: compact ? 44 : undefined,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: compact ? 22 : 12,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: compact ? colors.surface : colors.card,
        paddingHorizontal: 14,
        paddingVertical: compact ? 0 : 12,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: compact ? 13 : 14,
          lineHeight: compact ? 18 : 20,
          color: colors.foreground,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

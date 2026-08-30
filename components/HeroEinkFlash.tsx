/**
 * HeroEinkFlash — brief paper↔ink invert on deliberate CTA taps.
 */
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useHeroTheme } from "@/hooks/useHeroTheme";
import { HERO_EINK_FLASH_MS, TRMNL_THEME } from "@/lib/heroEink";

type HeroEinkFlashRenderProps = {
  inverted: boolean;
};

type HeroEinkFlashProps = {
  children: (props: HeroEinkFlashRenderProps) => ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  baseBackgroundColor?: string;
};

export function HeroEinkFlash({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
  baseBackgroundColor,
}: HeroEinkFlashProps) {
  const theme = useHeroTheme();
  const [inverted, setInverted] = useState(false);
  const ink = theme.textPrimary;
  const paper = theme.paper;
  const resolvedBase = baseBackgroundColor ?? ink;
  const isDarkButton =
    resolvedBase === ink || resolvedBase === TRMNL_THEME.accent;
  const flashBackground = isDarkButton ? paper : ink;

  const triggerFlash = useCallback(() => {
    setInverted(true);
    setTimeout(() => setInverted(false), HERO_EINK_FLASH_MS);
  }, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled || !onPress}
      onPress={() => {
        if (!onPress) return;
        triggerFlash();
        onPress();
      }}
      style={[
        style,
        {
          backgroundColor: inverted ? flashBackground : resolvedBase,
          borderColor: ink,
        },
      ]}
    >
      {children({ inverted })}
    </Pressable>
  );
}

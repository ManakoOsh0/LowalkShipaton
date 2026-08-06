/**
 * HeroEinkFlash — brief paper↔ink invert on deliberate CTA taps.
 */
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { HERO_EINK, HERO_EINK_FLASH_MS, TRMNL_THEME } from "@/lib/heroEink";

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
  baseBackgroundColor = HERO_EINK.ink,
}: HeroEinkFlashProps) {
  const [inverted, setInverted] = useState(false);
  const isDarkButton =
    baseBackgroundColor === HERO_EINK.ink ||
    baseBackgroundColor === TRMNL_THEME.accent;
  const flashBackground = isDarkButton ? HERO_EINK.paper : HERO_EINK.ink;

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
          backgroundColor: inverted ? flashBackground : baseBackgroundColor,
          borderColor: HERO_EINK.ink,
        },
      ]}
    >
      {children({ inverted })}
    </Pressable>
  );
}

/**
 * NeuCard — polished bordered surface with soft elevation on dark backgrounds.
 * Central primitive for dashboard tiles, badges, and grouped settings rows.
 */
import type { ReactNode } from "react";
import {
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import {
  CARD_RADIUS_MD,
  getPolishedCardInnerStyle,
  getPolishedCardOuterStyle,
  type CardShadowVariant,
} from "@/lib/cardStyle";

type NeuCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /** Soft drop shadow; default sm. Set none for nested surfaces. */
  shadowVariant?: CardShadowVariant | "none";
  backgroundColor?: string;
  onPress?: () => void;
  accessibilityRole?: "button" | "none" | "summary";
  accessibilityLabel?: string;
};

export function NeuCard({
  children,
  style,
  contentStyle,
  borderRadius = CARD_RADIUS_MD,
  shadowVariant = "md",
  backgroundColor,
  onPress,
  accessibilityRole,
  accessibilityLabel,
}: NeuCardProps) {
  const colors = useThemeColors();

  const card = (
    <View
      style={[
        getPolishedCardOuterStyle(colors, borderRadius, shadowVariant),
        style,
      ]}
    >
      <View
        style={[
          getPolishedCardInnerStyle(colors, borderRadius, backgroundColor),
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole ?? "button"}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => ({
          alignSelf: "stretch",
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        })}
      >
        {card}
      </Pressable>
    );
  }

  return card;
}

/** Alias for the flat surface primitive. */
export const SurfaceCard = NeuCard;

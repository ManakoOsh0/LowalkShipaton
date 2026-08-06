/**
 * HeroShieldLine — blocked-apps count; tappable when onPress is provided.
 */
import { Pressable } from "react-native";

import { TrmnlText } from "@/components/trmnl/TrmnlText";

type HeroShieldLineProps = {
  label: string;
  onPress?: () => void;
};

export function HeroShieldLine({ label, onPress }: HeroShieldLineProps) {
  const text = (
    <TrmnlText
      variant="labelSmall"
      color="mutedWell"
      numberOfLines={1}
      style={{ textAlign: "center" }}
    >
      {label}
    </TrmnlText>
  );

  if (!onPress) return text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {text}
    </Pressable>
  );
}

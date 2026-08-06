/**
 * Shield overlay Close CTA — white pill with dark label (matches system block overlays).
 */
import { Pressable, Text } from "react-native";

import { PILL_RADIUS } from "@/lib/cardStyle";
import { SHIELD_CLOSE_LABEL } from "@/lib/shieldOverlayCopy";
import { colors } from "@/theme/tokens";

export { SHIELD_CLOSE_LABEL };

type ShieldOpenLowalkButtonProps = {
  onPress: () => void;
  label?: string;
};

export function ShieldOpenLowalkButton({
  onPress,
  label = SHIELD_CLOSE_LABEL,
}: ShieldOpenLowalkButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: "center",
        minWidth: 260,
        borderRadius: PILL_RADIUS,
        borderCurve: "continuous",
        backgroundColor: "#FFFFFF",
        paddingVertical: 16,
        paddingHorizontal: 64,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 18,
          lineHeight: 24,
          color: colors.background,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

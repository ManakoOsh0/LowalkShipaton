import { ShieldMinimalistic } from "@solar-icons/react-native/Bold";
import { Image, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type BlockedAppIconProps = {
  iconUri?: string | null;
  size?: number;
  radius?: number;
};

/** Launcher icon when available; generic shield fallback for legacy text-only entries. */
export function BlockedAppIcon({ iconUri, size = 36, radius = 10 }: BlockedAppIconProps) {
  const colors = useThemeColors();

  if (iconUri) {
    return (
      <Image
        source={{ uri: iconUri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
        }}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        backgroundColor: colors.surface,
      }}
    >
      <ShieldMinimalistic size={size * 0.5} color={colors.primary} />
    </View>
  );
}

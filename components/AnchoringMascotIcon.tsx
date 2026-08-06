/**
 * Anchoring badge — Lowalk finale logo for on-site anchor setup sheets.
 */
import { Image } from "expo-image";
import { Platform, View } from "react-native";

import { lowalkLogoImage } from "@/constants/images";

type AnchoringMascotIconProps = {
  size?: number;
};

export function AnchoringMascotIcon({ size = 72 }: AnchoringMascotIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
          ios: {
            shadowColor: "#FF8F33",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.42,
            shadowRadius: 16,
          },
          android: {
            elevation: 8,
          },
        }),
      }}
    >
      <Image
        source={lowalkLogoImage}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

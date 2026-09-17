/**
 * Anchoring badge — lowal2.svg mascot for on-site anchor setup sheets.
 */
import { Platform, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { lowal2LogoXml } from "@/constants/lowal2Logo";

type AnchoringMascotIconProps = {
  size?: number;
};

export function AnchoringMascotIcon({ size = 72 }: AnchoringMascotIconProps) {
  return (
    <View
      accessibilityLabel="Lowalk"
      accessibilityRole="image"
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
      <SvgXml xml={lowal2LogoXml} width={size} height={size} />
    </View>
  );
}

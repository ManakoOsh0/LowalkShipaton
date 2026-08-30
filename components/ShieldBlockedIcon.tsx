/**
 * Shield overlay brand mark — lowal2.svg mascot shown above blocked-app copy.
 */
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { lowal2LogoXml } from "@/constants/lowal2Logo";

const LOGO_SIZE = 124;
const LOGO_OFFSET_X = 6;

type ShieldBlockedIconProps = {
  size?: number;
  offsetX?: number;
};

export function ShieldBlockedIcon({
  size = LOGO_SIZE,
  offsetX = LOGO_OFFSET_X,
}: ShieldBlockedIconProps) {
  return (
    <View
      accessibilityLabel="Lowalk"
      accessibilityRole="image"
      style={{ transform: [{ translateX: offsetX }] }}
    >
      <SvgXml xml={lowal2LogoXml} width={size} height={size} />
    </View>
  );
}

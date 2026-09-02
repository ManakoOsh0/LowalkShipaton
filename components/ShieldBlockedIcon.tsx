/**
 * Shield overlay brand mark — lowal2.svg mascot shown above blocked-app copy.
 */
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { lowal2LogoXml } from "@/constants/lowal2Logo";
import {
  SHIELD_BLOCKED_ICON_OFFSET_X,
  SHIELD_BLOCKED_ICON_SIZE,
} from "@/constants/shieldOverlay";

type ShieldBlockedIconProps = {
  size?: number;
  offsetX?: number;
};

export function ShieldBlockedIcon({
  size = SHIELD_BLOCKED_ICON_SIZE,
  offsetX = SHIELD_BLOCKED_ICON_OFFSET_X,
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

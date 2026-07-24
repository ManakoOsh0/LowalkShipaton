/**
 * Shield mascot tile — schedule-card style kind icon with lock badge on the block overlay.
 */
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { FocusNodeKindIcon } from "@/components/FocusNodeKindIcon";
import { ICON_TILE_RADIUS_LG } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FocusNodeKind } from "@/types/focusNode";

const TILE_SIZE = 96;

type ShieldBlockedIconProps = {
  kind: FocusNodeKind;
  size?: number;
};

export function ShieldBlockedIcon({ kind, size = TILE_SIZE }: ShieldBlockedIconProps) {
  const colors = useThemeColors();
  const radius = ICON_TILE_RADIUS_LG * (size / TILE_SIZE);
  const mascotSize = Math.round(size * 0.5);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FocusNodeKindIcon kind={kind} size={mascotSize} />
      </View>

      <View
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: colors.primary,
        }}
      >
        <Ionicons name="lock-closed" size={16} color={colors.primary} />
      </View>
    </View>
  );
}

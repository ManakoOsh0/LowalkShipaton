/**
 * Session-penalty badge — pulsing location pin for the grace-expired lock sheet.
 */
import { View } from "react-native";

import { MascotRadianceRings } from "@/components/MascotRadianceRings";
import { SheetLocationPinIcon } from "@/components/SheetLocationPinIcon";
import { colors } from "@/theme/tokens";

type SessionPenaltyBadgeProps = {
  size?: number;
  color?: string;
  radiating?: boolean;
};

export function SessionPenaltyBadge({
  size = 96,
  color = colors.error,
  radiating = true,
}: SessionPenaltyBadgeProps) {
  return (
    <View style={{ width: size, height: size }}>
      <MascotRadianceRings size={size} color={color} radiating={radiating} />
      <View style={{ position: "absolute", width: size, height: size }}>
        <SheetLocationPinIcon size={size} color={color} />
      </View>
    </View>
  );
}

/**
 * LeaveSessionWarningBadge — outlined pin with pulsing warning radiance for leave sheets.
 */
import { View } from "react-native";

import { SheetLocationPinIcon } from "@/components/SheetLocationPinIcon";
import { MascotRadianceRings } from "@/components/MascotRadianceRings";
import { SHEET_CAUTION_YELLOW } from "@/lib/sheetMascotTone";

type LeaveSessionWarningBadgeProps = {
  size?: number;
  color?: string;
  radiating?: boolean;
};

export function LeaveSessionWarningBadge({
  size = 96,
  color = SHEET_CAUTION_YELLOW,
  radiating = true,
}: LeaveSessionWarningBadgeProps) {
  return (
    <View style={{ width: size, height: size }}>
      <MascotRadianceRings size={size} color={color} radiating={radiating} />
      <View style={{ position: "absolute", width: size, height: size }}>
        <SheetLocationPinIcon size={size} color={color} />
      </View>
    </View>
  );
}

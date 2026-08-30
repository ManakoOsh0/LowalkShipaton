/**
 * ArrivalMascotBadge — verified pin with pulsing radiance rings for celebration sheets.
 */
import { View } from "react-native";

import { ArrivalMascotIcon } from "@/components/ArrivalMascotIcon";
import { MascotRadianceRings } from "@/components/MascotRadianceRings";

type ArrivalMascotBadgeProps = {
  size?: number;
  color?: string;
  /** Expanding glow rings behind the pin halo. */
  radiating?: boolean;
};

export function ArrivalMascotBadge({
  size = 96,
  color = "#3DB96E",
  radiating = true,
}: ArrivalMascotBadgeProps) {
  return (
    <View style={{ width: size, height: size }}>
      <MascotRadianceRings size={size} color={color} radiating={radiating} />
      <View style={{ position: "absolute", width: size, height: size }}>
        <ArrivalMascotIcon size={size} color={color} />
      </View>
    </View>
  );
}

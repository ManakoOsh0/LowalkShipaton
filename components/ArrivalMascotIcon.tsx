/**
 * Arrival badge — verified map pin for geofence arrival.
 * Head glow matches leave-warning pin sizing; check marks verified arrival.
 */
import Svg, { Circle, G, Path } from "react-native-svg";

import {
  MAP_PIN_ARRIVAL_CHECK_LOCAL,
  MAP_PIN_HALO_CY,
  MAP_PIN_HALO_RADIUS,
  MAP_PIN_INNER_HOLE_PATH,
  MAP_PIN_PATH,
  mapPinTransformString,
} from "@/constants/sheetPinArt";

type ArrivalMascotIconProps = {
  size?: number;
  /** Pin body color. */
  color?: string;
  /** Check inside the pin head — defaults to Lowalk surface ink. */
  checkColor?: string;
  /** Inner badge behind the check — defaults to white. */
  badgeColor?: string;
};

export function ArrivalMascotIcon({
  size = 72,
  color = "#3DB96E",
  checkColor = "#141210",
  badgeColor = "#FFFFFF",
}: ArrivalMascotIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <Circle
        cx="40"
        cy={MAP_PIN_HALO_CY}
        r={MAP_PIN_HALO_RADIUS + 5}
        fill={color}
        opacity={0.07}
      />
      <Circle
        cx="40"
        cy={MAP_PIN_HALO_CY}
        r={MAP_PIN_HALO_RADIUS}
        fill={color}
        opacity={0.15}
      />

      <G transform={mapPinTransformString()}>
        <Path d={MAP_PIN_PATH} fill={color} fillRule="evenodd" />
        <Path d={MAP_PIN_INNER_HOLE_PATH} fill={badgeColor} />
        <Path fill={checkColor} d={MAP_PIN_ARRIVAL_CHECK_LOCAL} />
      </G>
    </Svg>
  );
}

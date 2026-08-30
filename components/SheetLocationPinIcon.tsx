/**
 * SheetLocationPinIcon — location pin for session sheet mascots (radiance handled by badge).
 */
import Svg, { Circle, G, Path } from "react-native-svg";

import {
  MAP_PIN_HALO_CY,
  MAP_PIN_HALO_RADIUS,
  MAP_PIN_PATH,
  mapPinTransformString,
} from "@/constants/sheetPinArt";

type SheetLocationPinIconProps = {
  size?: number;
  color: string;
};

export function SheetLocationPinIcon({
  size = 72,
  color,
}: SheetLocationPinIconProps) {
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
      </G>
    </Svg>
  );
}

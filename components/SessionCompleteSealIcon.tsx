/**
 * SessionCompleteSealIcon — verified seal from the session-complete reference SVG.
 */
import Svg, { Path } from "react-native-svg";

import {
  SESSION_COMPLETE_CHECK_PATH,
  SESSION_COMPLETE_SEAL_PATH,
} from "@/constants/sessionCompleteSeal";

type SessionCompleteSealIconProps = {
  size?: number;
  color?: string;
  checkColor?: string;
};

export function SessionCompleteSealIcon({
  size = 96,
  color = "#4CAF50",
  checkColor = "#FFFFFF",
}: SessionCompleteSealIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill={color} d={SESSION_COMPLETE_SEAL_PATH} />
      <Path fill={checkColor} d={SESSION_COMPLETE_CHECK_PATH} />
    </Svg>
  );
}

/**
 * Arrival mascot — friendly location pin shown on the geofence arrival card.
 */
import Svg, { Circle, Path } from "react-native-svg";

const VIEWBOX_SIZE = 100;

type ArrivalMascotIconProps = {
  size?: number;
};

export function ArrivalMascotIcon({ size = 72 }: ArrivalMascotIconProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
      <Path
        fill="#fb7369"
        d="M81.48,43.48c0-17.44-14.18-31.57-31.65-31.48-16.54.09-30.57,13.61-31.28,30.13-.75,17.37,10.05,33.5,24.02,42.99.7.48,1.42.94,2.15,1.39,3.42,2.11,7.78,1.93,11.14-.26,13.56-8.84,25.63-26.06,25.63-42.77Z"
      />
      <Circle cx="50.01" cy="40.83" r="11.83" fill="#fff" />
      <Circle cx="40.5" cy="65.5" r="5.5" fill="#fff" />
      <Circle cx="59.5" cy="65.5" r="5.5" fill="#fff" />
      <Path
        fill="#4a254b"
        d="M46.57,71c-.31,0-.54.28-.49.59.3,1.9,1.94,3.36,3.92,3.36s3.63-1.46,3.92-3.36c.05-.31-.18-.59-.49-.59h-6.86Z"
      />
      <Circle cx="40.5" cy="65.5" r="2.5" fill="#4a254b" />
      <Circle cx="59.5" cy="65.5" r="2.5" fill="#4a254b" />
    </Svg>
  );
}

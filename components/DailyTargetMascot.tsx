/**
 * DailyTargetMascot — trophy buddy on the Daily Goal card.
 * Full color when today's sessions are complete; muted when still in progress.
 */
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

import type { ThemeColors } from "@/theme/tokens";

const VIEWBOX_SIZE = 100;

const ACTIVE = {
  body: "#fec524",
  crown: "#fb7369",
  white: "#ffffff",
  detail: "#4a254b",
} as const;

function inactivePalette(colors: ThemeColors) {
  return {
    body: colors.border,
    crown: "#D1D5DB",
    white: "#ECEFF3",
    detail: colors.muted,
  };
}

type DailyTargetMascotProps = {
  active: boolean;
  size?: number;
  colors: ThemeColors;
};

export function DailyTargetMascot({ active, size = 64, colors }: DailyTargetMascotProps) {
  const palette = active ? ACTIVE : inactivePalette(colors);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
      <Path
        fill={palette.body}
        d="M78.04,26.26c0-1.97-.11-3.9-.31-5.78h-.03c-1.05-8.23-24.93-8.48-27.7-8.48s-26.66.25-27.7,8.48h-.03c-.2,1.89-.31,3.82-.31,5.78,0,18.89,9.54,34.66,22.24,38.41l-1.05,6.78c-.44,2.86-1.84,5.54-4.09,7.36-2.31,1.87-3.76,4.39-3.9,7.18h29.69c-.14-2.79-1.59-5.31-3.9-7.18-2.25-1.82-3.65-4.5-4.09-7.36l-1.05-6.78c12.7-3.74,22.24-19.51,22.24-38.41Z"
      />
      <Path
        fill={palette.body}
        d="M26.36,24.24c-7.62,0-13.83,6.2-13.83,13.83s6.2,13.83,13.83,13.83c.29,0,.58-.03.86-.04.13.03.27.04.41.04,1.69,0,3.06,1.37,3.06,3.06s-1.37,3.06-3.06,3.06c-1.1,0-2,.9-2,2s.9,2,2,2c3.89,0,7.06-3.17,7.06-7.06,0-1.81-.69-3.46-1.81-4.71,4.34-2.34,7.3-6.92,7.3-12.19,0-7.63-6.2-13.83-13.83-13.83Zm0,23.66c-5.42,0-9.83-4.41-9.83-9.83s4.41-9.83,9.83-9.83,9.83,4.41,9.83,9.83-4.41,9.83-9.83,9.83Z"
      />
      <Path
        fill={palette.body}
        d="M72.36,51.9c.14,0,.28-.02.41-.04.29.02.57.04.86.04,7.62,0,13.83-6.2,13.83-13.83s-6.2-13.83-13.83-13.83-13.83,6.2-13.83,13.83c0,5.27,2.96,9.85,7.3,12.19-1.12,1.25-1.81,2.9-1.81,4.71,0,3.9,3.17,7.06,7.06,7.06,1.1,0,2-.9,2-2s-.9-2-2-2c-1.69,0-3.06-1.37-3.06-3.06s1.37-3.06,3.06-3.06Zm-8.55-13.83c0-5.42,4.41-9.83,9.83-9.83s9.83,4.41,9.83,9.83-4.41,9.83-9.83,9.83-9.83-4.41-9.83-9.83Z"
      />
      <Circle cx="40.5" cy="45.51" r="5.5" fill={palette.white} />
      <Circle cx="59.5" cy="45.51" r="5.5" fill={palette.white} />
      <Path
        fill={palette.detail}
        d="M46.57,51.01c-.31,0-.54.28-.49.59.3,1.9,1.94,3.36,3.92,3.36s3.63-1.46,3.92-3.36c.05-.31-.18-.59-.49-.59h-6.86Z"
      />
      <Circle cx="40.5" cy="45.51" r="2.5" fill={palette.detail} />
      <Circle cx="59.5" cy="45.51" r="2.5" fill={palette.detail} />
      <Path
        fill={palette.detail}
        d="M50,66.44c-.9,0-1.81-.06-2.7-.18-.27-.04-.47-.29-.43-.56.04-.27.29-.46.56-.43,2.66.36,5.42.15,8.04-.61.27-.08.54.08.62.34.08.27-.08.54-.34.62-1.88.55-3.82.82-5.75.82Z"
      />
      <Path
        fill={palette.detail}
        d="M78.23,31.12s-.04,0-.05,0c-.27-.03-.47-.27-.45-.55.21-2.05.32-4.15.32-6.26,0-.28.22-.5.5-.5s.5.22.5.5c0,2.14-.11,4.28-.33,6.36-.03.26-.24.45-.5.45Z"
      />
      <Path
        fill={palette.detail}
        d="M21.76,31c-.25,0-.47-.19-.5-.45-.2-1.94-.3-3.93-.32-5.92,0-.28.22-.5.5-.5h0c.28,0,.5.22.5.5.01,1.96.12,3.92.31,5.82.03.27-.17.52-.45.55-.02,0-.03,0-.05,0Z"
      />
      <Ellipse cx="50" cy="85.99" rx="14.85" ry="2.01" fill={palette.body} />
      <Path
        fill={palette.crown}
        d="M50,25.08c11.88,0,19.78-2.13,22.15-3.69.25-.16.25-.53,0-.7-2.36-1.57-10.27-3.69-22.15-3.69s-19.78,2.13-22.15,3.69c-.25.16-.25.53,0,.7,2.36,1.57,10.27,3.69,22.15,3.69Z"
      />
    </Svg>
  );
}

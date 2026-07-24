/**
 * ProgressRing — circular progress indicator for daily goal summary.
 */
import Svg, { Circle } from "react-native-svg";
import { View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
};

export function ProgressRing({
  progress,
  size = 56,
  strokeWidth = 5,
}: ProgressRingProps) {
  const colors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clamped);
  const isComplete = clamped >= 1;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isComplete ? colors.success : colors.skyDeep}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
}

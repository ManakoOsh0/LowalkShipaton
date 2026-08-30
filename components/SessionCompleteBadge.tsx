/**
 * SessionCompleteBadge — verified seal on a soft circular halo for the Done screen.
 */
import { View } from "react-native";

import { SessionCompleteSealIcon } from "@/components/SessionCompleteSealIcon";

type SessionCompleteBadgeProps = {
  size?: number;
  color?: string;
  haloColor?: string;
};

export function SessionCompleteBadge({
  size = 104,
  color = "#3DB96E",
  haloColor = "rgba(255, 255, 255, 0.08)",
}: SessionCompleteBadgeProps) {
  const sealSize = Math.round(size * 0.62);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: haloColor,
        }}
      />
      <SessionCompleteSealIcon size={sealSize} color={color} />
    </View>
  );
}

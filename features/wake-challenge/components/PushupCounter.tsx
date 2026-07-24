import { Text, View } from "react-native";

import type { PushupMetrics } from "@/features/wake-challenge/types";
import type { PushupPhase } from "@/features/wake-challenge/types";

type PushupCounterProps = {
  metrics: PushupMetrics | null;
  phase: PushupPhase;
  visible?: boolean;
};

/** Dev overlay for elbow angles, alignment, and phase while tuning detection. */
export function PushupCounter({ metrics, phase, visible = __DEV__ }: PushupCounterProps) {
  if (!visible || !metrics) {
    return null;
  }

  return (
    <View className="absolute bottom-28 left-4 rounded-xl bg-black/70 px-3 py-2">
      <Text className="font-mono text-xs text-white">
        L elbow: {metrics.leftElbowAngle.toFixed(0)}°
      </Text>
      <Text className="font-mono text-xs text-white">
        R elbow: {metrics.rightElbowAngle.toFixed(0)}°
      </Text>
      <Text className="font-mono text-xs text-white">
        Body: {metrics.bodyAngle.toFixed(0)}° ({metrics.hasStraightBody ? "valid" : "invalid"})
      </Text>
      <Text className="font-mono text-xs text-white">
        Phase: {phase.toUpperCase()}
      </Text>
    </View>
  );
}

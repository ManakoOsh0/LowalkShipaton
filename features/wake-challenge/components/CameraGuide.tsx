import { Text, View } from "react-native";

import type { PoseStatus } from "@/features/wake-challenge/types";
import { getPoseInstruction } from "@/features/wake-challenge/utils/pushupStateMachine";

type CameraGuideProps = {
  status: PoseStatus;
  instruction?: string;
};

/** Live positioning and coaching copy for the wake challenge camera setup. */
export function CameraGuide({ status, instruction }: CameraGuideProps) {
  const message = instruction ?? getPoseInstruction(status);

  return (
    <View className="mt-3 max-w-sm items-center px-6">
      <Text className="text-center text-base text-white/70">{message}</Text>
    </View>
  );
}

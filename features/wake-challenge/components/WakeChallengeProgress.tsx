import { Text, View } from "react-native";

type WakeChallengeProgressProps = {
  count: number;
  target: number;
};

/** Large rep counter overlay for the active wake challenge. */
export function WakeChallengeProgress({ count, target }: WakeChallengeProgressProps) {
  return (
    <View className="items-center">
      <Text className="text-sm uppercase tracking-widest text-white">Wake Challenge</Text>
      <Text className="mt-4 text-7xl font-semibold text-white">
        {count}
        <Text className="text-3xl text-white/50"> / {target}</Text>
      </Text>
    </View>
  );
}

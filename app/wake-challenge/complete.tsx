import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useWakeChallengeStore } from "@/features/wake-challenge/store/wakeChallengeStore";
import { useThemeColors } from "@/hooks/useThemeColors";

/** Success screen after the user completes the required push-up count. */
export default function WakeChallengeCompleteScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const count = useWakeChallengeStore((state) => state.count);
  const target = useWakeChallengeStore((state) => state.targetReps);
  const resetChallenge = useWakeChallengeStore((state) => state.resetChallenge);

  const handleDone = () => {
    resetChallenge();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 28,
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          You&apos;re awake
        </Text>
        <Text
          style={{
            marginTop: 12,
            fontFamily: "Poppins-Regular",
            fontSize: 16,
            lineHeight: 24,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          {count} / {target} push-ups completed. Alarm stopped.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={handleDone}
          style={{
            marginTop: 32,
            borderRadius: 999,
            backgroundColor: colors.primary,
            paddingHorizontal: 28,
            paddingVertical: 14,
          }}
        >
          <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 16, color: "#141210" }}>
            Back to Home
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

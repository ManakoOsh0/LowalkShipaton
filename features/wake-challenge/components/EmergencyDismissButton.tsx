import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

const HOLD_DURATION_MS = 10_000;

type EmergencyDismissButtonProps = {
  onDismiss: () => void;
};

/** Hold-to-dismiss escape hatch for injury, illness, or camera failure. */
export function EmergencyDismissButton({ onDismiss }: EmergencyDismissButtonProps) {
  const [progress, setProgress] = useState(0);
  const holdStartedAtRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const tick = () => {
    if (holdStartedAtRef.current == null) return;

    const elapsed = Date.now() - holdStartedAtRef.current;
    const nextProgress = Math.min(1, elapsed / HOLD_DURATION_MS);
    setProgress(nextProgress);

    if (nextProgress >= 1) {
      holdStartedAtRef.current = null;
      onDismiss();
      return;
    }

    frameRef.current = requestAnimationFrame(tick);
  };

  const handlePressIn = () => {
    holdStartedAtRef.current = Date.now();
    frameRef.current = requestAnimationFrame(tick);
  };

  const handlePressOut = () => {
    holdStartedAtRef.current = null;
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setProgress(0);
  };

  return (
    <View className="absolute inset-x-0 bottom-8 items-center px-6">
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Hold for ten seconds to dismiss the alarm. This will break today's wake streak."
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-black/50"
      >
        <View
          className="absolute inset-y-0 left-0 bg-red-500/30"
          style={{ width: `${progress * 100}%` }}
        />
        <View className="px-4 py-4">
          <Text className="text-center text-sm font-medium text-white">Emergency dismiss</Text>
          <Text className="mt-1 text-center text-xs text-white/60">
            Hold for 10 seconds — breaks today&apos;s streak
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

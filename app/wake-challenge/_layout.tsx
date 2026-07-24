/**
 * Wake challenge stack — disables back navigation while the alarm challenge is active.
 */
import { Stack } from "expo-router";

export default function WakeChallengeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: "fade",
      }}
    />
  );
}

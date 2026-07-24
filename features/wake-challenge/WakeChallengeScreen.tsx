import { useEffect } from "react";
import { View } from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";
import { useRouter } from "expo-router";

import { CameraGuide } from "@/features/wake-challenge/components/CameraGuide";
import { EmergencyDismissButton } from "@/features/wake-challenge/components/EmergencyDismissButton";
import { PoseCamera } from "@/features/wake-challenge/components/PoseCamera";
import { PushupCounter } from "@/features/wake-challenge/components/PushupCounter";
import { WakeChallengeProgress } from "@/features/wake-challenge/components/WakeChallengeProgress";
import { usePoseDetection } from "@/features/wake-challenge/hooks/usePoseDetection";
import { usePushupCounter } from "@/features/wake-challenge/hooks/usePushupCounter";
import {
  startAlarmSound,
  stopAlarmSound,
} from "@/features/wake-challenge/services/alarmService";
import { useWakeChallengeStore } from "@/features/wake-challenge/store/wakeChallengeStore";
import { ROUTES } from "@/lib/routes";
import { useUserStore } from "@/store/useUserStore";

/**
 * Full-screen push-up challenge shown when the wake alarm fires.
 * Alarm audio continues until reps are complete or emergency dismiss is used.
 */
export function WakeChallengeScreen() {
  const router = useRouter();
  const status = useWakeChallengeStore((state) => state.status);
  const count = useWakeChallengeStore((state) => state.count);
  const target = useWakeChallengeStore((state) => state.targetReps);
  const poseStatus = useWakeChallengeStore((state) => state.poseStatus);
  const phase = useWakeChallengeStore((state) => state.phase);
  const completeChallenge = useWakeChallengeStore((state) => state.completeChallenge);
  const emergencyDismiss = useWakeChallengeStore((state) => state.emergencyDismiss);
  const breakStreakForEmergency = useUserStore((state) => state.breakStreakForEmergency);

  const isActive = status === "active";
  const { pose, handleRawPose } = usePoseDetection(isActive);
  const { metrics, instruction } = usePushupCounter({ pose, enabled: isActive });

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      void ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;

    void startAlarmSound();
    void activateKeepAwakeAsync("wake-challenge");

    return () => {
      void deactivateKeepAwake("wake-challenge");
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || count < target) {
      return;
    }

    completeChallenge();
    void stopAlarmSound();
    router.replace(ROUTES.wakeChallengeComplete);
  }, [completeChallenge, count, isActive, router, target]);

  const handleEmergencyDismiss = () => {
    emergencyDismiss();
    breakStreakForEmergency();
    void stopAlarmSound();
    router.replace("/(tabs)/settings");
  };

  return (
    <View className="flex-1 bg-black">
      <PoseCamera isActive={isActive} onPoseDetected={handleRawPose} />

      <View className="absolute inset-x-0 top-10 items-center">
        <WakeChallengeProgress count={count} target={target} />
        <CameraGuide status={poseStatus} instruction={instruction} />
      </View>

      <PushupCounter metrics={metrics} phase={phase} />
      <EmergencyDismissButton onDismiss={handleEmergencyDismiss} />
    </View>
  );
}

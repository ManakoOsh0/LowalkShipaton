import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  isWakeAlarmNotificationData,
  isWakeAlarmSupported,
  scheduleWakeAlarms,
  startAlarmSound,
} from "@/features/wake-challenge/services/alarmService";
import { useWakeChallengeStore } from "@/features/wake-challenge/store/wakeChallengeStore";
import { ROUTES } from "@/lib/routes";
import { useWakeAlarmStore } from "@/store/useWakeAlarmStore";

function openWakeChallenge(
  router: ReturnType<typeof useRouter>,
  targetReps: number,
): void {
  const challenge = useWakeChallengeStore.getState();
  if (challenge.status !== "active") {
    useWakeChallengeStore.getState().startChallenge(targetReps);
  }
  void startAlarmSound();
  router.push(ROUTES.wakeChallenge);
}

/** Handles wake-alarm notification taps and resumes an active challenge on cold start. */
export function useWakeChallengeLifecycle(): void {
  const router = useRouter();
  const targetReps = useWakeAlarmStore((state) => state.targetReps);
  const status = useWakeChallengeStore((state) => state.status);
  const handledInitialNotification = useRef(false);

  useEffect(() => {
    if (!isWakeAlarmSupported()) return;

    const handleNotificationResponse = (
      response: Notifications.NotificationResponse | null,
    ) => {
      const data = response?.notification.request.content.data as Record<string, unknown>;
      if (!isWakeAlarmNotificationData(data)) return;
      openWakeChallenge(router, targetReps);
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (!isWakeAlarmNotificationData(data)) return;
      openWakeChallenge(router, targetReps);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (handledInitialNotification.current) return;
      handledInitialNotification.current = true;
      handleNotificationResponse(response);
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [router, targetReps]);

  useEffect(() => {
    if (!isWakeAlarmSupported()) return;
    if (status !== "active") return;

    void startAlarmSound();
    router.push(ROUTES.wakeChallenge);
  }, [router, status]);

  useEffect(() => {
    if (!isWakeAlarmSupported()) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;

      const config = useWakeAlarmStore.getState();
      void scheduleWakeAlarms({
        enabled: config.enabled,
        hour: config.hour,
        minute: config.minute,
        repeatDays: config.repeatDays,
        targetReps: config.targetReps,
      });
    });

    return () => subscription.remove();
  }, []);
}

/** Dev helper — opens the challenge screen without waiting for a scheduled alarm. */
export function startTestWakeChallenge(
  router: ReturnType<typeof useRouter>,
  targetReps: number,
): void {
  openWakeChallenge(router, targetReps);
}

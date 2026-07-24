import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { Coordinates } from "@/lib/geo";
import {
  getForegroundPermissionStatus,
  getPresencePosition,
  type LocationPermissionStatus,
} from "@/services/location";

type ForegroundLocationState = {
  position: Coordinates | null;
  /** False when the latest fix is too coarse for presence verification. */
  accurateEnough: boolean;
  permission: LocationPermissionStatus;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Polls foreground GPS while enabled — drives presence states app-wide via SessionPresenceProvider.
 * Refreshes immediately when the app returns to the foreground during an active session.
 */
export function useForegroundLocation(
  enabled: boolean,
  pollIntervalMs = 5000,
): ForegroundLocationState {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [accurateEnough, setAccurateEnough] = useState(true);
  const [permission, setPermission] = useState<LocationPermissionStatus>("undetermined");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!enabled) return;

    setIsLoading(true);
    const currentPermission = await getForegroundPermissionStatus();
    setPermission(currentPermission);

    const result = await getPresencePosition();
    setIsLoading(false);

    if (!result.success) {
      setError(result.error);
      setAccurateEnough(false);
      return;
    }

    setError(null);
    setAccurateEnough(result.accurateEnough);
    // Keep last good position for pause/resume; verification ignores inaccurate fixes.
    setPosition(result.position);
  };

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      setAccurateEnough(true);
      setError(null);
      return;
    }

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [enabled, pollIntervalMs]);

  // Resume-on-return: catch up presence state after backgrounding without a native geofence task.
  useEffect(() => {
    if (!enabled) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void refresh();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [enabled]);

  return {
    position,
    accurateEnough,
    permission,
    isLoading,
    error,
    refresh,
  };
}

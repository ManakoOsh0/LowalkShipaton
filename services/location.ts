import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { MAX_PRESENCE_ACCURACY_METERS, type Coordinates } from "@/lib/geo";

export type LocationPermissionStatus = "undetermined" | "granted" | "denied";

export type CurrentPositionResult =
  | { success: true; position: Coordinates; accuracyMeters: number | null }
  | { success: false; error: string };

export type PresencePositionResult =
  | { success: true; position: Coordinates; accuracyMeters: number | null; accurateEnough: boolean }
  | { success: false; error: string };

/** Task name shared with tasks/sessionLocationTask.ts — must match exactly. */
export const LOWALK_SESSION_LOCATION_TASK = "LOWALK_SESSION_LOCATION_TASK";

/** PoC background poll interval — balance battery vs pause/resume responsiveness. */
const BACKGROUND_TIME_INTERVAL_MS = 20_000;
const BACKGROUND_DISTANCE_INTERVAL_M = 10;

/** Requests foreground location access. */
export async function requestForegroundLocationPermission(): Promise<LocationPermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  if (status === Location.PermissionStatus.DENIED) return "denied";
  return "undetermined";
}

export async function getForegroundPermissionStatus(): Promise<LocationPermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  if (status === Location.PermissionStatus.DENIED) return "denied";
  return "undetermined";
}

/**
 * Requests background ("Always") location — must run after foreground is granted.
 * Denial is non-fatal; foreground polling remains the fallback.
 */
export async function requestBackgroundLocationPermission(): Promise<LocationPermissionStatus> {
  const foreground = await getForegroundPermissionStatus();
  if (foreground !== "granted") {
    const requested = await requestForegroundLocationPermission();
    if (requested !== "granted") return "denied";
  }

  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  if (status === Location.PermissionStatus.DENIED) return "denied";
  return "undetermined";
}

export async function getBackgroundPermissionStatus(): Promise<LocationPermissionStatus> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  if (status === Location.PermissionStatus.DENIED) return "denied";
  return "undetermined";
}

/** Reads a single high-accuracy GPS fix for anchoring or presence checks. */
export async function getCurrentPosition(): Promise<CurrentPositionResult> {
  const permission = await getForegroundPermissionStatus();
  if (permission !== "granted") {
    const requested = await requestForegroundLocationPermission();
    if (requested !== "granted") {
      return {
        success: false,
        error: "Location permission is required to verify your presence.",
      };
    }
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      success: true,
      position: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      accuracyMeters: position.coords.accuracy,
    };
  } catch {
    return {
      success: false,
      error: "Unable to read your GPS position. Try again outdoors or near a window.",
    };
  }
}

/**
 * GPS fix for presence ticks — marks fixes too coarse for verification so the
 * engine can wait rather than auto-starting from a bounced indoor estimate.
 */
export async function getPresencePosition(): Promise<PresencePositionResult> {
  const result = await getCurrentPosition();
  if (!result.success) return result;

  const accuracy = result.accuracyMeters;
  const accurateEnough =
    accuracy == null || accuracy <= MAX_PRESENCE_ACCURACY_METERS;

  return {
    success: true,
    position: result.position,
    accuracyMeters: accuracy,
    accurateEnough,
  };
}

export async function isSessionLocationTaskRegistered(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(LOWALK_SESSION_LOCATION_TASK);
}

/**
 * Starts background location updates for an active focus window.
 * Requires a dev build — Expo Go does not support background location.
 */
export async function startSessionLocationTracking(): Promise<{ success: boolean; error?: string }> {
  const foreground = await getForegroundPermissionStatus();
  if (foreground !== "granted") {
    return { success: false, error: "Foreground location permission is required." };
  }

  const alreadyRegistered = await isSessionLocationTaskRegistered();
  if (alreadyRegistered) {
    return { success: true };
  }

  const background = await getBackgroundPermissionStatus();
  if (background !== "granted") {
    const requested = await requestBackgroundLocationPermission();
    if (requested !== "granted") {
      return {
        success: false,
        error: "Background location is required for sessions while the app is closed.",
      };
    }
  }

  try {
    await Location.startLocationUpdatesAsync(LOWALK_SESSION_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: BACKGROUND_TIME_INTERVAL_MS,
      distanceInterval: BACKGROUND_DISTANCE_INTERVAL_M,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Lowalk focus session",
        notificationBody: "Verifying you are at your Focus Node.",
        notificationColor: "#FF7700",
      },
    });
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start background location tracking.";
    return { success: false, error: message };
  }
}

export async function stopSessionLocationTracking(): Promise<void> {
  const registered = await isSessionLocationTaskRegistered();
  if (!registered) return;

  try {
    await Location.stopLocationUpdatesAsync(LOWALK_SESSION_LOCATION_TASK);
  } catch {
    // Task may already be stopped after process kill — safe to ignore for PoC.
  }
}

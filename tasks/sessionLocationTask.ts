/**
 * Headless background location task — runs presence tick when the app is backgrounded.
 * Imported at app entry so TaskManager registers before location updates start.
 */
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { recordBackgroundLocationError, recordBackgroundLocationFix } from "@/lib/backgroundPresenceDebug";
import { MAX_PRESENCE_ACCURACY_METERS } from "@/lib/geo";
import { runPresenceTick } from "@/lib/presenceEngine";
import { LOWALK_SESSION_LOCATION_TASK } from "@/services/location";

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

TaskManager.defineTask(LOWALK_SESSION_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    recordBackgroundLocationError(error.message);
    return;
  }

  const locations = (data as LocationTaskData | undefined)?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest) return;

  recordBackgroundLocationFix(latest.timestamp);

  const accuracy = latest.coords.accuracy;
  const accurateEnough =
    accuracy == null || accuracy <= MAX_PRESENCE_ACCURACY_METERS;

  runPresenceTick(
    {
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
    },
    Date.now(),
    accurateEnough,
  );
});

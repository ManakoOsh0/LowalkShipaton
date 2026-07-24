import { useEffect, useRef, useState } from "react";

import { getPresenceTrackingContext } from "@/lib/presenceEngine";
import {
  startSessionLocationTracking,
  stopSessionLocationTracking,
} from "@/services/location";
import { useScheduleStore } from "@/store/useScheduleStore";

/**
 * Registers background location updates while a focus window needs GPS presence.
 * Stops tracking when the session ends or the schedule window closes.
 */
export function useBackgroundPresence(): void {
  const activeSession = useScheduleStore((state) => state.activeSession);
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const [scheduleTick, setScheduleTick] = useState(0);
  const trackingRef = useRef(false);

  // Re-check when a schedule window opens/closes without a store mutation.
  useEffect(() => {
    const interval = setInterval(() => setScheduleTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void scheduleTick;
    const { needsLocation } = getPresenceTrackingContext();
    let cancelled = false;

    const syncTracking = async () => {
      if (!needsLocation) {
        if (trackingRef.current) {
          await stopSessionLocationTracking();
          trackingRef.current = false;
        }
        return;
      }

      const result = await startSessionLocationTracking();
      if (cancelled) return;

      trackingRef.current = result.success;
    };

    void syncTracking();

    return () => {
      cancelled = true;
    };
  }, [activeSession, focusNodes, anchors, scheduleTick]);

  useEffect(() => {
    return () => {
      if (trackingRef.current) {
        void stopSessionLocationTracking();
        trackingRef.current = false;
      }
    };
  }, []);
}

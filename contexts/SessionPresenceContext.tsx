import { createContext, useContext } from "react";

import type { PresenceContext } from "@/store/selectors";

const EMPTY_PRESENCE: PresenceContext = {
  userPosition: null,
  isInsideGeofence: false,
  verificationSecondsRemaining: null,
  locationUnavailable: false,
  backgroundLocationDenied: false,
};

export const SessionPresenceContext = createContext<PresenceContext>(EMPTY_PRESENCE);

export function useSessionPresence(): PresenceContext {
  return useContext(SessionPresenceContext);
}

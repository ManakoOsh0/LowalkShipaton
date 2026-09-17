import { useEffect, useState } from "react";

import { readWidgetPremiumMirror } from "@/lib/widgetPremiumMirror";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

/** True when home-screen widgets should be unlocked (RevenueCat or local purchase mirror). */
export function useWidgetPremiumAccess(): boolean {
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const [mirrored, setMirrored] = useState(false);

  useEffect(() => {
    void readWidgetPremiumMirror().then(setMirrored);
  }, [isPremium]);

  return isPremium || mirrored;
}

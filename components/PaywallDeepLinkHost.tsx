/**
 * Listens for trylowalk://paywall deep links from locked home-screen widgets.
 */
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";

import { useProPaywall } from "@/hooks/useProPaywall";

function isPaywallUrl(url: string | null): boolean {
  if (!url) return false;
  const parsed = Linking.parse(url);
  return parsed.hostname === "paywall" || parsed.path === "/paywall";
}

export function PaywallDeepLinkHost() {
  const { openProPaywall } = useProPaywall();
  const handlingRef = useRef(false);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!isPaywallUrl(url) || handlingRef.current) return;
      handlingRef.current = true;
      void openProPaywall().finally(() => {
        handlingRef.current = false;
      });
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [openProPaywall]);

  return null;
}

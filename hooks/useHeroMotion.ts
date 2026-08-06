/**
 * Hero motion hooks — reduce-motion guard and e-ink refresh on state changes.
 */
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { HERO_MOTION } from "@/lib/heroMotion";

/** RN Modal animationType that respects Reduce Motion (movement → none). */
export function useModalAnimationType(
  preferred: "fade" | "slide" = "fade",
): "fade" | "slide" | "none" {
  const reduceMotion = useReduceMotion();
  return reduceMotion ? "none" : preferred;
}

export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}

/** Triggers a brief e-ink refresh pulse when transitionKey changes. */
export function useHeroEinkRefresh(
  transitionKey: string,
  reduceMotion: boolean,
): { refreshActive: boolean; revealKey: string } {
  const [refreshActive, setRefreshActive] = useState(false);
  const [revealKey, setRevealKey] = useState(transitionKey);
  const prevKeyRef = useRef(transitionKey);

  useEffect(() => {
    if (prevKeyRef.current === transitionKey) return;
    prevKeyRef.current = transitionKey;

    if (reduceMotion) {
      setRevealKey(transitionKey);
      return;
    }

    setRefreshActive(true);
    const timer = setTimeout(() => {
      setRefreshActive(false);
      setRevealKey(transitionKey);
    }, HERO_MOTION.refreshMs);

    return () => clearTimeout(timer);
  }, [reduceMotion, transitionKey]);

  return { refreshActive, revealKey };
}

/**
 * HeroBodyZones — vertical bands inside the gray display well.
 */
import type { ReactNode } from "react";
import { View } from "react-native";

import {
    HERO_EINK_BODY_GAP,
    HERO_ZONE_ROUTE_SLOT_HEIGHT,
} from "@/lib/heroEink";

type ZoneProps = {
  children?: ReactNode;
};

/** Route arc band — only used when multiple sessions exist. */
export function HeroRouteSlot({ children }: ZoneProps) {
  return (
    <View
      style={{
        height: HERO_ZONE_ROUTE_SLOT_HEIGHT,
        width: "100%",
        flexShrink: 0,
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

/** Dominant metric — fills remaining body height (active session). */
export function HeroFocalZone({ children }: ZoneProps) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

/** Secondary intel, tagline, upcoming, and shield — pinned to body bottom. */
export function HeroContextZone({ children }: ZoneProps) {
  return (
    <View
      style={{
        flexShrink: 0,
        width: "100%",
        alignItems: "center",
        gap: HERO_EINK_BODY_GAP,
      }}
    >
      {children}
    </View>
  );
}

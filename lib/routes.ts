import type { Href } from "expo-router";

import type { FocusNodeTemplateId } from "@/data/quickActions";
import type { Weekday } from "@/types/focusNode";

/** Typed route paths for Expo Router — extend when new stack screens are added. */
export const ROUTES = {
  home: "/(tabs)" as Href,
  devShieldOverlay: "/dev/shield-overlay" as Href,
  devShareOverlays: "/dev/share-overlays" as Href,
  blockedApps: "/blocked-apps" as Href,
  weekSchedule: "/schedule" as Href,
  stats: "/stats" as Href,
  streak: "/streak" as Href,
  focusNodeNew: "/focus-node/new" as Href,
  focusNodeEdit: (id: string) => `/focus-node/${id}` as Href,
  sessionDetail: (nodeId: string, dateIso?: string) =>
    ({
      pathname: `/session/${nodeId}`,
      params: dateIso ? { date: dateIso } : {},
    }) as Href,
  focusNodeNewWithTemplate: (template: FocusNodeTemplateId) =>
    ({
      pathname: "/focus-node/new",
      params: { template },
    }) as Href,
  focusNodeNewWithWeekday: (
    weekday: Weekday,
    template: FocusNodeTemplateId = "custom",
    returnToWeek = true,
  ) =>
    ({
      pathname: "/focus-node/new",
      params: {
        template,
        weekday: String(weekday),
        returnToWeek: returnToWeek ? "1" : undefined,
      },
    }) as Href,
} as const;

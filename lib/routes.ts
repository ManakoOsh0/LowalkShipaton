import type { Href } from "expo-router";

import type { FocusNodeTemplateId } from "@/data/quickActions";

/** Typed route paths for Expo Router — extend when new stack screens are added. */
export const ROUTES = {
  blockedApps: "/blocked-apps" as Href,
  weekSchedule: "/schedule" as Href,
  stats: "/stats" as Href,
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
  wakeChallenge: "/wake-challenge" as Href,
  wakeChallengeComplete: "/wake-challenge/complete" as Href,
} as const;

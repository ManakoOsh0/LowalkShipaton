/** Fixed shield overlay copy — headline is built per blocked app at show time. */

export const SHIELD_CLOSE_LABEL = "Close";

export const SHIELD_OVERLAY_SUBTITLE =
  "To stop blocking, check in at your focus zone and complete your focus session";

/** @deprecated Use SHIELD_CLOSE_LABEL */
export const SHIELD_OPEN_LOWALK_LABEL = SHIELD_CLOSE_LABEL;

export type ShieldOverlayPhase =
  | "pre_class"
  | "traveling"
  | "arriving"
  | "in_session"
  | "away"
  | "penalty";

export type ShieldOverlayCopy = {
  nodeKind: string;
  phase: ShieldOverlayPhase;
  headline: string;
  subtitle: string;
  detail?: string;
  ctaLabel: string;
};

export function formatShieldBlockedHeadline(appName: string): string {
  const name = appName.trim() || "This app";
  return `${name} blocked by Lowalk`;
}

type ShieldOverlayCopyInput = {
  appName?: string;
};

/** Static shield overlay copy; native Android injects the blocked app name into the headline. */
export function getShieldOverlayCopy({
  appName = "This app",
}: ShieldOverlayCopyInput = {}): ShieldOverlayCopy {
  return {
    nodeKind: "custom",
    phase: "in_session",
    headline: formatShieldBlockedHeadline(appName),
    subtitle: SHIELD_OVERLAY_SUBTITLE,
    ctaLabel: SHIELD_CLOSE_LABEL,
  };
}

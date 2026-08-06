import { formatTimeLabel, parseTimeToMinutes } from "@/lib/time";
import type { FocusNode } from "@/types/focusNode";
import type { ShareOverlayMoment, ShareOverlayPayload } from "@/types/shareOverlay";

/** Class starts before 8:00 — the "I made the 7am" flex. */
export function isEarlyClassSchedule(node: FocusNode): boolean {
  if (node.kind !== "class") return false;
  return parseTimeToMinutes(node.schedule.startTime) < 8 * 60;
}

/** Compact clock for overlay headlines — `7AM`, `7:30AM`. */
export function formatCompactClassTime(startTime: string): string {
  const totalMinutes = parseTimeToMinutes(startTime);
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  if (minutes === 0) return `${hours12}${period}`;
  return `${hours12}:${minutes.toString().padStart(2, "0")}${period}`;
}

export function resolveShareMoment(node: FocusNode | undefined): ShareOverlayMoment {
  if (!node) return "generic";
  if (node.kind === "gym") return "gym";
  if (node.kind === "library") return "library";
  if (node.kind === "class" && isEarlyClassSchedule(node)) return "early_class";
  if (node.kind === "class") return "class";
  return "focus";
}

export type ShareMomentCopy = {
  headline: string;
  subline: string;
  tertiary: string;
};

/** Emotional copy per moment — not raw stats. */
export function buildShareMomentCopy(
  node: FocusNode | undefined,
  moment: ShareOverlayMoment,
  payload: Pick<
    ShareOverlayPayload,
    "nodeTitle" | "durationLabel" | "placeLine" | "presenceVerified" | "scheduledTimeLabel"
  >,
): ShareMomentCopy {
  switch (moment) {
    case "early_class": {
      const time = node ? formatCompactClassTime(node.schedule.startTime) : "7AM";
      return {
        headline: `${time} CLASS`,
        subline: "I'M HERE",
        tertiary: payload.placeLine || payload.nodeTitle,
      };
    }
    case "gym":
      return {
        headline: "LOCKED IN",
        subline: payload.durationLabel,
        tertiary: payload.presenceVerified ? "VERIFIED AT GYM" : payload.nodeTitle,
      };
    case "library":
      return {
        headline: "IN THE STACKS",
        subline: payload.durationLabel,
        tertiary: payload.nodeTitle,
      };
    case "class":
      return {
        headline: payload.nodeTitle.toUpperCase(),
        subline: payload.durationLabel,
        tertiary: payload.placeLine || "VERIFIED",
      };
    case "focus":
    case "generic":
    default:
      return {
        headline: "SHOWED UP",
        subline: payload.durationLabel,
        tertiary: payload.nodeTitle,
      };
  }
}

export function scheduledTimeLabelForNode(node: FocusNode | undefined): string | null {
  if (!node) return null;
  return formatTimeLabel(node.schedule.startTime);
}

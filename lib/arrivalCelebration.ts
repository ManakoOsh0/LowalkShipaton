import type { Anchor } from "@/types/anchor";
import { hasUsableCoordinates } from "@/lib/geo";
import type { ScheduleItemKind } from "@/types/dashboard";
import type { FocusNode, FocusNodeKind } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

export function toScheduleItemKind(kind: FocusNodeKind | "study"): ScheduleItemKind {
  if (kind === "study") return "library";
  return kind;
}

/** Stable key for the active geofence geometry — used to detect recalibration. */
export function buildPresenceGeofenceKey(
  anchor: Pick<Anchor, "id" | "latitude" | "longitude" | "radiusMeters"> | null,
): string | null {
  if (!anchor || !hasUsableCoordinates(anchor)) return null;
  return `${anchor.id}:${anchor.latitude}:${anchor.longitude}:${anchor.radiusMeters}`;
}

export type ArrivalCelebrationGate = {
  activeSession: ActiveSessionSnapshot | null;
  obligationNodeId: string | null;
  anchoringRequest: boolean;
  insideGeofence: boolean;
  lastCelebratedSessionNodeId: string | null;
};

/**
 * True when the arrival sheet should open for a new check-in episode.
 * Each unverified session gets its own celebration — including back-to-back
 * sessions at the same anchor without leaving the geofence.
 */
export function shouldShowArrivalCelebration({
  activeSession,
  obligationNodeId,
  anchoringRequest,
  insideGeofence,
  lastCelebratedSessionNodeId,
}: ArrivalCelebrationGate): boolean {
  if (!insideGeofence || anchoringRequest) return false;
  if (!activeSession || activeSession.presenceVerified) return false;
  if (!obligationNodeId || obligationNodeId !== activeSession.nodeId) return false;
  return lastCelebratedSessionNodeId !== activeSession.nodeId;
}

export type ArrivalCelebrationFocusPayload = {
  node: Pick<FocusNode, "id" | "title" | "kind">;
  anchorName: string;
};

export function buildArrivalCelebrationPayload({
  node,
  anchorName,
}: ArrivalCelebrationFocusPayload) {
  return {
    nodeId: node.id,
    nodeTitle: node.title,
    anchorName,
    kind: toScheduleItemKind(node.kind),
  };
}

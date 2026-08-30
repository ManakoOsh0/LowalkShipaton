import { hasUsableCoordinates, resolveAnchorForNode } from "@/lib/geo";
import { formatStartsInLabel } from "@/lib/heroCard";
import type { Anchor } from "@/types/anchor";
import type { HeroCardData } from "@/types/dashboard";
import type { FocusNode } from "@/types/focusNode";

export const PRE_BUFFER_BODY_PREFIX = "Your apps are blocked";

/** True when hero copy matches the pre-buffer notification / shield-open state. */
export function isPreBufferHeroMessage(
  hero: Pick<HeroCardData, "subtitle">,
): boolean {
  return hero.subtitle?.startsWith(PRE_BUFFER_BODY_PREFIX) ?? false;
}

/** Notification + hero title when the pre-buffer window opens. */
export function buildPreBufferTitle(node: FocusNode, minutesUntilStart: number): string {
  return `${node.title} in ${formatStartsInLabel(Math.max(minutesUntilStart, 0))}`;
}

/** Shared body copy for pre-buffer alerts — apps are blocked, head to the venue. */
export function buildPreBufferBody(node: FocusNode, anchors: Anchor[]): string {
  const anchor = resolveAnchorForNode(node.anchorId, anchors);
  if (!anchor) {
    return `${PRE_BUFFER_BODY_PREFIX} — make your way to your session.`;
  }
  if (!hasUsableCoordinates(anchor)) {
    return `${PRE_BUFFER_BODY_PREFIX} — arrive at ${anchor.name} to capture GPS before your session.`;
  }
  return `${PRE_BUFFER_BODY_PREFIX} — make your way to ${anchor.name}.`;
}

import { formatSessionDetailLabel } from "@/lib/sessionPenalty";
import type { FocusNodeKind } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

export type ShieldOverlayCopy = {
  nodeKind: FocusNodeKind;
  /** Motivational line tied to the scheduled activity. */
  subtitle: string;
  /** Primary CTA label — typically "Open {session title}". */
  ctaLabel: string;
};

function truncateTitle(title: string, max = 22): string {
  const trimmed = title.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Dynamic shield copy from the active session and Focus Node kind. */
export function getShieldOverlayCopy(
  session: ActiveSessionSnapshot,
  kind: FocusNodeKind,
): ShieldOverlayCopy {
  const title = session.nodeTitle.trim() || "your session";
  const shortTitle = truncateTitle(title);
  const timing = formatSessionDetailLabel(session);

  let subtitle: string;
  switch (kind) {
    case "gym":
      subtitle = `Time for ${shortTitle}!`;
      break;
    case "library":
      subtitle = `Back to the books at ${shortTitle}!`;
      break;
    case "class":
      subtitle = `Class time — finish ${shortTitle}!`;
      break;
    default:
      subtitle = `Time to focus on ${shortTitle}!`;
      break;
  }

  if (timing) {
    subtitle = `${subtitle}\n${timing}`;
  }

  return {
    nodeKind: kind,
    subtitle,
    ctaLabel: `Open ${shortTitle}`,
  };
}

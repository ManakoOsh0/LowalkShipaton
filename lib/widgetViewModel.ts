/**
 * Derives home-screen widget copy from the synced schedule bundle.
 * Recomputes active-session countdown at render time so background ticks stay accurate.
 */
import type { WidgetScheduleBundle } from "@/types/widgetSchedule";
import {
  buildWidgetTileAppearance,
  type WidgetTileAppearancePayload,
} from "@/lib/heroWidgetAppearance";
import { formatFocusDuration } from "@/lib/periodStats";

export type WidgetDisplayModel = {
  metaLeft: string;
  status: string;
  sessionTitle: string;
  headline: string;
  subline: string | null;
  appearance: WidgetTileAppearancePayload;
};

const FALLBACK_APPEARANCE = buildWidgetTileAppearance();

const FALLBACK: WidgetDisplayModel = {
  metaLeft: "FOCUS",
  status: "TODAY",
  sessionTitle: "Lowalk",
  headline: "Open Lowalk",
  subline: null,
  appearance: FALLBACK_APPEARANCE,
};

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function placeholderWidgetDisplay(): WidgetDisplayModel {
  return FALLBACK;
}

/** Compact lifetime focus figure for the 2×2 hours widget. */
export function formatWidgetFocusHours(totalMinutes: number): {
  value: string;
  label: string;
} {
  if (totalMinutes <= 0) return { value: "0h", label: "time saved" };
  const value = formatFocusDuration(totalMinutes);
  return { value: value === "—" ? "0h" : value, label: "time saved" };
}

export function buildWidgetDisplay(
  bundle: WidgetScheduleBundle | null,
  nowMs = Date.now(),
): WidgetDisplayModel {
  if (!bundle?.display) return FALLBACK;

  const display = bundle.display;
  const appearance = bundle.appearance ?? FALLBACK_APPEARANCE;
  const isActive = display.state === "active";

  let headline = display.headline?.trim() || display.sessionTitle || FALLBACK.headline;
  if (isActive) {
    const endsAt = display.sessionEndsAtMs;
    if (endsAt != null && Number.isFinite(endsAt)) {
      headline = formatCountdown(endsAt - nowMs);
    } else if (display.countdownLabel?.trim()) {
      headline = display.countdownLabel.trim();
    }
  }

  let subline = display.subline?.trim() || null;
  if (
    subline &&
    display.locationLabel &&
    subline.toLowerCase() === display.locationLabel.toLowerCase()
  ) {
    subline = null;
  }

  return {
    metaLeft: (display.metaLeft || FALLBACK.metaLeft).toUpperCase(),
    status: (display.metaRight || FALLBACK.status).toUpperCase(),
    sessionTitle: display.sessionTitle || FALLBACK.sessionTitle,
    headline,
    subline,
    appearance,
  };
}

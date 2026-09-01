/**
 * Three-line focus widget copy — title, status, one detail row.
 */
import type { HeroWidgetSnapshot } from "@/types/heroWidget";
import {
  buildActiveSessionTimer,
  type ActiveSessionTimer,
} from "@/lib/widgetSessionTimer";

export type SimpleWidgetCopy = {
  title: string;
  status: string | null;
  detail: string | null;
  activeTimer: ActiveSessionTimer | null;
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isSameText(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

function isContainedIn(haystack: string, needle: string): boolean {
  const h = normalize(haystack);
  const n = normalize(needle);
  return h.includes(n) || n.includes(h);
}

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

function resolveHeadline(snapshot: HeroWidgetSnapshot, nowMs: number): string {
  if (snapshot.state === "active") {
    if (snapshot.sessionEndsAtMs != null) {
      return formatCountdown(snapshot.sessionEndsAtMs - nowMs);
    }
    if (snapshot.countdownLabel?.trim()) return snapshot.countdownLabel.trim();
  }
  return snapshot.headline.trim() || snapshot.sessionTitle;
}

function buildTimeLocation(snapshot: HeroWidgetSnapshot): string | null {
  const time = snapshot.timeWindowLabel?.trim() ?? "";
  const location = snapshot.locationLabel?.trim() ?? "";
  if (time && location) return `${time}\n${location}`;
  if (time) return time;
  if (location) return location;
  return null;
}

function shouldUseHeadlineAsStatus(
  snapshot: HeroWidgetSnapshot,
  headline: string,
  title: string,
): boolean {
  if (isSameText(headline, title)) return false;
  // Up next already shows the full window in the detail row.
  if (snapshot.state === "up_next" && snapshot.timeWindowLabel?.trim()) return false;
  return true;
}

function shouldUseSublineAsStatus(
  subline: string,
  title: string,
  locationLabel: string | null | undefined,
  isTraveling: boolean,
): boolean {
  if (isTraveling) return false;
  if (isSameText(subline, title)) return false;
  if (locationLabel?.trim() && isSameText(subline, locationLabel)) return false;
  return true;
}

function isTravelingState(snapshot: HeroWidgetSnapshot): boolean {
  return snapshot.state === "on_the_way" && Boolean(snapshot.travelLabel?.trim());
}

function buildTravelingDetail(snapshot: HeroWidgetSnapshot): string | null {
  const subline = snapshot.subline?.trim();
  const location = snapshot.locationLabel?.trim() ?? "";

  if (subline) {
    if (location && !isContainedIn(subline, location)) {
      return `${subline}\n${location}`;
    }
    return subline;
  }

  if (location) return location;
  return snapshot.timeWindowLabel?.trim() || null;
}

function pickDetail(
  candidates: Array<string | null | undefined>,
  title: string,
  status: string | null,
): string | null {
  const parts: string[] = [];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    if (isSameText(value, title)) continue;
    if (status && isSameText(value, status)) continue;
    if (parts.some((part) => isContainedIn(part, value))) continue;
    parts.push(value);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function resolveSimpleWidgetCopy(
  snapshot: HeroWidgetSnapshot,
  nowMs = Date.now(),
): SimpleWidgetCopy {
  const activeTimer = buildActiveSessionTimer(snapshot, nowMs);
  if (activeTimer) {
    const title = snapshot.sessionTitle.trim() || snapshot.headline.trim();
    return { title, status: null, detail: null, activeTimer };
  }

  const title = snapshot.sessionTitle.trim() || resolveHeadline(snapshot, nowMs);
  const headline = resolveHeadline(snapshot, nowMs);
  const subline = snapshot.subline?.trim() || null;
  const travel = snapshot.travelLabel?.trim() || null;
  const timeLocation = buildTimeLocation(snapshot);
  const isTraveling = isTravelingState(snapshot);

  let status: string | null = null;
  if (isTraveling && headline && !isSameText(headline, title)) {
    status = headline;
  } else if (shouldUseHeadlineAsStatus(snapshot, headline, title)) {
    status = headline;
  } else if (
    subline &&
    shouldUseSublineAsStatus(subline, title, snapshot.locationLabel, isTraveling)
  ) {
    status = subline;
  } else if (travel && !isSameText(travel, title) && !isTraveling) {
    status = travel;
  }

  const detail = isTraveling
    ? buildTravelingDetail(snapshot)
    : pickDetail(
        [
          timeLocation,
          travel && status !== travel ? travel : null,
          subline && status !== subline ? subline : null,
        ],
        title,
        status,
      );

  return { title, status, detail, activeTimer: null };
}

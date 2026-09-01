/**
 * Builds widget preview copy from the same hero fixtures used in dev preview.
 */
import { buildHeroPreviewData } from "@/lib/heroCard";
import { buildHeroWidgetSnapshot } from "@/lib/heroWidget";
import { buildActiveSessionTimer, type ActiveSessionTimer } from "@/lib/widgetSessionTimer";
import { resolveSimpleWidgetCopy } from "@/lib/widgetTileCopy";
import type { HeroPreviewKind, HeroPreviewScenario } from "@/store/useHeroPreviewStore";
import type { ActiveSessionSnapshot } from "@/types/session";

export const WIDGET_PREVIEW_SCENARIOS: HeroPreviewScenario[] = [
  "up_next",
  "pre_buffer",
  "traveling",
  "verifying",
  "arrived",
  "active_session",
  "stepped_out",
  "apps_locked",
  "day_complete",
  "no_sessions",
  "nothing_left",
  "weekly_ledger",
];

export type WidgetPreviewContent = {
  title: string;
  status: string | null;
  detail: string | null;
  activeTimer: ActiveSessionTimer | null;
};

function mockActiveSession(referenceDate: Date): ActiveSessionSnapshot {
  const shieldStartsAt = new Date(referenceDate.getTime() - 30 * 60 * 1000);
  const endsAt = new Date(referenceDate.getTime() + 41 * 60 * 1000);
  return {
    nodeId: "preview-node",
    zoneLabel: "Engineering Library",
    headline: "Library Session",
    nodeTitle: "Library Session",
    scheduleType: "duration",
    shieldStartsAt: shieldStartsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    onSiteAccumulatedMs: 30 * 60 * 1000,
    onSiteLastTickAt: referenceDate.toISOString(),
    requiredOnSiteMs: 90 * 60 * 1000,
    awaySince: null,
    penaltyShieldEndsAt: null,
    penaltyMinutes: null,
    presenceVerified: true,
  };
}

export function buildWidgetPreviewContent(
  scenario: HeroPreviewScenario,
  kind: HeroPreviewKind = "class",
  nowMs = Date.now(),
): WidgetPreviewContent {
  const hero = buildHeroPreviewData(scenario, kind);
  const dailyGoal = { completed: 1, target: 3 };
  const activeSession = scenario === "active_session" ? mockActiveSession(new Date(nowMs)) : null;
  const snapshot = buildHeroWidgetSnapshot(hero, dailyGoal, activeSession, new Date(nowMs));
  return resolveSimpleWidgetCopy(snapshot, nowMs);
}

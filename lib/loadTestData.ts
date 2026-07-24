/**
 * Dev helper — loads a full local dataset into schedule, user, and blocked-app stores.
 */
import { createTestData } from "@/store/seed";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

export function loadTestData(): void {
  const data = createTestData();

  useScheduleStore.setState({
    focusNodes: data.focusNodes,
    anchors: data.anchors,
    activeSession: null,
  });

  useUserStore.setState({
    coins: data.user.coins,
    streak: data.user.streak,
    lastDailyGoalAwardDateIso: data.user.lastDailyGoalAwardDateIso,
    lastStreakDateIso: data.user.lastStreakDateIso,
  });

  useBlockedAppsStore.setState({ apps: data.blockedApps });
  useHeroPreviewStore.getState().setForcedState(null);
}

export function getTestDataSummary(): string {
  const { focusNodes, anchors, user, blockedApps } = createTestData();
  const todayCount = focusNodes.filter(
    (node) => node.schedule.weekday === new Date().getDay(),
  ).length;

  return `${focusNodes.length} Focus Nodes (${todayCount} today), ${anchors.length} anchors, ${user.coins} coins, ${user.streak}-day streak, ${blockedApps.length} blocked apps`;
}

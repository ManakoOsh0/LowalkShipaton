/**
 * DevToolsScreenContent — UI previews, test data, and field-test diagnostics for /dev.
 */
import { useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { DailyGoalCard } from "@/components/DailyGoalCard";
import { HeroPreviewControls } from "@/components/HeroPreviewControls";
import { useOpenPreviewOnHome } from "@/hooks/useOpenPreviewOnHome";
import { useProPaywall } from "@/hooks/useProPaywall";
import { useSchedulePreviewFixture } from "@/hooks/useSchedulePreviewFixture";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getBackgroundPresenceDebugState } from "@/lib/backgroundPresenceDebug";
import { isDevOnlyToolsEnabled } from "@/lib/devToolsAccess";
import { HERO_PREVIEW_KIND_LABELS } from "@/lib/heroCard";
import { buildPreBufferBody, buildPreBufferTitle } from "@/lib/preBufferCopy";
import { getTestDataSummary, loadTestData } from "@/lib/loadTestData";
import { isPresenceDebugEnabled } from "@/lib/presenceDebug";
import { ROUTES } from "@/lib/routes";
import { resetProTestState } from "@/lib/resetProTestState";
import { markNativeWidgetPremiumUnlocked } from "@/lib/widgetPremiumSync";
import { readWidgetPremiumMirror } from "@/lib/widgetPremiumMirror";
import {
  getDevNotificationDiagnostics,
  presentDevPreBufferNotification,
  resyncDevSessionReminders,
  scheduleDevMissedSessionNotification,
  scheduleDevPreBufferNotification,
  type DevScheduledNotificationRow,
} from "@/services/devNotifications";
import {
  getBackgroundPermissionStatus,
  isSessionLocationTaskRegistered,
} from "@/services/location";
import { useAnchoringSheetStore } from "@/store/useAnchoringSheetStore";
import { useArrivalCelebrationStore } from "@/store/useArrivalCelebrationStore";
import { useHeroCelebrationStore } from "@/store/useHeroCelebrationStore";
import { useLeaveSessionWarningStore } from "@/store/useLeaveSessionWarningStore";
import { useNotificationNavigationStore } from "@/store/useNotificationNavigationStore";
import {
  HERO_PREVIEW_KINDS,
  HERO_PREVIEW_SCENARIOS,
  HERO_PREVIEW_SCENARIO_LABELS,
  useHeroPreviewStore,
} from "@/store/useHeroPreviewStore";
import { useSessionCompleteStore } from "@/store/useSessionCompleteStore";
import { useSessionPenaltyStore } from "@/store/useSessionPenaltyStore";
import { useStreakCelebrationStore } from "@/store/useStreakCelebrationStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useUserStore } from "@/store/useUserStore";
import type { ScheduleItemKind } from "@/types/dashboard";

function DevSection({ title, children }: { title: string; children: ReactNode }) {
  const colors = useThemeColors();

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function DevCard({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap,
      }}
    >
      {children}
    </View>
  );
}

function DevPreviewRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 15,
          color: colors.skyDeep,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontFamily: "Poppins-Regular",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

function TestDataSection() {
  const colors = useThemeColors();
  const [loaded, setLoaded] = useState(false);
  const summary = getTestDataSummary();

  const handleLoad = () => {
    loadTestData();
    setLoaded(true);
    Alert.alert("Test data loaded", summary);
  };

  return (
    <DevSection title="Data">
      <DevCard>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Three sessions today (gym and library completed, class open for demos), anchors,
          completion history, coins, streak, and sample blocked apps. Replaces your local schedule.
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Medium",
            fontSize: 13,
            lineHeight: 18,
            color: colors.foreground,
          }}
        >
          {summary}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Load test data"
          onPress={handleLoad}
          style={({ pressed }) => ({
            borderRadius: 12,
            backgroundColor: colors.skyDeep,
            paddingVertical: 12,
            alignItems: "center",
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 14,
              lineHeight: 20,
              color: "#FFFFFF",
            }}
          >
            {loaded ? "Reload test data" : "Load test data"}
          </Text>
        </Pressable>
      </DevCard>
    </DevSection>
  );
}

function HeroPreviewSection() {
  const colors = useThemeColors();
  const router = useRouter();
  const forcedScenario = useHeroPreviewStore((state) => state.forcedScenario);
  const setForcedScenario = useHeroPreviewStore((state) => state.setForcedScenario);
  const forcedKind = useHeroPreviewStore((state) => state.forcedKind);
  const setForcedKind = useHeroPreviewStore((state) => state.setForcedKind);
  const showCelebration = useHeroCelebrationStore((state) => state.show);
  const dismissCelebration = useHeroCelebrationStore((state) => state.dismiss);
  const activeCelebration = useHeroCelebrationStore((state) => state.celebration);

  const previewCelebration = (hitDailyGoal: boolean) => {
    setForcedScenario(null);
    showCelebration({
      nodeId: "preview-node",
      nodeTitle: "Library Session",
      hitDailyGoal,
    });
    router.push(ROUTES.home);
  };

  return (
    <DevSection title="Hero card">
      <DevCard gap={10}>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Force a Hero Card scenario on Home to review copy, layout, and motion.
          {forcedScenario
            ? ` Active: ${HERO_PREVIEW_SCENARIO_LABELS[forcedScenario]}`
            : " Showing live state."}
        </Text>

        <HeroPreviewControls embedded />

        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: colors.muted,
            }}
          >
            Session kind
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {HERO_PREVIEW_KINDS.map((kind) => {
              const selected = forcedKind === kind;
              return (
                <Pressable
                  key={kind}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setForcedKind(kind);
                    if (forcedScenario) {
                      router.push(ROUTES.home);
                    }
                  }}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? colors.skyDeep : colors.border,
                    backgroundColor: selected ? colors.surface : colors.background,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 12,
                      lineHeight: 16,
                      color: selected ? colors.skyDeep : colors.foreground,
                    }}
                  >
                    {HERO_PREVIEW_KIND_LABELS[kind]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {HERO_PREVIEW_SCENARIOS.map((scenario) => {
            const selected = forcedScenario === scenario;
            return (
              <Pressable
                key={scenario}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  if (selected) {
                    setForcedScenario(null);
                    return;
                  }
                  setForcedScenario(scenario);
                  router.push(ROUTES.home);
                }}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.skyDeep : colors.border,
                  backgroundColor: selected ? colors.surface : colors.background,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 12,
                    lineHeight: 16,
                    color: selected ? colors.skyDeep : colors.foreground,
                  }}
                >
                  {HERO_PREVIEW_SCENARIO_LABELS[scenario]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {forcedScenario ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setForcedScenario(null)}
            style={{ paddingVertical: 4 }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 13,
                color: colors.skyDeep,
              }}
            >
              Clear preview
            </Text>
          </Pressable>
        ) : null}

        <View
          style={{
            marginTop: 4,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 8,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: colors.muted,
            }}
          >
            Hero overlays
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            Short-lived beats on Home — not in the state chips above. Tap a button, then check the
            Hero Card on Home (clear any active state preview first).
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => previewCelebration(false)}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors.foreground,
                }}
              >
                Celebration beat
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => previewCelebration(true)}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors.foreground,
                }}
              >
                Celebration + daily goal
              </Text>
            </Pressable>
          </View>
          {activeCelebration ? (
            <Pressable
              accessibilityRole="button"
              onPress={dismissCelebration}
              style={{ paddingVertical: 4 }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: colors.skyDeep,
                }}
              >
                Dismiss celebration overlay
              </Text>
            </Pressable>
          ) : null}
        </View>
      </DevCard>
    </DevSection>
  );
}

function formatDevNotificationFireTime(date: Date | null): string {
  if (!date) return "unknown time";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationDebugSection() {
  const colors = useThemeColors();
  const openOnHome = useOpenPreviewOnHome();
  const setForcedScenario = useHeroPreviewStore((state) => state.setForcedScenario);
  const { previewNode } = useSchedulePreviewFixture();
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const notificationsEnabled = useUserStore((state) => state.notificationsEnabled);

  const [diagnostics, setDiagnostics] = useState<{
    supported: boolean;
    permission: string;
    scheduled: DevScheduledNotificationRow[];
  }>({ supported: false, permission: "…", scheduled: [] });
  const [busy, setBusy] = useState(false);

  const refreshDiagnostics = async () => {
    const next = await getDevNotificationDiagnostics();
    setDiagnostics({
      supported: next.supported,
      permission: next.permission,
      scheduled: next.scheduled,
    });
  };

  useEffect(() => {
    void refreshDiagnostics();
  }, []);

  const sampleNode = previewNode;
  const sampleAnchors = sampleNode ? anchors : [];
  const preBufferTitle =
    sampleNode
      ? buildPreBufferTitle(sampleNode, classPreBufferMinutes)
      : "Add a Focus Node to preview copy";
  const preBufferBody = sampleNode
    ? buildPreBufferBody(sampleNode, sampleAnchors)
    : "—";

  const simulatePreBufferTap = () => {
    const nodeId = sampleNode?.id ?? "preview-node";
    openOnHome(() => {
      setForcedScenario(null);
      useNotificationNavigationStore.getState().setPreBufferFocus(nodeId);
    });
  };

  const previewPreBufferHero = () => {
    openOnHome(() => {
      setForcedScenario("pre_buffer");
      useNotificationNavigationStore.getState().clearPreBufferFocus();
    });
  };

  const runWithFeedback = async (
    label: string,
    action: () => Promise<void>,
    successMessage: string,
  ): Promise<void> => {
    if (!diagnostics.supported) {
      Alert.alert(
        label,
        "Local notifications are not available in Android Expo Go. Use a dev build or iOS.",
      );
      return;
    }
    if (!sampleNode) {
      Alert.alert("No session", "Load test data or add a Focus Node for today first.");
      return;
    }
    setBusy(true);
    try {
      await action();
      await refreshDiagnostics();
      Alert.alert(label, successMessage);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      Alert.alert(label, `Could not deliver notification.\n\n${detail}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DevSection title="Notifications">
      <DevCard gap={10}>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Test local Focus alerts — especially the pre-buffer (“apps blocked”) reminder before a
          session. Uses the same copy and payload as production scheduling.
        </Text>

        <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.foreground }}>
          supported={diagnostics.supported ? "yes" : "no"} · permission={diagnostics.permission} ·
          alerts_toggle={notificationsEnabled ? "on" : "off"} · scheduled=
          {diagnostics.scheduled.length}
        </Text>

        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 11,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: colors.muted,
            }}
          >
            Pre-buffer copy
            {sampleNode ? ` · ${sampleNode.title}` : ""}
          </Text>
          <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 14, color: colors.skyDeep }}>
            {preBufferTitle}
          </Text>
          <Text style={{ fontFamily: "Poppins-Regular", fontSize: 13, color: colors.foreground }}>
            {preBufferBody}
          </Text>
        </View>

        {!diagnostics.supported ? (
          <Text style={{ fontFamily: "Poppins-Regular", fontSize: 12, color: colors.muted }}>
            Android Expo Go cannot schedule local notifications. Install a development build to test
            OS banners.
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            disabled={busy || !diagnostics.supported}
            onPress={() =>
              void runWithFeedback(
                "Pre-buffer alert",
                () =>
                  presentDevPreBufferNotification(
                    sampleNode!,
                    anchors,
                    classPreBufferMinutes,
                  ),
                "Notification sent now. Dev builds show it even while Lowalk is open.",
              )
            }
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.skyDeep,
              backgroundColor: colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 8,
              opacity: busy || !diagnostics.supported ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 12,
                color: colors.skyDeep,
              }}
            >
              Fire pre-buffer now
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy || !diagnostics.supported}
            onPress={() =>
              void runWithFeedback(
                "Pre-buffer alert",
                () =>
                  scheduleDevPreBufferNotification(
                    sampleNode!,
                    anchors,
                    classPreBufferMinutes,
                    5,
                  ),
                "Scheduled in 5 seconds. Background the app if you do not see a dev banner immediately.",
              )
            }
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.skyDeep,
              backgroundColor: colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 8,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 12,
                color: colors.skyDeep,
              }}
            >
              Fire pre-buffer in 5s
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy || !diagnostics.supported}
            onPress={() =>
              void runWithFeedback(
                "Missed session alert",
                () => scheduleDevMissedSessionNotification(sampleNode!, 5),
                "Scheduled in 5 seconds.",
              )
            }
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, color: colors.foreground }}>
              Fire missed in 5s
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={simulatePreBufferTap}
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, color: colors.foreground }}>
              Simulate tap → Home
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={previewPreBufferHero}
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, color: colors.foreground }}>
              Preview hero layout
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            setBusy(true);
            void resyncDevSessionReminders(
              focusNodes,
              anchors,
              classPreBufferMinutes,
              notificationsEnabled,
            )
              .then(() => refreshDiagnostics())
              .then(() => Alert.alert("Reminders synced", "Re-ran production session reminder sync."))
              .catch(() => Alert.alert("Sync failed", "Check Metro logs."))
              .finally(() => setBusy(false));
          }}
        >
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.primary }}>
            Resync scheduled session reminders
          </Text>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={() => void refreshDiagnostics()}>
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.primary }}>
            Refresh scheduled list
          </Text>
        </Pressable>

        {diagnostics.scheduled.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.muted,
              }}
            >
              Upcoming (lowalk-*)
            </Text>
            {diagnostics.scheduled.slice(0, 6).map((row) => (
              <View
                key={row.identifier}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  gap: 2,
                }}
              >
                <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 12, color: colors.foreground }}>
                  {row.kind} · {formatDevNotificationFireTime(row.fireAt)}
                </Text>
                <Text style={{ fontFamily: "Poppins-Regular", fontSize: 12, color: colors.muted }}>
                  {row.title}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </DevCard>
    </DevSection>
  );
}

function OverlayPreviewsSection() {
  const colors = useThemeColors();
  const router = useRouter();
  const openOnHome = useOpenPreviewOnHome();
  const { previewNode, previewAnchor } = useSchedulePreviewFixture();
  const penaltyTierMinutes = useUserStore((state) => state.penaltyTierMinutes);
  const streak = useUserStore((state) => state.streak);
  const showArrival = useArrivalCelebrationStore((state) => state.show);
  const showLeaveWarning = useLeaveSessionWarningStore((state) => state.show);
  const showPenalty = useSessionPenaltyStore((state) => state.show);
  const showAnchoring = useAnchoringSheetStore((state) => state.show);
  const showSessionComplete = useSessionCompleteStore((state) => state.show);
  const showStreakCelebration = useStreakCelebrationStore((state) => state.show);

  const venueSubtitle = previewNode
    ? `Uses "${previewNode.title}" at ${previewAnchor?.name ?? "fallback venue"}`
    : "Uses sample Study Session at Campus Library";

  return (
    <DevSection title="Overlays & flows">
      <DevCard gap={10}>
        <DevPreviewRow
          title="Preview arrival card"
          subtitle={venueSubtitle}
          onPress={() => {
            const kind = (previewNode?.kind ?? "library") as ScheduleItemKind;
            openOnHome(() => {
              showArrival({
                nodeId: previewNode?.id ?? "dev-preview",
                nodeTitle: previewNode?.title ?? "Study Session",
                anchorName: previewAnchor?.name ?? "Campus Library",
                kind,
                preview: true,
              });
            });
          }}
        />
        <DevPreviewRow
          title="Preview leave warning"
          subtitle={venueSubtitle}
          onPress={() => {
            openOnHome(() => {
              showLeaveWarning({
                nodeTitle: previewNode?.title ?? "Study Session",
                anchorName: previewAnchor?.name ?? "Campus Library",
                scheduleType: previewNode?.schedule.type ?? "duration",
                preview: true,
              });
            });
          }}
        />
        <DevPreviewRow
          title="Preview penalty sheet"
          subtitle={
            previewNode
              ? `Uses "${previewNode.title}" · +${penaltyTierMinutes}m lock`
              : `Uses sample Study Session · +${penaltyTierMinutes}m lock`
          }
          onPress={() => {
            openOnHome(() => {
              showPenalty({
                nodeTitle: previewNode?.title ?? "Study Session",
                anchorName: previewAnchor?.name ?? "Campus Library",
                penaltyMinutes: penaltyTierMinutes,
                preview: true,
              });
            });
          }}
        />
        <DevPreviewRow
          title="Preview anchoring sheet"
          subtitle={venueSubtitle}
          onPress={() => {
            openOnHome(() => {
              showAnchoring({
                nodeId: previewNode?.id ?? "dev-preview",
                nodeTitle: previewNode?.title ?? "Study Session",
                anchorId: previewAnchor?.id ?? "dev-anchor",
                anchorName: previewAnchor?.name ?? "Campus Library",
                mode: "required",
                preview: true,
              });
            });
          }}
        />
        <DevPreviewRow
          title="Preview shield overlay"
          subtitle={
            previewNode
              ? `Full-screen block UI for "${previewNode.title}" — works in Expo Go`
              : "Full-screen block UI with sample Study Session — works in Expo Go"
          }
          onPress={() => {
            openOnHome(() => {
              router.push(ROUTES.devShieldOverlay);
            });
          }}
        />
        <DevPreviewRow
          title="Preview session complete screen"
          subtitle="Full-screen Done moment after finishing a schedule"
          onPress={() => {
            openOnHome(() => {
              showSessionComplete({
                nodeId: "preview",
                nodeTitle: "Walk outside",
                kind: "custom",
                streak: Math.max(streak, 37),
                hitDailyGoal: true,
                coinAwarded: true,
                pendingStreakCelebration: null,
                presenceVerified: true,
                scheduleType: "duration",
                durationMs: 45 * 60 * 1000,
                onSitePercent: 92,
                venueName: "Campus Library",
              });
            });
          }}
        />
        <DevPreviewRow
          title="Preview streak screen"
          subtitle={`Opens the full-screen daily-goal celebration (current streak: ${streak || "—"})`}
          onPress={() => {
            openOnHome(() => {
              showStreakCelebration({
                streak: Math.max(streak, 1),
                coinAwarded: true,
              });
            });
          }}
        />

        <View
          style={{
            marginTop: 4,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: colors.muted,
            }}
          >
            Daily target mascot
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            Inactive (sessions still in progress):
          </Text>
          <View style={{ marginHorizontal: -16 }}>
            <DailyGoalCard completed={1} target={3} />
          </View>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            Active (all sessions complete):
          </Text>
          <View style={{ marginHorizontal: -16 }}>
            <DailyGoalCard completed={3} target={3} />
          </View>
        </View>
      </DevCard>
    </DevSection>
  );
}

function BackgroundPresenceSection() {
  const colors = useThemeColors();
  const [backgroundPermission, setBackgroundPermission] = useState<string>("checking");
  const [taskRegistered, setTaskRegistered] = useState<string>("checking");
  const [lastFixLabel, setLastFixLabel] = useState<string>("—");

  useEffect(() => {
    const refresh = async () => {
      const permission = await getBackgroundPermissionStatus();
      setBackgroundPermission(permission);

      const registered = await isSessionLocationTaskRegistered();
      setTaskRegistered(registered ? "yes" : "no");

      const { lastBackgroundFixAt, lastBackgroundError } = getBackgroundPresenceDebugState();
      if (lastBackgroundError) {
        setLastFixLabel(`error: ${lastBackgroundError}`);
      } else if (lastBackgroundFixAt) {
        setLastFixLabel(new Date(lastBackgroundFixAt).toLocaleTimeString());
      } else {
        setLastFixLabel("—");
      }
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DevSection title="Field test">
      <DevCard gap={8}>
        <Text style={{ fontFamily: "Poppins-Regular", fontSize: 13, color: colors.foreground }}>
          Background permission: {backgroundPermission}
        </Text>
        <Text style={{ fontFamily: "Poppins-Regular", fontSize: 13, color: colors.foreground }}>
          Location task registered: {taskRegistered}
        </Text>
        <Text style={{ fontFamily: "Poppins-Regular", fontSize: 13, color: colors.foreground }}>
          Last background fix: {lastFixLabel}
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontFamily: "Poppins-Regular",
            fontSize: 12,
            lineHeight: 17,
            color: colors.muted,
          }}
        >
          Checklist: grant Always → start session at anchor → background 2+ min inside → leave fence
          (on-site pauses, shield stays on until you finish or midnight) → return and complete inside
          venue (complete + coin). Classes: return within 5 min or incur penalty lock.
        </Text>
      </DevCard>
    </DevSection>
  );
}

function SubscriptionDebugSection() {
  const colors = useThemeColors();
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const isLoaded = useSubscriptionStore((state) => state.isLoaded);
  const { openProPaywall } = useProPaywall();
  const [mirrored, setMirrored] = useState(false);
  const [resettingPro, setResettingPro] = useState(false);

  useEffect(() => {
    void readWidgetPremiumMirror().then(setMirrored);
  }, [isPremium]);

  const handleResetProTestState = async () => {
    setResettingPro(true);
    try {
      const result = await resetProTestState();
      setMirrored(result.widgetMirror);
      Alert.alert(
        "Pro test state reset",
        [
          `App User ID: ${result.appUserId ?? "unknown"}`,
          `premium=${result.isPremium ? "yes" : "no"} · widget_mirror=${result.widgetMirror ? "yes" : "no"}`,
          "",
          "Local widget unlock was cleared and RevenueCat was refreshed.",
          "If premium is still yes, delete this App User ID in RevenueCat and clear sandbox purchase history (lifetime stays on the store receipt until then).",
        ].join("\n"),
      );
    } catch {
      Alert.alert("Reset failed", "Could not reset Pro test state. Check Metro logs.");
    } finally {
      setResettingPro(false);
    }
  };

  return (
    <DevSection title="Subscriptions">
      <DevCard>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          RevenueCat client state for this device.
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Medium",
            fontSize: 13,
            lineHeight: 18,
            color: colors.foreground,
          }}
        >
          loaded={isLoaded ? "yes" : "no"} · premium={isPremium ? "yes" : "no"} ·
          widget_mirror={mirrored ? "yes" : "no"}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={resettingPro}
          onPress={() => void handleResetProTestState()}
          style={{ marginTop: 10 }}
        >
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.primary }}>
            {resettingPro ? "Resetting Pro test state…" : "Reset Pro test state"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void markNativeWidgetPremiumUnlocked().then(() => readWidgetPremiumMirror().then(setMirrored))}
          style={{ marginTop: 8 }}
        >
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.primary }}>
            Force unlock widgets (native)
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void openProPaywall()}
          style={{ marginTop: 8 }}
        >
          <Text style={{ fontFamily: "Poppins-Medium", fontSize: 13, color: colors.primary }}>
            Open paywall
          </Text>
        </Pressable>
      </DevCard>
    </DevSection>
  );
}

export function DevToolsScreenContent() {
  const colors = useThemeColors();
  const showDevOnly = isDevOnlyToolsEnabled();
  const showFieldTest = isPresenceDebugEnabled();

  return (
    <>
      {showDevOnly ? <TestDataSection /> : null}
      {showDevOnly ? <HeroPreviewSection /> : null}
      {showDevOnly ? <NotificationDebugSection /> : null}
      {showDevOnly ? <OverlayPreviewsSection /> : null}
      {showDevOnly ? <SubscriptionDebugSection /> : null}
      {showFieldTest ? <BackgroundPresenceSection /> : null}
      {!showDevOnly && !showFieldTest ? (
        <Text
          style={{
            marginTop: 24,
            fontFamily: "Poppins-Regular",
            fontSize: 14,
            color: colors.muted,
          }}
        >
          No developer tools are available in this build.
        </Text>
      ) : null}
    </>
  );
}

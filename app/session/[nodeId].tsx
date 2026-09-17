/**
 * Session detail screen — habit-style stats and history for one Focus Node.
 * Edit opens the recurring template; skip/delete live in the shared action sheet.
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScheduleItemActionSheet } from "@/components/ScheduleItemActionSheet";
import { SessionDetailHero } from "@/components/session/SessionDetailHero";
import { SessionHistoryHeatmap } from "@/components/session/SessionHistoryHeatmap";
import { SessionStatTile } from "@/components/session/SessionStatTile";
import { SessionDetailSkeleton } from "@/components/skeleton/SessionDetailSkeleton";
import { StreakFlame } from "@/components/StreakFlame";
import { useScheduleItemActions } from "@/hooks/useScheduleItemActions";
import { useSessionDetail } from "@/hooks/useSessionDetail";
import { useCoreStoresHydrated } from "@/hooks/usePersistedStoreHydration";
import { getKindAccentColor } from "@/lib/focusNodeKindColors";
import {
  computeCompletionRateLast30Days,
  computeFocusNodeContributionWeeks,
} from "@/lib/focusNodeStats";
import { scheduleItemFromSessionDetail } from "@/lib/scheduleItem";
import { ROUTES } from "@/lib/routes";
import { useAnchoringSheetStore } from "@/store/useAnchoringSheetStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useThemeColors } from "@/hooks/useThemeColors";

function NavIconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.foreground} />
    </Pressable>
  );
}

export default function SessionDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { nodeId, date } = useLocalSearchParams<{ nodeId: string; date?: string }>();
  const resolvedNodeId = Array.isArray(nodeId) ? nodeId[0] : nodeId;
  const dateIso = Array.isArray(date) ? date[0] : date;

  const detail = useSessionDetail(resolvedNodeId, dateIso);
  const storesReady = useCoreStoresHydrated();
  const { showScheduleItemActions, actionSheetProps } = useScheduleItemActions();
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const showAnchoringSheet = useAnchoringSheetStore((state) => state.show);

  const focusNode = useMemo(
    () => focusNodes.find((node) => node.id === resolvedNodeId) ?? null,
    [focusNodes, resolvedNodeId],
  );

  const linkedAnchor = useMemo(() => {
    if (!focusNode?.anchorId) return null;
    return anchors.find((anchor) => anchor.id === focusNode.anchorId) ?? null;
  }, [anchors, focusNode]);

  const contributionWeeks = useMemo(
    () => (focusNode ? computeFocusNodeContributionWeeks(focusNode) : []),
    [focusNode],
  );

  const completionRate30 = useMemo(
    () => (focusNode ? computeCompletionRateLast30Days(focusNode) : 0),
    [focusNode],
  );

  useEffect(() => {
    if (!storesReady || !resolvedNodeId) return;
    if (!detail) {
      router.back();
    }
  }, [detail, resolvedNodeId, router, storesReady]);

  if (!storesReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <NavIconButton
            icon="chevron-back"
            label="Go back"
            onPress={() => router.back()}
          />
          <View style={{ width: 40 }} />
        </View>
        <SessionDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!detail || !focusNode) return null;

  const accentColor = getKindAccentColor(detail.kind);
  const canCalibrate =
    Boolean(linkedAnchor) &&
    detail.isToday &&
    (detail.status === "upcoming" || detail.status === "active");

  const handleOpenActions = () => {
    showScheduleItemActions(scheduleItemFromSessionDetail(detail));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <NavIconButton
          icon="chevron-back"
          label="Go back"
          onPress={() => router.back()}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <NavIconButton
            icon="pencil"
            label="Edit schedule"
            onPress={() => router.push(ROUTES.focusNodeEdit(detail.nodeId))}
          />
          <NavIconButton
            icon="ellipsis-horizontal"
            label="Session options"
            onPress={handleOpenActions}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SessionDetailHero
          title={detail.title}
          kind={detail.kind}
          schedule={focusNode.schedule}
          timeLabel={detail.timeLabel}
        />

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          <SessionStatTile
            icon={<StreakFlame height={18} />}
            value={String(detail.insights.currentStreak)}
            label="week streak"
          />
          <SessionStatTile
            icon={<Ionicons name="trophy" size={18} color={colors.warning} />}
            value={String(detail.insights.bestStreak)}
            label="best streak"
          />
          <SessionStatTile
            icon={<Ionicons name="bar-chart" size={18} color={accentColor} />}
            value={`${completionRate30}%`}
            label="last 30 days"
          />
        </View>

        <SessionHistoryHeatmap weeks={contributionWeeks} accentColor={accentColor} />

        {detail.status === "active" && detail.endsInLabel ? (
          <Text
            style={{
              marginTop: 20,
              fontFamily: "Poppins-SemiBold",
              fontSize: 14,
              lineHeight: 20,
              color: accentColor,
              textAlign: "center",
            }}
          >
            {detail.endsInLabel} remaining
          </Text>
        ) : null}

        <View style={{ alignItems: "center", gap: 14, paddingTop: 20 }}>
          {canCalibrate && linkedAnchor ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!linkedAnchor || !resolvedNodeId) return;
                showAnchoringSheet({
                  nodeId: resolvedNodeId,
                  nodeTitle: detail.title,
                  anchorId: linkedAnchor.id,
                  anchorName: linkedAnchor.name,
                  mode: "optional",
                });
              }}
              style={{
                alignSelf: "stretch",
                alignItems: "center",
                borderRadius: 14,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 15,
                  color: colors.foreground,
                }}
              >
                {linkedAnchor.calibrated
                  ? "Recalibrate geofence"
                  : "Calibrate geofence to my seat"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <ScheduleItemActionSheet {...actionSheetProps} />
    </SafeAreaView>
  );
}

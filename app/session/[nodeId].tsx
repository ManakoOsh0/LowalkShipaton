/**
 * Session detail screen — habit-style stats and history for one Focus Node.
 * Edit opens the recurring template; Skip applies to today only.
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnchoringFlow } from "@/components/AnchoringFlow";
import { StreakFlame } from "@/components/StreakFlame";
import { SessionDetailHero } from "@/components/session/SessionDetailHero";
import { SessionHistoryHeatmap } from "@/components/session/SessionHistoryHeatmap";
import { SessionStatTile } from "@/components/session/SessionStatTile";
import { useSessionDetail } from "@/hooks/useSessionDetail";
import { getKindAccentColor } from "@/lib/focusNodeKindColors";
import {
  computeCompletionRateLast30Days,
  computeFocusNodeContributionWeeks,
} from "@/lib/focusNodeStats";
import { ROUTES } from "@/lib/routes";
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
  const markNodeSkipped = useScheduleStore((state) => state.markNodeSkipped);
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const [calibrateVisible, setCalibrateVisible] = useState(false);

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
    if (resolvedNodeId && focusNodes.length > 0 && !detail) {
      router.back();
    }
  }, [detail, focusNodes.length, resolvedNodeId, router]);

  if (!detail || !focusNode) return null;

  const accentColor = getKindAccentColor(detail.kind);
  const canSkip = detail.status === "upcoming" && detail.isToday;
  const canCalibrate =
    Boolean(linkedAnchor) &&
    detail.isToday &&
    (detail.status === "upcoming" || detail.status === "active");

  const handleSkip = () => {
    Alert.alert(
      "Skip this session?",
      "You won't earn a Focus Coin and this won't count toward your daily goal. The recurring schedule stays the same.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          style: "destructive",
          onPress: () => {
            markNodeSkipped(detail.nodeId, detail.dateIso);
            router.back();
          },
        },
      ],
    );
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
        <NavIconButton
          icon="pencil"
          label="Edit schedule"
          onPress={() => router.push(ROUTES.focusNodeEdit(detail.nodeId))}
        />
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
              onPress={() => setCalibrateVisible(true)}
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

          {canSkip ? (
            <Pressable accessibilityRole="button" onPress={handleSkip} hitSlop={8}>
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.muted,
                }}
              >
                Skip today
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {linkedAnchor && resolvedNodeId ? (
        <AnchoringFlow
          visible={calibrateVisible}
          nodeId={resolvedNodeId}
          nodeTitle={detail.title}
          anchorId={linkedAnchor.id}
          anchorName={linkedAnchor.name}
          onComplete={() => setCalibrateVisible(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

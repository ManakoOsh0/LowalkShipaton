/**
 * LeaveSessionWarningModal — bottom sheet when the user steps out during a focus session.
 * Dismissible like other session sheets; away state continues in the background.
 */
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { BottomSheet } from "@/components/BottomSheet";
import { LeaveSessionWarningBadge } from "@/components/LeaveSessionWarningBadge";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering } from "@/lib/heroMotion";
import { getLeaveSessionWarningBody } from "@/lib/sessionPenalty";
import { SHEET_CAUTION_YELLOW } from "@/lib/sheetMascotTone";
import { useLeaveSessionWarningStore } from "@/store/useLeaveSessionWarningStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import type { SessionScheduleType } from "@/types/session";

type LeaveSessionWarningContentProps = {
  anchorName: string;
  nodeTitle: string;
  scheduleType: SessionScheduleType | null;
};

function LeaveSessionWarningContent({
  anchorName,
  nodeTitle,
  scheduleType,
}: LeaveSessionWarningContentProps) {
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();

  return (
    <View style={{ paddingHorizontal: 4, paddingBottom: 52, alignItems: "center", gap: 10 }}>
      <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
        <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
          <LeaveSessionWarningBadge size={96} color={SHEET_CAUTION_YELLOW} />
        </Animated.View>
      </View>

      <View style={{ alignItems: "center", gap: 3 }}>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 12,
            lineHeight: 16,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            color: SHEET_CAUTION_YELLOW,
          }}
        >
          Left focus session
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 20,
            lineHeight: 26,
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          {anchorName}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 14,
            lineHeight: 20,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          {nodeTitle}
        </Text>
      </View>

      <Text
        style={{
          fontFamily: "Poppins-Medium",
          fontSize: 13,
          lineHeight: 18,
          color: colors.foregroundSubtle,
          textAlign: "center",
        }}
      >
        {getLeaveSessionWarningBody(scheduleType)}
      </Text>
    </View>
  );
}

export function LeaveSessionWarningHost() {
  const activeSession = useScheduleStore((state) => state.activeSession);
  /** Hide this away episode after the user swipes or taps outside — away timer keeps running. */
  const [dismissedAwaySince, setDismissedAwaySince] = useState<string | null>(null);

  const previewVisible = useLeaveSessionWarningStore((state) => state.visible);
  const preview = useLeaveSessionWarningStore((state) => state.preview);
  const previewNodeTitle = useLeaveSessionWarningStore((state) => state.nodeTitle);
  const previewAnchorName = useLeaveSessionWarningStore((state) => state.anchorName);
  const previewScheduleType = useLeaveSessionWarningStore(
    (state) => state.scheduleType,
  );
  const hidePreview = useLeaveSessionWarningStore((state) => state.hide);

  const sessionAwayRaw = Boolean(
    activeSession?.presenceVerified &&
      activeSession.awaySince &&
      !activeSession.penaltyShieldEndsAt,
  );
  const awaySince = activeSession?.awaySince ?? null;
  const sessionAway =
    sessionAwayRaw && awaySince !== dismissedAwaySince;

  const visible = previewVisible || sessionAway;

  const anchorName = previewVisible
    ? previewAnchorName
    : activeSession?.zoneLabel ?? "";
  const nodeTitle = previewVisible
    ? previewNodeTitle
    : activeSession?.nodeTitle ?? "";
  const scheduleType: SessionScheduleType | null = previewVisible
    ? (previewScheduleType ?? null)
    : (activeSession?.scheduleType ?? null);

  useEffect(() => {
    if (!awaySince) {
      setDismissedAwaySince(null);
    }
  }, [awaySince]);

  const handleClose = () => {
    if (preview) {
      hidePreview();
      return;
    }
    if (awaySince) {
      setDismissedAwaySince(awaySince);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <LeaveSessionWarningContent
        anchorName={anchorName}
        nodeTitle={nodeTitle}
        scheduleType={scheduleType}
      />
    </BottomSheet>
  );
}

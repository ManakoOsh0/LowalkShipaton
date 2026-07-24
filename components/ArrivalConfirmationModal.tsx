/**
 * ArrivalConfirmationModal — bottom sheet when the user enters a session geofence.
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { useSessionPresence } from "@/contexts/SessionPresenceContext";
import { formatTimeLabel } from "@/lib/time";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useArrivalCelebrationStore } from "@/store/useArrivalCelebrationStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import type { FocusNodeSchedule } from "@/types/focusNode";

type StayDurationCopy = {
  headline: string;
  body: string;
};

function formatStayDurationCopy(schedule: FocusNodeSchedule | undefined): StayDurationCopy {
  if (!schedule) {
    return {
      headline: "Stay for the session",
      body: "Remain on site for the full scheduled duration to complete this session.",
    };
  }

  if (schedule.type === "class") {
    return {
      headline: "Stay until class ends",
      body: `Keep your seat until ${formatTimeLabel(schedule.endTime)}. Leaving early can trigger app locks.`,
    };
  }

  const hours = schedule.durationHours;
  const durationLabel = hours === 1 ? "1 hour" : `${hours} hours`;

  return {
    headline: "Stay on site",
    body: `Accumulate ${durationLabel} inside the venue to complete this session.`,
  };
}

type ArrivalSheetContentProps = {
  anchorName: string;
  nodeTitle: string;
  countdownLabel: string;
  stayCopy: StayDurationCopy;
};

function ArrivalSheetContent({
  anchorName,
  nodeTitle,
  countdownLabel,
  stayCopy,
}: ArrivalSheetContentProps) {
  const colors = useThemeColors();

  return (
    <View style={{ paddingHorizontal: 4, paddingBottom: 4, gap: 16 }}>
      <View style={{ alignItems: "center", gap: 12 }}>
        <View
          style={{
            borderRadius: 999,
            backgroundColor: `${colors.success}22`,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.success,
            }}
          >
            You&apos;ve arrived
          </Text>
        </View>

        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${colors.success}1A`,
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={36} color={colors.success} />
        </View>

        <View style={{ alignItems: "center", gap: 6 }}>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 22,
              lineHeight: 28,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            {anchorName}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 15,
              lineHeight: 22,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            {nodeTitle}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 14,
            lineHeight: 20,
            color: colors.primary,
            textAlign: "center",
          }}
        >
          {countdownLabel}
        </Text>
      </View>

      <View
        style={{
          borderRadius: 14,
          borderCurve: "continuous",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardStroke,
          paddingHorizontal: 14,
          paddingVertical: 14,
          gap: 6,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 14,
            lineHeight: 20,
            color: colors.foreground,
          }}
        >
          {stayCopy.headline}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 14,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          {stayCopy.body}
        </Text>
      </View>
    </View>
  );
}

export function ArrivalCelebrationHost() {
  const presence = useSessionPresence();
  const activeSession = useScheduleStore((state) => state.activeSession);

  const visible = useArrivalCelebrationStore((state) => state.visible);
  const nodeId = useArrivalCelebrationStore((state) => state.nodeId);
  const nodeTitle = useArrivalCelebrationStore((state) => state.nodeTitle);
  const anchorName = useArrivalCelebrationStore((state) => state.anchorName);
  const preview = useArrivalCelebrationStore((state) => state.preview);
  const hide = useArrivalCelebrationStore((state) => state.hide);
  const focusNodes = useScheduleStore((state) => state.focusNodes);

  const stayCopy = useMemo(() => {
    const node = focusNodes.find((entry) => entry.id === nodeId);
    return formatStayDurationCopy(node?.schedule);
  }, [focusNodes, nodeId]);

  const secondsLeft = presence.verificationSecondsRemaining;

  useEffect(() => {
    if (activeSession?.presenceVerified) {
      hide();
    }
  }, [activeSession?.presenceVerified, hide]);

  useEffect(() => {
    if (visible && !preview && !presence.isInsideGeofence) {
      hide();
    }
  }, [hide, preview, presence.isInsideGeofence, visible]);

  const countdownLabel = preview
    ? "Starting focus in 3s (preview)"
    : secondsLeft != null && secondsLeft > 0
      ? `Starting focus in ${secondsLeft}s`
      : "Starting focus now…";

  return (
    <BottomSheet visible={visible} onClose={hide}>
      <ArrivalSheetContent
        anchorName={anchorName}
        nodeTitle={nodeTitle}
        countdownLabel={countdownLabel}
        stayCopy={stayCopy}
      />
    </BottomSheet>
  );
}

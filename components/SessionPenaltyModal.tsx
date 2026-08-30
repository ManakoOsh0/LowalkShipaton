/**
 * SessionPenaltyModal — bottom sheet when the user misses the 5-minute return grace.
 * Explains the extra app-block time taken from the Settings penalty tier.
 */
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { BottomSheet } from "@/components/BottomSheet";
import { SessionPenaltyBadge } from "@/components/SessionPenaltyBadge";
import { SheetActionButton } from "@/components/SheetActionButton";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering } from "@/lib/heroMotion";
import { useSessionPenaltyStore } from "@/store/useSessionPenaltyStore";

type SessionPenaltyContentProps = {
  anchorName: string;
  nodeTitle: string;
  penaltyLine: string;
  reason: "away" | "missed";
  onAcknowledge: () => void;
};

function formatPenaltyDurationLabel(minutes: number): string {
  if (minutes === 60) return "1 hour";
  if (minutes === 120) return "2 hours";
  return `${minutes} minutes`;
}

function SessionPenaltyContent({
  anchorName,
  nodeTitle,
  penaltyLine,
  reason,
  onAcknowledge,
}: SessionPenaltyContentProps) {
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();
  const explanation =
    reason === "missed"
      ? "You missed this class without completing it, so you\u2019ve incurred extra block time."
      : "You failed to return within 5 minutes, so you\u2019ve incurred extra block time.";

  return (
    <View style={{ paddingHorizontal: 4, paddingBottom: 8, alignItems: "center", gap: 10 }}>
      <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
        <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
          <SessionPenaltyBadge size={96} color={colors.error} />
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
            color: colors.error,
          }}
        >
          Penalty lock
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
        {explanation}
      </Text>

      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 14,
          lineHeight: 20,
          color: colors.error,
          textAlign: "center",
        }}
      >
        {penaltyLine}
      </Text>

      <View style={{ width: "100%", marginTop: 4 }}>
        <SheetActionButton label="Got it" onPress={onAcknowledge} />
      </View>
    </View>
  );
}

export function SessionPenaltyHost() {
  const visible = useSessionPenaltyStore((state) => state.visible);
  const nodeTitle = useSessionPenaltyStore((state) => state.nodeTitle);
  const anchorName = useSessionPenaltyStore((state) => state.anchorName);
  const penaltyMinutes = useSessionPenaltyStore((state) => state.penaltyMinutes);
  const reason = useSessionPenaltyStore((state) => state.reason ?? "away");
  const preview = useSessionPenaltyStore((state) => state.preview);
  const hide = useSessionPenaltyStore((state) => state.hide);

  useEffect(() => {
    if (!visible || preview) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [preview, visible]);

  const penaltyLine = `+${formatPenaltyDurationLabel(penaltyMinutes)} of app lock`;

  return (
    <BottomSheet visible={visible} onClose={hide}>
      <SessionPenaltyContent
        anchorName={anchorName}
        nodeTitle={nodeTitle}
        penaltyLine={penaltyLine}
        reason={reason}
        onAcknowledge={hide}
      />
    </BottomSheet>
  );
}

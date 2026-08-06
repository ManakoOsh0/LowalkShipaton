/**
 * SessionPenaltyModal — bottom sheet when the user misses the 5-minute return grace.
 * Explains the extra app-block time taken from the Settings penalty tier.
 */
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { BottomSheet } from "@/components/BottomSheet";
import { SessionPenaltyIcon } from "@/components/SessionPenaltyIcon";
import { SheetActionButton } from "@/components/SheetActionButton";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering } from "@/lib/heroMotion";
import { useSessionPenaltyStore } from "@/store/useSessionPenaltyStore";

type SessionPenaltyContentProps = {
  anchorName: string;
  nodeTitle: string;
  penaltyLine: string;
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
  onAcknowledge,
}: SessionPenaltyContentProps) {
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();

  return (
    <View style={{ paddingHorizontal: 4, paddingBottom: 12, alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 88,
          height: 88,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: `${colors.error}14`,
          }}
        />
        <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
          <SessionPenaltyIcon size={56} color={colors.error} />
        </Animated.View>
      </View>

      <View style={{ alignItems: "center", gap: 4 }}>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 13,
            lineHeight: 18,
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
          fontFamily: "Poppins-Medium",
          fontSize: 14,
          lineHeight: 20,
          color: colors.foregroundSubtle,
          textAlign: "center",
        }}
      >
        You failed to return within 5 minutes, so you&apos;ve incurred extra block
        time.
      </Text>

      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 15,
          lineHeight: 22,
          color: colors.error,
          textAlign: "center",
        }}
      >
        {penaltyLine}
      </Text>

      <View style={{ width: "100%", marginTop: 8 }}>
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
        onAcknowledge={hide}
      />
    </BottomSheet>
  );
}

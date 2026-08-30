/**
 * ArrivalConfirmationModal — bottom sheet when the user enters a session geofence.
 */
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { ArrivalMascotBadge } from "@/components/ArrivalMascotBadge";
import { BottomSheet } from "@/components/BottomSheet";
import { useSessionPresence } from "@/contexts/SessionPresenceContext";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering } from "@/lib/heroMotion";
import { useArrivalCelebrationStore } from "@/store/useArrivalCelebrationStore";
import { useScheduleStore } from "@/store/useScheduleStore";

type ArrivalSheetContentProps = {
  anchorName: string;
  nodeTitle: string;
};

function ArrivalSheetContent({
  anchorName,
  nodeTitle,
}: ArrivalSheetContentProps) {
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();

  return (
    <View style={{ paddingHorizontal: 4, paddingBottom: 52, alignItems: "center", gap: 10 }}>
      <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
        <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
          <ArrivalMascotBadge size={96} color={colors.success} />
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
            color: colors.success,
          }}
        >
          You&apos;ve arrived
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
        Stay in the focus zone to complete verification
      </Text>
    </View>
  );
}

export function ArrivalCelebrationHost() {
  const presence = useSessionPresence();
  const activeSession = useScheduleStore((state) => state.activeSession);

  const visible = useArrivalCelebrationStore((state) => state.visible);
  const nodeTitle = useArrivalCelebrationStore((state) => state.nodeTitle);
  const anchorName = useArrivalCelebrationStore((state) => state.anchorName);
  const preview = useArrivalCelebrationStore((state) => state.preview);
  const hide = useArrivalCelebrationStore((state) => state.hide);

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

  return (
    <BottomSheet visible={visible} onClose={hide}>
      <ArrivalSheetContent
        anchorName={anchorName}
        nodeTitle={nodeTitle}
      />
    </BottomSheet>
  );
}

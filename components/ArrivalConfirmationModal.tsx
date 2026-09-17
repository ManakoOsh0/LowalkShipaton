/**
 * ArrivalConfirmationModal — bottom sheet when the user enters a session geofence.
 */
import { useEffect, useRef } from "react";
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
    <View style={{ paddingHorizontal: 4, paddingBottom: 52, alignItems: "center", gap: 14 }}>
      <View style={{ height: 116, alignItems: "center", justifyContent: "center" }}>
        <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
          <ArrivalMascotBadge size={112} color={colors.success} />
        </Animated.View>
      </View>

      <View style={{ alignItems: "center", gap: 5 }}>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 14,
            lineHeight: 18,
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
            fontSize: 24,
            lineHeight: 30,
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          {anchorName}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 16,
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
          fontSize: 15,
          lineHeight: 20,
          color: colors.foregroundSubtle,
          textAlign: "center",
        }}
      >
        Stay in the focus zone to complete verification
      </Text>
    </View>
  );
}

/** Let GPS catch up after geofence recalibration before auto-dismissing outside the fence. */
const ARRIVAL_GEOFENCE_DISMISS_GRACE_MS = 8_000;

export function ArrivalCelebrationHost() {
  const presence = useSessionPresence();
  const activeSession = useScheduleStore((state) => state.activeSession);

  const visible = useArrivalCelebrationStore((state) => state.visible);
  const nodeTitle = useArrivalCelebrationStore((state) => state.nodeTitle);
  const anchorName = useArrivalCelebrationStore((state) => state.anchorName);
  const preview = useArrivalCelebrationStore((state) => state.preview);
  const hide = useArrivalCelebrationStore((state) => state.hide);
  const shownAtRef = useRef(0);

  useEffect(() => {
    if (visible) {
      shownAtRef.current = Date.now();
    }
  }, [visible]);

  useEffect(() => {
    if (activeSession?.presenceVerified) {
      hide();
    }
  }, [activeSession?.presenceVerified, hide]);

  useEffect(() => {
    if (visible && !preview && !presence.isInsideGeofence) {
      if (Date.now() - shownAtRef.current < ARRIVAL_GEOFENCE_DISMISS_GRACE_MS) {
        return;
      }
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

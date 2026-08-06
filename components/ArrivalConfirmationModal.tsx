/**
 * ArrivalConfirmationModal — bottom sheet when the user enters a session geofence.
 */
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { ArrivalMascotIcon } from "@/components/ArrivalMascotIcon";
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
    <View style={{ paddingHorizontal: 4, paddingBottom: 88, alignItems: "center", gap: 12 }}>
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
            backgroundColor: `${colors.success}14`,
          }}
        />
        <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
          <ArrivalMascotIcon size={64} color={colors.success} />
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
            color: colors.success,
          }}
        >
          You&apos;ve arrived
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

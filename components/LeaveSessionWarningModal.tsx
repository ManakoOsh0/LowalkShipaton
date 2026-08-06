/**
 * LeaveSessionWarningModal — bottom sheet when the user steps out during a focus session.
 */
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { BottomSheet } from "@/components/BottomSheet";
import { LeaveSessionWarningIcon } from "@/components/LeaveSessionWarningIcon";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering } from "@/lib/heroMotion";
import { useLeaveSessionWarningStore } from "@/store/useLeaveSessionWarningStore";
import { useScheduleStore } from "@/store/useScheduleStore";

type LeaveSessionWarningContentProps = {
  anchorName: string;
  nodeTitle: string;
};

function LeaveSessionWarningContent({
  anchorName,
  nodeTitle,
}: LeaveSessionWarningContentProps) {
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
            backgroundColor: `${colors.error}14`,
          }}
        />
        <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
          <LeaveSessionWarningIcon size={64} />
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
          Left focus session
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
        Return to the focus zone within 5 minutes to avoid a penalty
      </Text>
    </View>
  );
}

export function LeaveSessionWarningHost() {
  const activeSession = useScheduleStore((state) => state.activeSession);

  const previewVisible = useLeaveSessionWarningStore((state) => state.visible);
  const preview = useLeaveSessionWarningStore((state) => state.preview);
  const previewNodeTitle = useLeaveSessionWarningStore((state) => state.nodeTitle);
  const previewAnchorName = useLeaveSessionWarningStore((state) => state.anchorName);
  const hidePreview = useLeaveSessionWarningStore((state) => state.hide);

  const sessionAway = Boolean(
    activeSession?.presenceVerified &&
      activeSession.awaySince &&
      !activeSession.penaltyShieldEndsAt,
  );

  const visible = previewVisible || sessionAway;

  const anchorName = previewVisible
    ? previewAnchorName
    : activeSession?.zoneLabel ?? "";
  const nodeTitle = previewVisible
    ? previewNodeTitle
    : activeSession?.nodeTitle ?? "";

  const handleClose = () => {
    if (preview) {
      hidePreview();
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      dismissible={preview}
      dismissOnBackdrop={preview}
    >
      <LeaveSessionWarningContent
        anchorName={anchorName}
        nodeTitle={nodeTitle}
      />
    </BottomSheet>
  );
}

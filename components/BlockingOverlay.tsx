/**
 * Blocking Overlay — fullscreen enforcement view shown when a shielded app opens.
 */
import { Modal } from "react-native";
import { useRouter } from "expo-router";

import { ShieldOverlayLayout } from "@/components/ShieldOverlayLayout";
import { getShieldOverlayCopy } from "@/lib/shieldOverlayCopy";
import { isShieldActiveForNodes } from "@/lib/sessionPenalty";
import { useBlockingOverlayStore } from "@/store/useBlockingOverlayStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

export function BlockingOverlayHost() {
  const router = useRouter();
  const visible = useBlockingOverlayStore((state) => state.visible);
  const hide = useBlockingOverlayStore((state) => state.hide);
  const blockedAppName = useBlockingOverlayStore((state) => state.blockedAppName);
  const activeSession = useScheduleStore((state) => state.activeSession);
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const sessionGapMergeMinutes = useUserStore((state) => state.sessionGapMergeMinutes);

  const shieldActive = isShieldActiveForNodes(focusNodes, activeSession, {
    classPreBufferMinutes,
    sessionGapMergeMinutes,
  });

  if (!visible || !activeSession || !shieldActive) {
    return null;
  }

  const copy = getShieldOverlayCopy({ appName: blockedAppName ?? "This app" });

  const handleClose = () => {
    hide();
    router.replace("/(tabs)");
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <ShieldOverlayLayout
        headline={copy.headline}
        subtitle={copy.subtitle}
        ctaLabel={copy.ctaLabel}
        onCtaPress={handleClose}
      />
    </Modal>
  );
}

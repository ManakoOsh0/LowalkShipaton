/**
 * Blocking Overlay — fullscreen enforcement view shown when a shielded app opens.
 * Black canvas with session mascot, dynamic schedule copy, and Open Lowalk CTA.
 */
import { Modal } from "react-native";
import { useRouter } from "expo-router";
import { ShieldOverlayLayout } from "@/components/ShieldOverlayLayout";
import { getShieldOverlayCopy } from "@/lib/shieldOverlayCopy";
import { isShieldActiveForNodes } from "@/lib/sessionPenalty";
import { useBlockingOverlayStore } from "@/store/useBlockingOverlayStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";
import type { FocusNodeKind } from "@/types/focusNode";

export function BlockingOverlayHost() {
  const router = useRouter();
  const visible = useBlockingOverlayStore((state) => state.visible);
  const hide = useBlockingOverlayStore((state) => state.hide);
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

  const focusNode = focusNodes.find((node) => node.id === activeSession.nodeId);
  const kind: FocusNodeKind = focusNode?.kind ?? "custom";
  const { subtitle, ctaLabel } = getShieldOverlayCopy(activeSession, kind);

  const handleGoHome = () => {
    hide();
    router.replace("/(tabs)");
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={handleGoHome}>
      <ShieldOverlayLayout
        kind={kind}
        subtitle={subtitle}
        ctaLabel={ctaLabel}
        onCtaPress={handleGoHome}
      />
    </Modal>
  );
}

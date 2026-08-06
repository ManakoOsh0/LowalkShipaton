/**
 * AnchoringSheetHost — global bottom sheet for required deferred anchoring and optional recalibration.
 */
import { useEffect } from "react";

import { AnchoringFlow } from "@/components/AnchoringFlow";
import { selectAnchoringRequest } from "@/store/selectors";
import { useAnchoringSheetStore } from "@/store/useAnchoringSheetStore";
import { useScheduleStore } from "@/store/useScheduleStore";

export function AnchoringSheetHost() {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);

  const visible = useAnchoringSheetStore((state) => state.visible);
  const nodeId = useAnchoringSheetStore((state) => state.nodeId);
  const nodeTitle = useAnchoringSheetStore((state) => state.nodeTitle);
  const anchorId = useAnchoringSheetStore((state) => state.anchorId);
  const anchorName = useAnchoringSheetStore((state) => state.anchorName);
  const mode = useAnchoringSheetStore((state) => state.mode);
  const preview = useAnchoringSheetStore((state) => state.preview);
  const show = useAnchoringSheetStore((state) => state.show);
  const hide = useAnchoringSheetStore((state) => state.hide);

  const anchoringRequest = selectAnchoringRequest(focusNodes, anchors);

  // Auto-open when a deferred venue enters its schedule window.
  useEffect(() => {
    if (preview) return;

    if (!anchoringRequest) {
      if (visible && mode === "required" && !preview) {
        hide();
      }
      return;
    }

    if (visible && mode === "optional" && !preview) {
      return;
    }

    if (
      visible &&
      mode === "required" &&
      nodeId === anchoringRequest.nodeId &&
      !preview
    ) {
      return;
    }

    show({
      nodeId: anchoringRequest.nodeId,
      nodeTitle: anchoringRequest.nodeTitle,
      anchorId: anchoringRequest.anchorId,
      anchorName: anchoringRequest.anchorName,
      mode: "required",
    });
  }, [
    anchoringRequest,
    hide,
    mode,
    nodeId,
    preview,
    show,
    visible,
  ]);

  if (!visible) return null;

  return (
    <AnchoringFlow
      visible={visible}
      mode={mode}
      nodeId={nodeId}
      nodeTitle={nodeTitle}
      anchorId={anchorId}
      anchorName={anchorName}
      onComplete={hide}
    />
  );
}

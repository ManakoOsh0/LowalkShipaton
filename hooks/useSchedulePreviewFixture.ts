import { useScheduleStore } from "@/store/useScheduleStore";

/** First scheduled node + anchor for dev overlay previews. */
export function useSchedulePreviewFixture() {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const previewNode = focusNodes[0] ?? null;
  const previewAnchor = previewNode?.anchorId
    ? anchors.find((anchor) => anchor.id === previewNode.anchorId) ?? null
    : null;

  return { previewNode, previewAnchor };
}

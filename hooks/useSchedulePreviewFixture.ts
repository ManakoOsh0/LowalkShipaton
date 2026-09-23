import { getScheduleWindow, toIsoDateString } from "@/lib/time";
import { useScheduleStore } from "@/store/useScheduleStore";

/** Today's next incomplete session + anchor — used for dev overlay previews. */
export function useSchedulePreviewFixture() {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);

  const todayWeekday = new Date().getDay();
  const todayIso = toIsoDateString(new Date());

  const previewNode =
    focusNodes
      .filter((node) => node.schedule.weekday === todayWeekday)
      .filter((node) => !node.completedDates.includes(todayIso))
      .sort(
        (a, b) =>
          getScheduleWindow(a.schedule).startMinutes -
          getScheduleWindow(b.schedule).startMinutes,
      )[0] ??
    focusNodes[0] ??
    null;

  const previewAnchor = previewNode?.anchorId
    ? anchors.find((anchor) => anchor.id === previewNode.anchorId) ?? null
    : null;

  return { previewNode, previewAnchor };
}

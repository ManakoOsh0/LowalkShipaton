import { useEffect, useMemo, useState } from "react";

import { formatRemainingTime } from "@/lib/time";
import { useScheduleStore } from "@/store/useScheduleStore";
import type { SessionDetailData } from "@/types/sessionDetail";

/** Live session detail with countdown tick when the occurrence is active. */
export function useSessionDetail(
  nodeId: string | undefined,
  dateIso?: string,
): SessionDetailData | null {
  const activeSession = useScheduleStore((state) => state.activeSession);
  const getSessionDetail = useScheduleStore((state) => state.getSessionDetail);
  const [timerTick, setTimerTick] = useState(0);

  useEffect(() => {
    if (!activeSession || activeSession.nodeId !== nodeId) return;
    const interval = setInterval(() => setTimerTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [activeSession, nodeId]);

  return useMemo(() => {
    if (!nodeId) return null;
    void timerTick;
    const detail = getSessionDetail(nodeId, dateIso);
    if (!detail || detail.status !== "active" || !activeSession) return detail;

    return {
      ...detail,
      endsInLabel: formatRemainingTime(activeSession.endsAt),
    };
  }, [activeSession, dateIso, getSessionDetail, nodeId, timerTick]);
}

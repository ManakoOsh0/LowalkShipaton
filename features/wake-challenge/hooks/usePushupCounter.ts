import { useEffect, useRef, useState } from "react";

import { useWakeChallengeStore } from "@/features/wake-challenge/store/wakeChallengeStore";
import type { DetectedPose, PoseStatus, PushupMetrics } from "@/features/wake-challenge/types";
import { average } from "@/features/wake-challenge/utils/calculateAngle";
import {
  getPoseInstruction,
  updatePushupState,
} from "@/features/wake-challenge/utils/pushupStateMachine";
import {
  computePushupMetrics,
  isValidPushupPose,
} from "@/features/wake-challenge/utils/validatePushupPosition";

function landmarkDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const REQUIRED_STABLE_FRAMES = 3;
const READY_STABLE_FRAMES = 8;
const SMOOTHING_WINDOW = 5;

type UsePushupCounterOptions = {
  pose: DetectedPose | null;
  enabled: boolean;
};

export function usePushupCounter({ pose, enabled }: UsePushupCounterOptions) {
  const count = useWakeChallengeStore((state) => state.count);
  const setCount = useWakeChallengeStore((state) => state.setCount);
  const setPhase = useWakeChallengeStore((state) => state.setPhase);
  const setPoseStatus = useWakeChallengeStore((state) => state.setPoseStatus);
  const phase = useWakeChallengeStore((state) => state.phase);
  const poseStatus = useWakeChallengeStore((state) => state.poseStatus);

  const recentAnglesRef = useRef<number[]>([]);
  const stableFramesRef = useRef(0);
  const pendingPhaseRef = useRef(phase);
  const readyFramesRef = useRef(0);
  const countingEnabledRef = useRef(false);

  const [metrics, setMetrics] = useState<PushupMetrics | null>(null);

  useEffect(() => {
    pendingPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!enabled) {
      recentAnglesRef.current = [];
      stableFramesRef.current = 0;
      readyFramesRef.current = 0;
      countingEnabledRef.current = false;
      setMetrics(null);
      return;
    }

    if (!pose) {
      setPoseStatus("no-person");
      setMetrics(null);
      return;
    }

    const nextMetrics = computePushupMetrics(pose);
    setMetrics(nextMetrics);

    if (!nextMetrics.hasReliablePose) {
      setPoseStatus("low-confidence");
      return;
    }

    const shoulderSpread = landmarkDistance(pose.leftShoulder, pose.rightShoulder);
    const ankleSpread = landmarkDistance(pose.leftAnkle, pose.rightAnkle);
    if (shoulderSpread > 0 && ankleSpread < shoulderSpread * 0.5) {
      setPoseStatus("move-back");
      return;
    }

    if (!isValidPushupPose(pose)) {
      setPoseStatus("get-ready");
      readyFramesRef.current = 0;
      countingEnabledRef.current = false;
      return;
    }

    readyFramesRef.current += 1;
    if (!countingEnabledRef.current) {
      if (readyFramesRef.current < READY_STABLE_FRAMES) {
        setPoseStatus("get-ready");
        return;
      }
      countingEnabledRef.current = true;
      setPoseStatus("ready");
    }

    recentAnglesRef.current.push(nextMetrics.elbowAngle);
    if (recentAnglesRef.current.length > SMOOTHING_WINDOW) {
      recentAnglesRef.current.shift();
    }
    const smoothedAngle = average(recentAnglesRef.current);

    const nextState = updatePushupState({ phase, count }, smoothedAngle);

    if (nextState.phase !== pendingPhaseRef.current) {
      stableFramesRef.current += 1;
      if (stableFramesRef.current >= REQUIRED_STABLE_FRAMES) {
        pendingPhaseRef.current = nextState.phase;
        stableFramesRef.current = 0;
        setPhase(nextState.phase);

        if (nextState.count !== count) {
          setCount(nextState.count);
        }

        if (nextState.phase === "descending" || nextState.phase === "down") {
          setPoseStatus("lower");
        } else if (nextState.phase === "ascending" || nextState.phase === "up") {
          setPoseStatus("push-up");
        }
      }
    } else {
      stableFramesRef.current = 0;
    }
  }, [
    count,
    enabled,
    phase,
    pose,
    setCount,
    setPhase,
    setPoseStatus,
  ]);

  const instruction = getPoseInstruction(
    poseStatus === "ready" || poseStatus === "lower" || poseStatus === "push-up"
      ? poseStatus
      : poseStatus,
  );

  return {
    metrics,
    instruction,
    phase,
    poseStatus,
    countingEnabled: countingEnabledRef.current,
  };
}

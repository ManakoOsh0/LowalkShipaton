import { useCallback, useEffect, useRef, useState } from "react";

import { mapRawPoseToDetectedPose } from "@/features/wake-challenge/services/poseDetector";
import type { DetectedPose, RawPosePayload } from "@/features/wake-challenge/types";

const POSE_THROTTLE_MS = 80;

/** Subscribes to ML Kit pose landmarks at a throttled rate for the counter pipeline. */
export function usePoseDetection(isActive: boolean) {
  const [pose, setPose] = useState<DetectedPose | null>(null);
  const lastEmitRef = useRef(0);

  const handleRawPose = useCallback((payload: RawPosePayload) => {
    if (!isActive) return;

    const now = Date.now();
    if (now - lastEmitRef.current < POSE_THROTTLE_MS) {
      return;
    }
    lastEmitRef.current = now;

    setPose(mapRawPoseToDetectedPose(payload));
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      setPose(null);
    }
  }, [isActive]);

  return {
    pose,
    handleRawPose,
  };
}

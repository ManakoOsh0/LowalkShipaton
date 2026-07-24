import { normalizeLandmarks } from "@/features/wake-challenge/utils/normalizeLandmarks";
import type { DetectedPose, RawPosePayload } from "@/features/wake-challenge/types";

/** Converts plugin output to typed body coordinates — no push-up semantics here. */
export function mapRawPoseToDetectedPose(
  payload: RawPosePayload | null | undefined,
  frameWidth = 1,
  frameHeight = 1,
): DetectedPose | null {
  return normalizeLandmarks(payload, frameWidth, frameHeight);
}

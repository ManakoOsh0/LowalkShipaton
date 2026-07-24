import type { DetectedPose, PoseLandmark, RawPosePayload } from "@/features/wake-challenge/types";

function readLandmark(
  payload: RawPosePayload,
  key: string,
  frameWidth: number,
  frameHeight: number,
): PoseLandmark {
  const raw = payload[key];
  const x = raw?.x ?? 0;
  const y = raw?.y ?? 0;

  // Plugin does not expose ML Kit confidence — treat visible non-origin points as reliable.
  const confidence = x > 0 && y > 0 ? 1 : 0;

  return {
    x: raw?.x ?? 0,
    y: raw?.y ?? 0,
    confidence,
  };
}

/** Maps native ML Kit pose output into normalized screen-space landmarks. */
export function normalizeLandmarks(
  payload: RawPosePayload | null | undefined,
  frameWidth = 1,
  frameHeight = 1,
): DetectedPose | null {
  if (!payload || Object.keys(payload).length === 0) {
    return null;
  }

  const leftShoulder = readLandmark(payload, "leftShoulderPosition", frameWidth, frameHeight);
  const rightShoulder = readLandmark(payload, "rightShoulderPosition", frameWidth, frameHeight);

  if (leftShoulder.confidence === 0 && rightShoulder.confidence === 0) {
    return null;
  }

  return {
    leftShoulder,
    rightShoulder,
    leftElbow: readLandmark(payload, "leftElbowPosition", frameWidth, frameHeight),
    rightElbow: readLandmark(payload, "rightElbowPosition", frameWidth, frameHeight),
    leftWrist: readLandmark(payload, "leftWristPosition", frameWidth, frameHeight),
    rightWrist: readLandmark(payload, "rightWristPosition", frameWidth, frameHeight),
    leftHip: readLandmark(payload, "leftHipPosition", frameWidth, frameHeight),
    rightHip: readLandmark(payload, "rightHipPosition", frameWidth, frameHeight),
    leftAnkle: readLandmark(payload, "leftAnklePosition", frameWidth, frameHeight),
    rightAnkle: readLandmark(payload, "rightAnklePosition", frameWidth, frameHeight),
  };
}

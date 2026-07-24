import { calculateAngle } from "@/features/wake-challenge/utils/calculateAngle";
import type { DetectedPose, PushupMetrics } from "@/features/wake-challenge/types";

export const REQUIRED_CONFIDENCE = 0.65;
export const MIN_BODY_ANGLE = 145;
/** Max shoulder-to-hip vertical offset as a fraction of torso length. */
export const MAX_TORSO_VERTICAL_RATIO = 0.35;

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function computePushupMetrics(pose: DetectedPose): PushupMetrics {
  const leftElbowAngle = calculateAngle(pose.leftShoulder, pose.leftElbow, pose.leftWrist);
  const rightElbowAngle = calculateAngle(pose.rightShoulder, pose.rightElbow, pose.rightWrist);
  const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  const leftBodyAngle = calculateAngle(pose.leftShoulder, pose.leftHip, pose.leftAnkle);
  const rightBodyAngle = calculateAngle(pose.rightShoulder, pose.rightHip, pose.rightAnkle);
  const bodyAngle = (leftBodyAngle + rightBodyAngle) / 2;
  const hasStraightBody = bodyAngle >= MIN_BODY_ANGLE;

  const leftTorsoLength = distance(pose.leftShoulder, pose.leftHip);
  const torsoHeightDifference = Math.abs(pose.leftShoulder.y - pose.leftHip.y);
  const appearsHorizontal =
    leftTorsoLength > 0 && torsoHeightDifference / leftTorsoLength < MAX_TORSO_VERTICAL_RATIO;

  const requiredLandmarks = [
    pose.leftShoulder,
    pose.rightShoulder,
    pose.leftElbow,
    pose.rightElbow,
    pose.leftWrist,
    pose.rightWrist,
    pose.leftHip,
    pose.rightHip,
  ];

  const hasReliablePose = requiredLandmarks.every(
    (landmark) => landmark.confidence >= REQUIRED_CONFIDENCE,
  );

  return {
    leftElbowAngle,
    rightElbowAngle,
    elbowAngle,
    bodyAngle,
    hasStraightBody,
    appearsHorizontal,
    hasReliablePose,
  };
}

export function isValidPushupPose(pose: DetectedPose): boolean {
  const metrics = computePushupMetrics(pose);
  return metrics.hasReliablePose && metrics.hasStraightBody && metrics.appearsHorizontal;
}

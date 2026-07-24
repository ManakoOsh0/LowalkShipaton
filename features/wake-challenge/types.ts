export type PoseLandmark = {
  x: number;
  y: number;
  confidence: number;
};

export type DetectedPose = {
  leftShoulder: PoseLandmark;
  rightShoulder: PoseLandmark;
  leftElbow: PoseLandmark;
  rightElbow: PoseLandmark;
  leftWrist: PoseLandmark;
  rightWrist: PoseLandmark;
  leftHip: PoseLandmark;
  rightHip: PoseLandmark;
  leftAnkle: PoseLandmark;
  rightAnkle: PoseLandmark;
};

export type PushupPhase =
  | "not-ready"
  | "up"
  | "descending"
  | "down"
  | "ascending";

export type PoseStatus =
  | "no-person"
  | "move-back"
  | "low-confidence"
  | "get-ready"
  | "ready"
  | "lower"
  | "push-up"
  | "complete";

export type WakeChallengeStatus =
  | "idle"
  | "active"
  | "complete"
  | "emergency-dismissed";

export type PushupState = {
  phase: PushupPhase;
  count: number;
};

export type PushupMetrics = {
  leftElbowAngle: number;
  rightElbowAngle: number;
  elbowAngle: number;
  bodyAngle: number;
  hasStraightBody: boolean;
  appearsHorizontal: boolean;
  hasReliablePose: boolean;
};

/** Raw pose payload from the ML Kit frame processor plugin. */
export type RawPosePayload = Record<string, { x?: number; y?: number } | undefined>;

export type WakeAlarmNotificationData = {
  type: "wake-alarm";
  alarmId: "primary";
};

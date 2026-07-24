import type { PushupPhase, PushupState } from "@/features/wake-challenge/types";

export const UP_ANGLE = 155;
export const DOWN_ANGLE = 90;
export const DESCENDING_ANGLE = 140;
export const ASCENDING_ANGLE = 105;

export function updatePushupState(state: PushupState, elbowAngle: number): PushupState {
  switch (state.phase) {
    case "not-ready":
      if (elbowAngle >= UP_ANGLE) {
        return { ...state, phase: "up" };
      }
      return state;

    case "up":
      if (elbowAngle < DESCENDING_ANGLE) {
        return { ...state, phase: "descending" };
      }
      return state;

    case "descending":
      if (elbowAngle <= DOWN_ANGLE) {
        return { ...state, phase: "down" };
      }
      if (elbowAngle >= UP_ANGLE) {
        return { ...state, phase: "up" };
      }
      return state;

    case "down":
      if (elbowAngle > ASCENDING_ANGLE) {
        return { ...state, phase: "ascending" };
      }
      return state;

    case "ascending":
      if (elbowAngle >= UP_ANGLE) {
        return {
          count: state.count + 1,
          phase: "up",
        };
      }
      if (elbowAngle <= DOWN_ANGLE) {
        return { ...state, phase: "down" };
      }
      return state;

    default:
      return state;
  }
}

export function getPoseInstruction(status: PushupPhase | import("@/features/wake-challenge/types").PoseStatus): string {
  switch (status) {
    case "no-person":
      return "Position your phone sideways on the floor";
    case "move-back":
      return "Move further back";
    case "low-confidence":
      return "Improve lighting and keep your full body visible";
    case "get-ready":
      return "Get into push-up position";
    case "ready":
      return "Ready — start your push-ups";
    case "lower":
      return "Lower down";
    case "push-up":
      return "Push up";
    case "complete":
      return "Challenge complete";
    case "not-ready":
      return "Straighten your arms to begin";
    case "up":
      return "Lower down";
    case "descending":
      return "Keep lowering";
    case "down":
      return "Push up";
    case "ascending":
      return "Drive up";
    default:
      return "";
  }
}

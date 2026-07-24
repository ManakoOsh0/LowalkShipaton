/**
 * Dev-facing runtime state for background presence PoC field testing.
 * Updated by the headless location task and read from Settings (__DEV__ only).
 */
let lastBackgroundFixAt: number | null = null;
let lastBackgroundError: string | null = null;

export function recordBackgroundLocationFix(timestamp = Date.now()): void {
  lastBackgroundFixAt = timestamp;
  lastBackgroundError = null;
}

export function recordBackgroundLocationError(message: string): void {
  lastBackgroundError = message;
}

export function getBackgroundPresenceDebugState() {
  return {
    lastBackgroundFixAt,
    lastBackgroundError,
  };
}

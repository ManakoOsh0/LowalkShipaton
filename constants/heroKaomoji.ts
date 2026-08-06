/**
 * Hero kaomoji frames — monospace text art per journey phase.
 * Lines are center-padded to a fixed width so frame swaps stay stable.
 */
import { Platform } from "react-native";

import type { HeroDisplayPhase, HeroIdleMood, HeroWaitingMood } from "@/lib/heroDisplay";

/** Platform mono renders kaomoji punctuation better than Space Mono. */
export const HERO_KAOMOJI_FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "SpaceMono-Regular",
})!;

export const HERO_KAOMOJI_FONT = {
  family: HERO_KAOMOJI_FONT_FAMILY,
  size: 15,
  lineHeight: 17,
  letterSpacing: 0,
  weight: "700" as const,
} as const;

/** Fixed slot so multi-line art does not jump the hero layout. */
export const HERO_KAOMOJI_SLOT = {
  width: 118,
  height: 60,
} as const;

/** Compact slot above the active-session flip clock. */
export const HERO_KAOMOJI_SESSION_SLOT = {
  width: 108,
  height: 56,
} as const;

export const HERO_KAOMOJI_SESSION_FONT = {
  family: HERO_KAOMOJI_FONT_FAMILY,
  size: 12,
  lineHeight: 14,
  letterSpacing: 0,
  weight: "700" as const,
} as const;

export type HeroSessionKind = "CLASS" | "GYM" | "LIBRARY" | "FOCUS";

export type HeroKaomojiSequence = {
  frames: readonly string[];
  intervalMs: number;
  /** Faster blink frames while the hero verify pulse is active. */
  verifyFrames?: readonly string[];
  verifyIntervalMs?: number;
  /** Gentle vertical bob while the loop runs. */
  bobPx: number;
  /** Optional side-to-side sway for march / walk loops. */
  swayPx?: number;
  /** Play frames once, then hold the last frame (celebration). */
  playOnce?: boolean;
  accessibilityLabel: string;
  verifyAccessibilityLabel?: string;
};

export type HeroKaomojiPlayback = {
  frames: readonly string[];
  intervalMs: number;
  accessibilityLabel: string;
};

/** Pick standard or verify frames for the current hero moment. */
export function resolveKaomojiPlayback(
  sequence: HeroKaomojiSequence,
  verifyPulse: boolean,
): HeroKaomojiPlayback {
  if (verifyPulse && sequence.verifyFrames?.length) {
    return {
      frames: sequence.verifyFrames,
      intervalMs: sequence.verifyIntervalMs ?? 600,
      accessibilityLabel:
        sequence.verifyAccessibilityLabel ?? sequence.accessibilityLabel,
    };
  }

  return {
    frames: sequence.frames,
    intervalMs: sequence.intervalMs,
    accessibilityLabel: sequence.accessibilityLabel,
  };
}

/** Center-pad each line so the face stays anchored between frames. */
function centerPad(line: string, width: number): string {
  if (line.length >= width) return line;
  const pad = width - line.length;
  const left = Math.floor(pad / 2);
  return " ".repeat(left) + line + " ".repeat(pad - left);
}

function buildFrame(lines: string[], width: number): string {
  return lines.map((line) => centerPad(line, width)).join("\n");
}

/**
 * Front-facing neko kaomoji — /\_/\ ears and (=^･^=) face.
 * Legs alternate to sell a walking cycle.
 */
const TRAVEL_FRAME_WIDTH = 13;

const TRAVEL_FRAMES = [
  buildFrame(["   /\\_/\\   ", "  (=^･^=)  ", "    | |    ", "   /     \\"], TRAVEL_FRAME_WIDTH),
  buildFrame(["   /\\_/\\   ", "  (=^･^=)  ", "    \\|/    ", "     /\\    "], TRAVEL_FRAME_WIDTH),
] as const;

/** On-site — slow blink while waiting to check in. */
const ARRIVED_FRAME_WIDTH = 13;

const ARRIVED_FRAMES = [
  buildFrame(["   /\\_/\\   ", "  (=^･^=)  ", "           "], ARRIVED_FRAME_WIDTH),
  buildFrame(["   /\\_/\\   ", "  (=^-^=)  ", "           "], ARRIVED_FRAME_WIDTH),
] as const;

/** Geofence verify — faster blink with a scanning prompt. */
const ARRIVED_VERIFY_FRAMES = [
  buildFrame(["   /\\_/\\   ", "  (=^･^=)  ", "     ?     "], ARRIVED_FRAME_WIDTH),
  buildFrame(["   /\\_/\\   ", "  (=^-^=)  ", "    ?      "], ARRIVED_FRAME_WIDTH),
] as const;

/** Session complete — short cheer, then a calm satisfied hold. */
const COMPLETE_FRAME_WIDTH = 13;

const COMPLETE_FRAMES = [
  buildFrame(["   /\\_/\\   ", "  (=^･^=)  ", "           "], COMPLETE_FRAME_WIDTH),
  buildFrame([" \\(=^･^=)/ ", "           ", "           "], COMPLETE_FRAME_WIDTH),
  buildFrame(["    * *     ", " \\(=^･^=)/ ", "           "], COMPLETE_FRAME_WIDTH),
  buildFrame(["   /\\_/\\   ", "  (=^･^=)  ", "    ~~     "], COMPLETE_FRAME_WIDTH),
] as const;

/** Idle moods — sleeping cat, empty day, mid-day break. */
const IDLE_FRAME_WIDTH = 15;

const IDLE_DAY_COMPLETE_FRAMES = [
  buildFrame(["  Zzz  ^ ^  ", " Zzz(-_- ) ", " ~~~~~~~~~ "], IDLE_FRAME_WIDTH),
  buildFrame(["   ^ ^  Zzz ", "  (-_- )Zzz ", " ~~~~~~~~~ "], IDLE_FRAME_WIDTH),
] as const;

const IDLE_NO_SESSIONS_FRAMES = [
  buildFrame(["    /\\_/\\    ", "   ( o.o )   ", "     ~~      "], IDLE_FRAME_WIDTH),
  buildFrame(["    /\\_/\\    ", "   ( -.- )   ", "     ~~      "], IDLE_FRAME_WIDTH),
] as const;

const IDLE_FREE_BREAK_FRAMES = [
  buildFrame(["    /\\_/\\    ", "   ( ^_^ )   ", "             "], IDLE_FRAME_WIDTH),
  buildFrame(["    /\\_/\\    ", "   ( -.- )   ", "     U U     "], IDLE_FRAME_WIDTH),
] as const;

const HERO_IDLE_KAOMOJI_SEQUENCES: Record<HeroIdleMood, HeroKaomojiSequence> = {
  day_complete: {
    frames: IDLE_DAY_COMPLETE_FRAMES,
    intervalMs: 2600,
    bobPx: 0,
    accessibilityLabel: "Done for the day, resting",
  },
  no_sessions: {
    frames: IDLE_NO_SESSIONS_FRAMES,
    intervalMs: 2800,
    bobPx: 1,
    accessibilityLabel: "No sessions scheduled today",
  },
  free_break: {
    frames: IDLE_FREE_BREAK_FRAMES,
    intervalMs: 2400,
    bobPx: 1,
    accessibilityLabel: "Taking a break",
  },
};

/** Waiting — patient upcoming vs leave-now urgency. */
const WAITING_FRAME_WIDTH = 13;

const WAITING_UPCOMING_FRAMES = [
  buildFrame(["   /\\_/\\   ", "  (=^･^=)  ", "    | |    "], WAITING_FRAME_WIDTH),
  buildFrame(["   /\\_/\\   ", "  (=^-^=)  ", "    | |    "], WAITING_FRAME_WIDTH),
] as const;

const WAITING_NOW_FRAMES = [
  buildFrame(["   /\\_/\\   ", "  (>ω<) !  ", "   / | \\   "], WAITING_FRAME_WIDTH),
  buildFrame(["   /\\_/\\   ", "  (>ω<) !  ", "    \\|/    "], WAITING_FRAME_WIDTH),
] as const;

const HERO_WAITING_KAOMOJI_SEQUENCES: Record<HeroWaitingMood, HeroKaomojiSequence> = {
  upcoming: {
    frames: WAITING_UPCOMING_FRAMES,
    intervalMs: 2400,
    bobPx: 1,
    accessibilityLabel: "Session coming up",
  },
  now: {
    frames: WAITING_NOW_FRAMES,
    intervalMs: 480,
    bobPx: 2,
    swayPx: 2,
    accessibilityLabel: "Time to leave now",
  },
};

export const HERO_KAOMOJI_SEQUENCES: Partial<
  Record<HeroDisplayPhase, HeroKaomojiSequence>
> = {
  travel: {
    frames: TRAVEL_FRAMES,
    intervalMs: 320,
    bobPx: 3,
    swayPx: 4,
    accessibilityLabel: "Walking to session",
  },
  arrived: {
    frames: ARRIVED_FRAMES,
    intervalMs: 2200,
    verifyFrames: ARRIVED_VERIFY_FRAMES,
    verifyIntervalMs: 500,
    bobPx: 1,
    accessibilityLabel: "Arrived at session",
    verifyAccessibilityLabel: "Verifying arrival",
  },
  complete: {
    frames: COMPLETE_FRAMES,
    intervalMs: 400,
    bobPx: 2,
    playOnce: true,
    accessibilityLabel: "Session complete celebration",
  },
};

/** Maps hero header chip labels to session kaomoji variants. */
export function resolveHeroSessionKind(kindLabel: string): HeroSessionKind {
  const upper = kindLabel.trim().toUpperCase();
  if (upper === "CLASS") return "CLASS";
  if (upper === "GYM") return "GYM";
  if (upper === "LIBRARY") return "LIBRARY";
  return "FOCUS";
}

const SESSION_FRAME_WIDTH = 13;
const SESSION_INTERVAL_MS = 1200;

/** Lecture — pondering cat, drifting ... dots + blink + page-turn. */
const SESSION_CLASS_FRAMES = [
  buildFrame(
    ["    ...   ", "   /\\_/\\   ", "  (・ω・)  ", "   [===]   "],
    SESSION_FRAME_WIDTH,
  ),
  buildFrame(
    ["   ...     ", "   /\\_/\\   ", "  ( -.-)  ", "   [== ]   "],
    SESSION_FRAME_WIDTH,
  ),
] as const;

/** Library — book stack with drifting ... dots + blink. */
const SESSION_LIBRARY_FRAMES = [
  buildFrame(
    ["    ...   ", "   /\\_/\\   ", "  (・ω・)  ", "   /|{|   "],
    SESSION_FRAME_WIDTH,
  ),
  buildFrame(
    ["   ...     ", "   /\\_/\\   ", "  ( -.-)  ", "   /|{|   "],
    SESSION_FRAME_WIDTH,
  ),
] as const;

/** Gym — flexing cat, alternating arm pump. */
const SESSION_GYM_FRAMES = [
  buildFrame(["   /\\_/\\   ", "  (>o<)   ", "   /| |\\  "], SESSION_FRAME_WIDTH),
  buildFrame(["   /\\_/\\   ", "  (^o^)   ", "   \\| |/  "], SESSION_FRAME_WIDTH),
] as const;

/** Custom focus — pondering cat typing, drifting ... dots + key row. */
const SESSION_FOCUS_FRAMES = [
  buildFrame(
    ["    ...   ", "   /\\_/\\   ", "  (・ω・)  ", "   _|||_   "],
    SESSION_FRAME_WIDTH,
  ),
  buildFrame(
    ["   ...     ", "   /\\_/\\   ", "  ( -.-)  ", "   |||__   "],
    SESSION_FRAME_WIDTH,
  ),
] as const;

const HERO_SESSION_KAOMOJI_SEQUENCES: Record<HeroSessionKind, HeroKaomojiSequence> = {
  CLASS: {
    frames: SESSION_CLASS_FRAMES,
    intervalMs: SESSION_INTERVAL_MS,
    bobPx: 1,
    accessibilityLabel: "In class, thinking",
  },
  LIBRARY: {
    frames: SESSION_LIBRARY_FRAMES,
    intervalMs: SESSION_INTERVAL_MS,
    bobPx: 1,
    accessibilityLabel: "Studying at the library, thinking",
  },
  GYM: {
    frames: SESSION_GYM_FRAMES,
    intervalMs: 650,
    bobPx: 2,
    accessibilityLabel: "Working out",
  },
  FOCUS: {
    frames: SESSION_FOCUS_FRAMES,
    intervalMs: SESSION_INTERVAL_MS,
    bobPx: 1,
    accessibilityLabel: "Focused work, thinking",
  },
};

export function getHeroKaomojiSequence(
  phase: HeroDisplayPhase,
  kindLabel?: string,
  idleMood?: HeroIdleMood,
  waitingMood?: HeroWaitingMood,
): HeroKaomojiSequence | null {
  if (phase === "session") {
    return HERO_SESSION_KAOMOJI_SEQUENCES[resolveHeroSessionKind(kindLabel ?? "FOCUS")];
  }

  if (phase === "idle") {
    return HERO_IDLE_KAOMOJI_SEQUENCES[idleMood ?? "free_break"];
  }

  if (phase === "waiting") {
    return HERO_WAITING_KAOMOJI_SEQUENCES[waitingMood ?? "upcoming"];
  }

  return HERO_KAOMOJI_SEQUENCES[phase] ?? null;
}

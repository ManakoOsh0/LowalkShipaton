export type ParsedClockPair = {
  left: string;
  right: string;
  /** Present when the label is H:MM:SS (sessions longer than one hour). */
  hours?: string;
};

/** Parses H:MM:SS, HH:mm, or MM:SS labels for split-flap panels. */
export function parseClockPair(label: string): ParsedClockPair | null {
  const trimmed = label.trim();

  const hmsMatch = trimmed.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hmsMatch) {
    return {
      hours: hmsMatch[1]!.padStart(2, "0"),
      left: hmsMatch[2]!,
      right: hmsMatch[3]!,
    };
  }

  const pairMatch = trimmed.match(/^(\d+):(\d{2})$/);
  if (!pairMatch) return null;

  return {
    left: pairMatch[1]!.padStart(2, "0"),
    right: pairMatch[2]!,
  };
}

/** @deprecated Use parseClockPair */
export function parseMmSsCountdown(label: string) {
  const parsed = parseClockPair(label);
  if (!parsed || parsed.hours != null) return null;
  return { minutes: parsed.left, seconds: parsed.right };
}

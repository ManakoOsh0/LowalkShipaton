/** Darken a hex color by scaling each RGB channel. */
export function shadeHex(hex: string, factor: number): string {
  const normalized = hex.replace("#", "");
  const channels = [
    normalized.slice(0, 2),
    normalized.slice(2, 4),
    normalized.slice(4, 6),
  ].map((channel) =>
    Math.min(255, Math.round(parseInt(channel, 16) * factor))
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${channels.join("")}`;
}

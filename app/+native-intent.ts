/**
 * Rewrites external deep links before Expo Router matches routes.
 * Widget paywall taps use trylowalk://paywall — not a real screen.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  const normalized = path.toLowerCase();

  if (
    normalized.includes("paywall") ||
    normalized === "trylowalk://paywall" ||
    normalized.endsWith("//paywall")
  ) {
    return "/(tabs)";
  }

  return path;
}

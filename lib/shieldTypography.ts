import { Platform } from "react-native";

/**
 * Shield overlay typography.
 * iOS: system SF Pro (no bundled font files).
 * Android: Inter (SIL OFL — redistributable SF Pro alternative).
 */
export const SHIELD_OVERLAY_FONTS = {
  headline: Platform.select({
    ios: "SFProDisplay-Bold",
    default: "Inter-Bold",
  })!,
  subtitle: Platform.select({
    ios: "SFProText-Regular",
    default: "Inter-Regular",
  })!,
} as const;

import { Platform } from "react-native";

/**
 * Shield overlay typography.
 * iOS: system SF Pro (no bundled font files).
 * Android: Poppins (bundled via expo-font).
 */
export const SHIELD_OVERLAY_FONTS = {
  headline: Platform.select({
    ios: "SFProDisplay-Bold",
    default: "Poppins-Bold",
  })!,
  subtitle: Platform.select({
    ios: "SFProText-Regular",
    default: "Poppins-Regular",
  })!,
} as const;

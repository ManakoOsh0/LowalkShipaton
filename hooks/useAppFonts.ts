import { useFonts } from "expo-font";

import { FONT_ASSETS } from "@/theme/fonts";

/** Loads Poppins weights before first paint; pair with SplashScreen in root layout. */
export function useAppFonts() {
  return useFonts(FONT_ASSETS);
}

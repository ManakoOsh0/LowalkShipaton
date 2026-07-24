/**
 * Poppins font assets and family name map.
 * File names must match PostScript names for iOS font lookup.
 */

export const FONT_ASSETS = {
  "Poppins-Regular": require("@/assets/fonts/Poppins-Regular.ttf"),
  "Poppins-Medium": require("@/assets/fonts/Poppins-Medium.ttf"),
  "Poppins-SemiBold": require("@/assets/fonts/Poppins-SemiBold.ttf"),
  "Poppins-Bold": require("@/assets/fonts/Poppins-Bold.ttf"),
  /** Rounded display faces for the header wordmark — softer than geometric Poppins. */
  "NunitoExtraLight-Black": require("@/assets/fonts/Nunito-Black.ttf"),
  "VarelaRound-Regular": require("@/assets/fonts/VarelaRound-Regular.ttf"),
  /** TRMNL Framework Classic pixel bundle (hero card). */
  "NicoPups-Regular": require("@/assets/fonts/NicoPups-Regular.ttf"),
  "NicoClean-Regular": require("@/assets/fonts/NicoClean-Regular.ttf"),
  BlockKie: require("@/assets/fonts/BlockKie.ttf"),
  /** Legacy mono — not used on TRMNL hero surfaces. */
  "SpaceMono-Regular": require("@/assets/fonts/SpaceMono-Regular.ttf"),
  "SpaceMono-Bold": require("@/assets/fonts/SpaceMono-Bold.ttf"),
} as const;

/** Swap `ACTIVE_WORDMARK` to compare Pushscroll-style rounded wordmarks in the header. */
export const WORDMARK_FONT = {
  nunitoBlack: "NunitoExtraLight-Black",
  varelaRound: "VarelaRound-Regular",
} as const;

export type WordmarkFont = (typeof WORDMARK_FONT)[keyof typeof WORDMARK_FONT];

/** Active header wordmark — set to `WORDMARK_FONT.varelaRound` to preview the other style. */
export const ACTIVE_WORDMARK: WordmarkFont = WORDMARK_FONT.nunitoBlack;

export const FONT_FAMILY = {
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semibold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
  wordmark: ACTIVE_WORDMARK,
  nicoPups: "NicoPups-Regular",
  nicoClean: "NicoClean-Regular",
  blockKie: "BlockKie",
  mono: "SpaceMono-Regular",
  monoBold: "SpaceMono-Bold",
} as const;

export type FontWeight = keyof typeof FONT_FAMILY;

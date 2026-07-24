import { Platform, type ViewStyle } from "react-native";

import type { ThemeColors } from "@/theme/tokens";

/** Hero card on the home dashboard — larger and more rounded than list rows. */
export const CARD_RADIUS_HERO = 34;

/** Flat minimal radii — reference-inspired grouped cards. */
export const CARD_RADIUS_XL = 20;
export const CARD_RADIUS_LG = 18;
export const CARD_RADIUS_MD = 16;
export const CARD_RADIUS_SM = 14;
export const CARD_RADIUS_XS = 12;

/** Tinted icon squares on schedule / quick-action rows. */
export const ICON_TILE_RADIUS_LG = 12;
export const ICON_TILE_RADIUS_MD = 10;
export const ICON_TILE_RADIUS_SM = 8;

/** Header metric pills — full capsule shape. */
export const PILL_RADIUS = 999;

/** @deprecated Use CARD_RADIUS_* */
export const NEU_RADIUS_LG = CARD_RADIUS_XL;
/** @deprecated Use CARD_RADIUS_* */
export const NEU_RADIUS_MD = CARD_RADIUS_LG;
/** @deprecated Use CARD_RADIUS_* */
export const NEU_RADIUS_SM = CARD_RADIUS_MD;

export type CardShadowVariant = "sm" | "md" | "lg";

const SHADOW_CONFIG: Record<
  CardShadowVariant,
  {
    ios: Pick<ViewStyle, "shadowOffset" | "shadowOpacity" | "shadowRadius">;
    android: number;
    boxShadow: string;
  }
> = {
  sm: {
    ios: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.36, shadowRadius: 12 },
    android: 4,
    boxShadow: "0px 3px 12px rgba(0, 0, 0, 0.45)",
  },
  md: {
    ios: { shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.42, shadowRadius: 16 },
    android: 5,
    boxShadow: "0px 5px 18px rgba(0, 0, 0, 0.5)",
  },
  lg: {
    ios: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 20 },
    android: 6,
    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.45)",
  },
};

/** Card fill + hairline stroke tuned for dark surfaces. */
export function getCardBorderStyle(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  };
}

/** Depth shadow — apply on the outer card wrapper so it is not clipped. */
export function getCardShadowStyle(
  colors: ThemeColors,
  variant: CardShadowVariant = "md",
): ViewStyle {
  const config = SHADOW_CONFIG[variant];
  return (
    Platform.select({
      ios: {
        shadowColor: colors.cardShadow,
        ...config.ios,
      },
      android: {
        elevation: config.android,
      },
      default: {
        boxShadow: config.boxShadow,
      },
    }) ?? { boxShadow: config.boxShadow }
  );
}

export function getPolishedCardOuterStyle(
  colors: ThemeColors,
  borderRadius: number,
  variant: CardShadowVariant | "none" = "sm",
): ViewStyle {
  return {
    borderRadius,
    borderCurve: "continuous",
    alignSelf: "stretch",
    ...(variant !== "none" ? getCardShadowStyle(colors, variant) : {}),
  };
}

export function getPolishedCardInnerStyle(
  colors: ThemeColors,
  borderRadius: number,
  backgroundColor?: string,
): ViewStyle {
  return {
    borderRadius,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: backgroundColor ?? colors.card,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  };
}

/** Bordered card surface — primary layout primitive. */
export function getCardSurfaceStyle(
  colors: ThemeColors,
  options?: { shadow?: CardShadowVariant; borderRadius?: number },
): ViewStyle {
  const radius = options?.borderRadius ?? CARD_RADIUS_MD;
  return {
    ...getPolishedCardOuterStyle(colors, radius, options?.shadow ?? "sm"),
    ...getPolishedCardInnerStyle(colors, radius),
  };
}

/**
 * TRMNL Framework Classic bundle — typography roles for TrmnlText.
 * Token source: lib/trmnlFramework.ts (Framework 3.2).
 * @see https://trmnl.com/framework/docs/3.2/font_family
 */
import {
  TRMNL_DESCRIPTION,
  TRMNL_FONT_CLASSIC,
  TRMNL_LABEL,
  TRMNL_TITLE,
  TRMNL_VALUE_SIZE,
} from "@/lib/trmnlFramework";

export const TRMNL_CLASSIC = {
  blockKie: {
    family: TRMNL_FONT_CLASSIC.blockKie,
    size: TRMNL_VALUE_SIZE.small.fontSize,
    lineHeight: TRMNL_VALUE_SIZE.small.lineHeight,
  },
  nicoClean: {
    family: TRMNL_FONT_CLASSIC.nicoClean,
    size: TRMNL_LABEL.base.fontSize,
    lineHeight: TRMNL_LABEL.base.lineHeight,
  },
  nicoPups: {
    family: TRMNL_FONT_CLASSIC.nicoPups,
    size: TRMNL_DESCRIPTION.base.fontSize,
    lineHeight: TRMNL_DESCRIPTION.base.lineHeight,
  },
} as const;

export type TrmnlTextVariant =
  | "title"
  | "titleBar"
  | "label"
  | "labelSmall"
  | "description"
  | "value"
  | "action"
  | "countdown";

function toVariantStyle(spec: {
  family: string;
  fontSize: number;
  lineHeight: number;
  uppercase: boolean;
}) {
  return {
    family: spec.family,
    size: spec.fontSize,
    lineHeight: spec.lineHeight,
    uppercase: spec.uppercase,
  };
}

/** Maps legacy TrmnlText variants to Framework 3.2 Classic roles. */
export const TRMNL_VARIANT_STYLES: Record<
  TrmnlTextVariant,
  {
    family: string;
    size: number;
    lineHeight: number;
    uppercase: boolean;
  }
> = {
  title: toVariantStyle(TRMNL_TITLE.base),
  titleBar: toVariantStyle(TRMNL_TITLE.small),
  label: toVariantStyle(TRMNL_LABEL.base),
  labelSmall: toVariantStyle(TRMNL_LABEL.small),
  description: toVariantStyle(TRMNL_DESCRIPTION.base),
  value: toVariantStyle({ ...TRMNL_VALUE_SIZE.base, uppercase: false }),
  action: toVariantStyle(TRMNL_LABEL.base),
  countdown: toVariantStyle({ ...TRMNL_VALUE_SIZE.large, uppercase: false }),
};

/** TRMNL bracket CTA copy, e.g. `[ START WALK → ]`. */
export function formatTrmnlActionLabel(label: string): string {
  return `[ ${label.toUpperCase()} → ]`;
}

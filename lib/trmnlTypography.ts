/**
 * TRMNL Framework Classic bundle — pixel font roles and native sizes.
 * @see https://trmnl.com/framework/docs/3.1/font_family
 */

export const TRMNL_CLASSIC = {
  blockKie: { family: "BlockKie", size: 26, lineHeight: 26 },
  nicoClean: { family: "NicoClean-Regular", size: 16, lineHeight: 20 },
  nicoPups: { family: "NicoPups-Regular", size: 16, lineHeight: 16 },
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

/** Maps hero / plugin components to Classic low-density fonts. */
export const TRMNL_VARIANT_STYLES: Record<
  TrmnlTextVariant,
  {
    family: string;
    size: number;
    lineHeight: number;
    uppercase: boolean;
  }
> = {
  title: { ...TRMNL_CLASSIC.blockKie, uppercase: true },
  titleBar: { ...TRMNL_CLASSIC.nicoClean, uppercase: true },
  label: { ...TRMNL_CLASSIC.nicoClean, uppercase: true },
  labelSmall: { ...TRMNL_CLASSIC.nicoPups, uppercase: true },
  description: { ...TRMNL_CLASSIC.nicoPups, uppercase: false },
  value: { ...TRMNL_CLASSIC.nicoClean, uppercase: true },
  action: { ...TRMNL_CLASSIC.nicoClean, uppercase: true },
  countdown: { ...TRMNL_CLASSIC.blockKie, uppercase: false },
};

/** TRMNL bracket CTA copy, e.g. `[ START WALK → ]`. */
export function formatTrmnlActionLabel(label: string): string {
  return `[ ${label.toUpperCase()} → ]`;
}

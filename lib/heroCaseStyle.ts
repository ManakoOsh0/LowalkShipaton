/**
 * Hero case material styles — lighting, radius, and lip packs.
 * Independent of case color. Outer padding and well height stay fixed.
 */
import { HERO_EINK_FRAME_PADDING } from "@/lib/heroEink";

export const DEFAULT_HERO_CASE_STYLE_ID = "silicone" as const;

export type HeroCaseStyleId =
  | typeof DEFAULT_HERO_CASE_STYLE_ID
  | "bumper"
  | "skin"
  | "ceramic";

export type HeroCaseStyleTokens = {
  id: HeroCaseStyleId;
  label: string;
  radius: number;
  crownOpacity: number;
  crownEdge: number;
  ambientOpacity: number;
  ambientRimOpacity: number;
  ambientEdge: number;
  lipOpacity: number;
  lipRimOpacity: number;
  lipDepth: number;
  wellBezelOpacity: number;
  wellBezelRimOpacity: number;
  wellBezelSize: number;
  wellInsetEdge: number;
  /** Black outline around the LCD cutout. Sells a punched gadget screen. */
  wellStrokeWidth: number;
  wellStrokeOpacity: number;
  glassWashOpacity: number;
  /** Milky veil over LCD copy — sells glass above the panel. */
  glassVeilOpacity: number;
  /** Soft inner vignette at the screen edge (all sides). */
  glassVignetteOpacity: number;
  glassVignetteSize: number;
  contactShadow: string;
  ambientShadow: string;
  /** Hairline outer edge. 0 = none. */
  edgeStrokeOpacity: number;
  /** Second ring on the existing 12px rail. Bumper only. */
  bumperRing: boolean;
};

export const HERO_CASE_STYLES = [
  {
    id: DEFAULT_HERO_CASE_STYLE_ID,
    label: "Silicone",
    radius: 36,
    crownOpacity: 0.08,
    crownEdge: 24,
    ambientOpacity: 0.05,
    ambientRimOpacity: 0.08,
    ambientEdge: 36,
    lipOpacity: 0.07,
    lipRimOpacity: 0.04,
    lipDepth: 14,
    wellBezelOpacity: 0.28,
    wellBezelRimOpacity: 0.16,
    wellBezelSize: 22,
    wellInsetEdge: 0,
    wellStrokeWidth: 1.5,
    wellStrokeOpacity: 0.5,
    glassWashOpacity: 0.038,
    glassVeilOpacity: 0.05,
    glassVignetteOpacity: 0.2,
    glassVignetteSize: 52,
    contactShadow: "0px 2px 6px rgba(0, 0, 0, 0.18)",
    ambientShadow: "0px 14px 32px rgba(0, 0, 0, 0.16)",
    edgeStrokeOpacity: 0,
    bumperRing: false,
  },
  {
    id: "bumper",
    label: "Bumper",
    radius: 40,
    crownOpacity: 0.06,
    crownEdge: 20,
    ambientOpacity: 0.08,
    ambientRimOpacity: 0.12,
    ambientEdge: 40,
    lipOpacity: 0.1,
    lipRimOpacity: 0.05,
    lipDepth: 16,
    wellBezelOpacity: 0.38,
    wellBezelRimOpacity: 0.18,
    wellBezelSize: 24,
    wellInsetEdge: 0,
    wellStrokeWidth: 1.5,
    wellStrokeOpacity: 0.55,
    glassWashOpacity: 0.042,
    glassVeilOpacity: 0.055,
    glassVignetteOpacity: 0.26,
    glassVignetteSize: 56,
    contactShadow: "0px 3px 8px rgba(0, 0, 0, 0.22)",
    ambientShadow: "0px 16px 36px rgba(0, 0, 0, 0.2)",
    edgeStrokeOpacity: 0.08,
    bumperRing: true,
  },
  {
    id: "skin",
    label: "Skin",
    radius: 28,
    crownOpacity: 0.04,
    crownEdge: 12,
    ambientOpacity: 0.03,
    ambientRimOpacity: 0.04,
    ambientEdge: 24,
    lipOpacity: 0.04,
    lipRimOpacity: 0.02,
    lipDepth: 8,
    wellBezelOpacity: 0.24,
    wellBezelRimOpacity: 0.1,
    wellBezelSize: 16,
    wellInsetEdge: 0,
    wellStrokeWidth: 1,
    wellStrokeOpacity: 0.4,
    glassWashOpacity: 0.03,
    glassVeilOpacity: 0.038,
    glassVignetteOpacity: 0.16,
    glassVignetteSize: 40,
    contactShadow: "0px 1px 4px rgba(0, 0, 0, 0.14)",
    ambientShadow: "0px 6px 14px rgba(0, 0, 0, 0.08)",
    edgeStrokeOpacity: 0.04,
    bumperRing: false,
  },
  {
    id: "ceramic",
    label: "Ceramic",
    radius: 32,
    crownOpacity: 0.12,
    crownEdge: 32,
    ambientOpacity: 0.02,
    ambientRimOpacity: 0.04,
    ambientEdge: 20,
    lipOpacity: 0.05,
    lipRimOpacity: 0.02,
    lipDepth: 10,
    wellBezelOpacity: 0.3,
    wellBezelRimOpacity: 0.14,
    wellBezelSize: 18,
    wellInsetEdge: 0,
    wellStrokeWidth: 1.5,
    wellStrokeOpacity: 0.48,
    glassWashOpacity: 0.062,
    glassVeilOpacity: 0.048,
    glassVignetteOpacity: 0.18,
    glassVignetteSize: 46,
    contactShadow: "0px 2px 8px rgba(0, 0, 0, 0.16)",
    ambientShadow: "0px 10px 24px rgba(0, 0, 0, 0.12)",
    edgeStrokeOpacity: 0.12,
    bumperRing: false,
  },
] as const satisfies readonly HeroCaseStyleTokens[];

export function isHeroCaseStyleId(value: string): value is HeroCaseStyleId {
  return HERO_CASE_STYLES.some((style) => style.id === value);
}

export function getHeroCaseStyle(id: string): HeroCaseStyleTokens {
  return (
    HERO_CASE_STYLES.find((style) => style.id === id) ?? HERO_CASE_STYLES[0]
  );
}

/** Inner well radius stays concentric with the style’s outer squircle. */
export function getHeroStylePaperRadius(style: HeroCaseStyleTokens): number {
  return Math.max(style.radius - HERO_EINK_FRAME_PADDING, 8);
}

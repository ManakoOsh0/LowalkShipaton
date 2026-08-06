/**
 * Hero motion tokens — hybrid TRMNL refresh + smooth progress timing.
 */
import { Easing, FadeIn, FadeInDown, FadeOut, type EntryOrExitLayoutType } from "react-native-reanimated";

export const HERO_MOTION = {
  /** Hero session ring / segment bar — deliberate e-ink refresh pace. */
  progressMs: 900,
  /** Dashboard and stats progress bars — under the 300ms UI budget. */
  progressCardMs: 300,
  statsFadeMs: 300,
  statsBarMs: 400,
  sheetEnterMs: 320,
  refreshMs: 220,
  /** Split-flap digit tick on active session countdown. */
  flipMs: 260,
  verifyBlinkMs: 600,
  /** Hold-to-confirm when Reduce Motion is on — fast linear fill, not instant skip. */
  reduceMotionHoldMs: 400,
  staggerHeaderMs: 120,
  staggerFocusMs: 150,
  staggerFocusDelayMs: 40,
  staggerFooterMs: 120,
  staggerFooterDelayMs: 80,
  markerSpring: { damping: 14, stiffness: 180 },
  progressEasing: Easing.out(Easing.cubic),
  linearEasing: Easing.linear,
} as const;

export function buildHeroTransitionKey(
  state: string,
  nodeId?: string | null,
): string {
  return `${state}:${nodeId ?? "none"}`;
}

export function heroHeaderEntering(
  reduceMotion: boolean,
): EntryOrExitLayoutType | undefined {
  if (reduceMotion) return undefined;
  return FadeInDown.duration(HERO_MOTION.staggerHeaderMs);
}

export function heroFocusEntering(
  reduceMotion: boolean,
): EntryOrExitLayoutType | undefined {
  if (reduceMotion) return undefined;
  return FadeIn.duration(HERO_MOTION.staggerFocusMs).delay(
    HERO_MOTION.staggerFocusDelayMs,
  );
}

export function heroFooterEntering(
  reduceMotion: boolean,
): EntryOrExitLayoutType | undefined {
  if (reduceMotion) return undefined;
  return FadeIn.duration(HERO_MOTION.staggerFooterMs).delay(
    HERO_MOTION.staggerFooterDelayMs,
  );
}

/** In-sheet step body crossfade — actions ↔ confirm, anchoring hold → map. */
export function sheetStepEntering(
  reduceMotion: boolean,
): EntryOrExitLayoutType | undefined {
  if (reduceMotion) {
    return FadeIn.duration(120);
  }

  return FadeIn.duration(220)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });
}

export function sheetStepExiting(
  reduceMotion: boolean,
): EntryOrExitLayoutType | undefined {
  if (reduceMotion) {
    return FadeOut.duration(120);
  }

  return FadeOut.duration(160);
}

/** Rare celebration overlays — scale from 0.92, never from zero. */
export function modalContentEntering(
  reduceMotion: boolean,
): EntryOrExitLayoutType | undefined {
  if (reduceMotion) {
    return FadeIn.duration(150);
  }

  return FadeIn.duration(280)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ scale: 0.92 }] });
}

export function modalContentExiting(
  reduceMotion: boolean,
): EntryOrExitLayoutType | undefined {
  if (reduceMotion) {
    return FadeOut.duration(120);
  }

  return FadeOut.duration(200).easing(Easing.out(Easing.cubic));
}

/** Rare arrival celebration — mascot pops in after the sheet settles. */
export function arrivalMascotEntering(
  reduceMotion: boolean,
): EntryOrExitLayoutType | undefined {
  if (reduceMotion) {
    return FadeIn.duration(150);
  }

  return FadeIn.delay(80)
    .springify()
    .damping(HERO_MOTION.markerSpring.damping)
    .stiffness(HERO_MOTION.markerSpring.stiffness)
    .withInitialValues({ opacity: 0, transform: [{ scale: 0.92 }] });
}

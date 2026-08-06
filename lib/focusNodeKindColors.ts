/**
 * Soft pastel palette per Focus Node kind — desaturated icon fills on tinted tiles.
 * Keeps category rows organized without competing with status badges on the right.
 */
import type { ScheduleItemKind } from "@/types/dashboard";
import type { FocusNodeKind } from "@/types/focusNode";

export type KindColorKey = FocusNodeKind | ScheduleItemKind;

/** Muted accent for left-hand category icons (not status indicators). */
export const FOCUS_KIND_ACCENTS: Record<KindColorKey, string> = {
  gym: "#9B8BB8",
  class: "#7BA88A",
  library: "#8BA4C4",
  custom: "#A39E97",
};

const TILE_ALPHA = 0.16;

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getKindAccentColor(kind: KindColorKey): string {
  return FOCUS_KIND_ACCENTS[kind] ?? FOCUS_KIND_ACCENTS.custom;
}

/** Pastel tile wash behind kind icons. */
export function getKindTintColor(kind: KindColorKey, alpha = TILE_ALPHA): string {
  return hexToRgba(getKindAccentColor(kind), alpha);
}

const KIND_LABELS: Record<KindColorKey, string> = {
  gym: "Gym",
  class: "Class",
  library: "Study",
  custom: "Focus",
};

export function getKindLabel(kind: KindColorKey): string {
  return KIND_LABELS[kind] ?? KIND_LABELS.custom;
}

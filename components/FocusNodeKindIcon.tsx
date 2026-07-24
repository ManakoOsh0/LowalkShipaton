/**
 * FocusNodeKindIcon — shared schedule / hero / shield glyph for each Focus Node kind.
 */
import { MagicStick } from "@solar-icons/react-native/Bold";
import { ComponentType } from "react";

import { ClassKindIcon } from "@/components/ClassKindIcon";
import { GymKindIcon } from "@/components/GymKindIcon";
import { LibraryKindIcon } from "@/components/LibraryKindIcon";
import { getKindAccentColor } from "@/lib/focusNodeKindColors";
import type { FocusNodeKind } from "@/types/focusNode";
import type { IconProps } from "@solar-icons/react-native/lib/types";

const KIND_ICONS: Record<FocusNodeKind, ComponentType<IconProps>> = {
  class: ClassKindIcon,
  library: LibraryKindIcon,
  gym: GymKindIcon,
  custom: MagicStick,
};

type FocusNodeKindIconProps = IconProps & {
  kind: FocusNodeKind;
};

export function FocusNodeKindIcon({ kind, size = 24, color }: FocusNodeKindIconProps) {
  const Icon = KIND_ICONS[kind] ?? MagicStick;
  return <Icon size={size} color={color ?? getKindAccentColor(kind)} />;
}

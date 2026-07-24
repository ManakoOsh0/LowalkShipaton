import { MagicStick, ShieldMinimalistic } from "@solar-icons/react-native/Bold";

import { ComponentType } from "react";



import { ClassKindIcon } from "@/components/ClassKindIcon";

import { GymKindIcon } from "@/components/GymKindIcon";

import { LibraryKindIcon } from "@/components/LibraryKindIcon";

import { getKindAccentColor, getKindTintColor } from "@/lib/focusNodeKindColors";

import type { IconProps } from "@solar-icons/react-native/lib/types";



export type FocusNodeTemplateId = "class" | "gym" | "library" | "custom";



export type QuickActionId = FocusNodeTemplateId | "blocked-apps";



export type QuickActionTemplate = {

  id: QuickActionId;

  label: string;

  accent: string;

  tint: string;

  Icon: ComponentType<IconProps>;

};



function kindAction(

  id: FocusNodeTemplateId,

  label: string,

  Icon: ComponentType<IconProps>,

): QuickActionTemplate {

  return {

    id,

    label,

    accent: getKindAccentColor(id),

    tint: getKindTintColor(id),

    Icon,

  };

}



/** Preset Focus Node templates and shortcuts surfaced from the center FAB popover. */

export const quickActionTemplates: QuickActionTemplate[] = [

  kindAction("class", "Class", ClassKindIcon),

  kindAction("gym", "Gym", GymKindIcon),

  kindAction("library", "Library", LibraryKindIcon),

  kindAction("custom", "Custom", MagicStick),

  {

    id: "blocked-apps",

    label: "Blocked Apps",

    accent: "#EF4444",

    tint: "rgba(239, 68, 68, 0.14)",

    Icon: ShieldMinimalistic,

  },

];



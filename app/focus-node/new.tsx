import { useLocalSearchParams } from "expo-router";

import { FocusNodeForm } from "@/components/FocusNodeForm";
import type { FocusNodeTemplateId } from "@/data/quickActions";
import type { Weekday } from "@/types/focusNode";

const TEMPLATES: FocusNodeTemplateId[] = ["class", "gym", "library", "custom"];

function resolveTemplate(value: string | string[] | undefined): FocusNodeTemplateId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && TEMPLATES.includes(raw as FocusNodeTemplateId)) {
    return raw as FocusNodeTemplateId;
  }
  return "custom";
}

function resolveWeekday(value: string | string[] | undefined): Weekday | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (parsed >= 0 && parsed <= 6) {
    return parsed as Weekday;
  }
  return undefined;
}

/** Create route — FAB and schedule shortcuts land here with optional template defaults. */
export default function NewFocusNodeScreen() {
  const { template, weekday, returnToWeek } = useLocalSearchParams<{
    template?: string;
    weekday?: string;
    returnToWeek?: string;
  }>();

  return (
    <FocusNodeForm
      mode="create"
      templateId={resolveTemplate(template)}
      initialWeekday={resolveWeekday(weekday)}
      returnToWeek={returnToWeek === "1"}
    />
  );
}

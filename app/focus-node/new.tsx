import { useLocalSearchParams } from "expo-router";

import { FocusNodeForm } from "@/components/FocusNodeForm";
import type { FocusNodeTemplateId } from "@/data/quickActions";

const TEMPLATES: FocusNodeTemplateId[] = ["class", "gym", "library", "custom"];

function resolveTemplate(value: string | string[] | undefined): FocusNodeTemplateId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && TEMPLATES.includes(raw as FocusNodeTemplateId)) {
    return raw as FocusNodeTemplateId;
  }
  return "custom";
}

/** Create route — FAB templates land here with preset schedule defaults. */
export default function NewFocusNodeScreen() {
  const { template } = useLocalSearchParams<{ template?: string }>();

  return <FocusNodeForm mode="create" templateId={resolveTemplate(template)} />;
}

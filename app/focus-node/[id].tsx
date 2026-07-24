import { useLocalSearchParams } from "expo-router";

import { FocusNodeForm } from "@/components/FocusNodeForm";

/** Edit route — opened from ScheduleCard or Hero Manage. */
export default function EditFocusNodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nodeId = Array.isArray(id) ? id[0] : id;

  return <FocusNodeForm mode="edit" nodeId={nodeId} />;
}

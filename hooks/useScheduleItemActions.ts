import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import type { ScheduleItemActionSheetProps } from "@/components/ScheduleItemActionSheet";
import { ROUTES } from "@/lib/routes";
import { useScheduleStore } from "@/store/useScheduleStore";
import type { ScheduleItem } from "@/types/dashboard";

/** Long-press actions for schedule rows — edit or delete the underlying Focus Node. */
export function useScheduleItemActions() {
  const router = useRouter();
  const removeFocusNode = useScheduleStore((state) => state.removeFocusNode);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const showScheduleItemActions = useCallback((item: ScheduleItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedItem(item);
  }, []);

  const dismissScheduleItemActions = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleEdit = useCallback(
    (item: ScheduleItem) => {
      router.push(ROUTES.focusNodeEdit(item.id));
    },
    [router],
  );

  const handleDelete = useCallback(
    (item: ScheduleItem) => {
      removeFocusNode(item.id);
    },
    [removeFocusNode],
  );

  const actionSheetProps: ScheduleItemActionSheetProps = {
    item: selectedItem,
    onClose: dismissScheduleItemActions,
    onEdit: handleEdit,
    onDelete: handleDelete,
  };

  return { showScheduleItemActions, actionSheetProps };
}

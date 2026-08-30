/**
 * TodayScheduleItemCard — single today session with focus elevation and press scale.
 * Elevates the actionable row (active or next-up) without competing with the Hero card.
 */
import { NeuCard } from "@/components/NeuCard";
import { PressableScale } from "@/components/PressableScale";
import { ScheduleRow } from "@/components/ScheduleRow";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_LG } from "@/lib/cardStyle";
import { getKindTintColor } from "@/lib/focusNodeKindColors";
import type { ScheduleItem } from "@/types/dashboard";

type TodayScheduleItemCardProps = {
  item: ScheduleItem;
  isFocus?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function TodayScheduleItemCard({
  item,
  isFocus = false,
  onPress,
  onLongPress,
}: TodayScheduleItemCardProps) {
  const colors = useThemeColors();
  const isActive = item.status === "active";
  const isDimmed = item.status === "completed" || item.status === "skipped";
  const isElevated = isFocus || isActive;

  const cardBackground = isActive
    ? colors.primarySoft
    : isFocus
      ? getKindTintColor(item.kind, 0.08)
      : undefined;

  const card = (
    <NeuCard
      borderRadius={CARD_RADIUS_LG}
      shadowVariant={isElevated ? "md" : "sm"}
      backgroundColor={cardBackground}
      style={isDimmed ? { opacity: 0.78 } : undefined}
      contentStyle={{ padding: 0 }}
    >
      <ScheduleRow {...item} variant="today" />
    </NeuCard>
  );

  if (!onPress && !onLongPress) {
    return card;
  }

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={
        onLongPress ? "Long press for edit or delete options" : undefined
      }
      onPress={onPress}
      onLongPress={onLongPress}
      haptic={Boolean(onPress)}
    >
      {card}
    </PressableScale>
  );
}

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
  onMenuPress?: () => void;
};

export function TodayScheduleItemCard({
  item,
  isFocus = false,
  onPress,
  onLongPress,
  onMenuPress,
}: TodayScheduleItemCardProps) {
  const colors = useThemeColors();
  const isActive = item.status === "active";
  const isDimmed = item.status === "completed" || item.status === "skipped";

  const cardBackground = isActive
    ? colors.primarySoft
    : isFocus
      ? getKindTintColor(item.kind, 0.08)
      : undefined;

  const card = (
    <NeuCard
      borderRadius={CARD_RADIUS_LG}
      // Flat list rows — tint only; drop shadow reads as a rectangular halo on RN.
      shadowVariant="none"
      backgroundColor={cardBackground}
      style={isDimmed ? { opacity: 0.78 } : undefined}
      contentStyle={{ padding: 0 }}
    >
      <ScheduleRow {...item} variant="today" onMenuPress={onMenuPress} />
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
        onLongPress ? "Long press or tap the menu for edit, skip, or delete options" : undefined
      }
      onPress={onPress}
      onLongPress={onLongPress}
      haptic={Boolean(onPress)}
    >
      {card}
    </PressableScale>
  );
}

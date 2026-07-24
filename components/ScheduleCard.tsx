/**
 * Schedule row card — single session in its own bordered surface.
 */
import { NeuCard } from "@/components/NeuCard";
import { ScheduleRow } from "@/components/ScheduleRow";
import { CARD_RADIUS_XL } from "@/lib/cardStyle";
import type { ScheduleItem } from "@/types/dashboard";

type ScheduleCardProps = ScheduleItem & {
  onPress?: () => void;
};

export function ScheduleCard(props: ScheduleCardProps) {
  const { onPress, ...item } = props;

  return (
    <NeuCard borderRadius={CARD_RADIUS_XL} contentStyle={{ padding: 0 }}>
      <ScheduleRow {...item} onPress={onPress} />
    </NeuCard>
  );
}

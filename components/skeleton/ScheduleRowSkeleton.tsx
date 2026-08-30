/**
 * Schedule-row placeholder — icon tile, title/meta lines, and status ring.
 * Used on Home and the week Schedule screen so loading matches the real cards.
 */
import { View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { CARD_RADIUS_LG, ICON_TILE_RADIUS_LG } from "@/lib/cardStyle";

type ScheduleRowSkeletonProps = {
  titleWidth?: number;
};

export function ScheduleRowSkeleton({ titleWidth = 148 }: ScheduleRowSkeletonProps) {
  return (
    <NeuCard
      borderRadius={CARD_RADIUS_LG}
      shadowVariant="sm"
      contentStyle={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 12,
      }}
    >
      <SkeletonBone width={40} height={40} borderRadius={ICON_TILE_RADIUS_LG} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBone width={titleWidth} height={14} borderRadius={7} />
        <SkeletonBone width={110} height={10} borderRadius={5} />
      </View>
      <SkeletonBone width={24} height={24} borderRadius={12} />
    </NeuCard>
  );
}

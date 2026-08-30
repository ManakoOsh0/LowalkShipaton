/**
 * Session detail placeholder — icon, title, stat tiles, and history grid.
 * Replaces the previous blank screen while the schedule store rehydrates.
 */
import { View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { ICON_TILE_RADIUS_LG } from "@/lib/cardStyle";

const TILES = 3;
const HEATMAP_WEEKS = 16;
const HEATMAP_DAYS = 7;

export function SessionDetailSkeleton() {
  return (
    <SkeletonScope
      label="Loading session"
      style={{ paddingHorizontal: 16, paddingBottom: 40 }}
    >
      <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 20, gap: 12 }}>
        <SkeletonBone
          width={72}
          height={72}
          borderRadius={ICON_TILE_RADIUS_LG + 4}
        />
        <SkeletonBone width={188} height={26} borderRadius={10} />
        <SkeletonBone width={156} height={14} borderRadius={7} />
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
        {Array.from({ length: TILES }, (_, index) => (
          <NeuCard
            key={index}
            borderRadius={16}
            style={{ flex: 1 }}
            contentStyle={{
              paddingHorizontal: 10,
              paddingVertical: 14,
              alignItems: "center",
              gap: 8,
              minHeight: 108,
              justifyContent: "center",
            }}
          >
            <SkeletonBone width={18} height={18} borderRadius={9} />
            <SkeletonBone width={36} height={22} borderRadius={8} />
            <SkeletonBone width={64} height={10} borderRadius={5} />
          </NeuCard>
        ))}
      </View>

      <NeuCard
        borderRadius={18}
        contentStyle={{ paddingHorizontal: 16, paddingVertical: 18 }}
      >
        <SkeletonBone width={86} height={18} borderRadius={8} />
        <View style={{ marginTop: 16, flexDirection: "row", gap: 4 }}>
          {Array.from({ length: HEATMAP_WEEKS }, (_, week) => (
            <View key={week} style={{ gap: 3 }}>
              {Array.from({ length: HEATMAP_DAYS }, (_, day) => (
                <SkeletonBone
                  key={day}
                  width={11}
                  height={11}
                  borderRadius={2}
                />
              ))}
            </View>
          ))}
        </View>
      </NeuCard>
    </SkeletonScope>
  );
}

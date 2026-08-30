/**
 * Edit-form placeholder so fields don't flash template defaults before the node loads.
 */
import { View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { CARD_RADIUS_XL } from "@/lib/cardStyle";
import { SCREEN_PADDING } from "@/lib/layout";

export function FocusNodeFormSkeleton() {
  return (
    <SkeletonScope
      label="Loading focus node"
      style={{
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 8,
        gap: 20,
      }}
    >
      <View style={{ gap: 10 }}>
        <SkeletonBone width={72} height={11} borderRadius={6} />
        <NeuCard
          borderRadius={CARD_RADIUS_XL}
          shadowVariant="none"
          contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 14 }}
        >
          <SkeletonBone width="100%" height={44} borderRadius={14} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[0, 1, 2, 3].map((index) => (
              <SkeletonBone
                key={index}
                width={64}
                height={36}
                borderRadius={12}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        </NeuCard>
      </View>

      <View style={{ gap: 10 }}>
        <SkeletonBone width={86} height={11} borderRadius={6} />
        <NeuCard
          borderRadius={CARD_RADIUS_XL}
          shadowVariant="none"
          contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
        >
          <SkeletonBone width="100%" height={44} borderRadius={14} />
          <SkeletonBone width="100%" height={44} borderRadius={14} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[0, 1, 2].map((index) => (
              <SkeletonBone
                key={index}
                width={40}
                height={40}
                borderRadius={12}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        </NeuCard>
      </View>

      <SkeletonBone width="100%" height={52} borderRadius={16} />
    </SkeletonScope>
  );
}

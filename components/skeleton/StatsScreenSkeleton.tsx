/**
 * Activity/stats placeholder while persisted session history hydrates.
 * Back chrome stays real; content matches today receipt + period recap + bars.
 */
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_MD } from "@/lib/cardStyle";
import { SCREEN_PADDING } from "@/lib/layout";

const BAR_HEIGHTS = [48, 92, 64, 118, 76, 104, 58] as const;

export function StatsScreenSkeleton() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <SkeletonScope
      label="Loading activity"
      style={{
        flex: 1,
        paddingHorizontal: SCREEN_PADDING,
        paddingBottom: insets.bottom + 40,
        gap: 32,
      }}
    >
      <View style={{ gap: 12 }}>
        <SkeletonBone width={64} height={12} borderRadius={6} />
        <View
          style={{
            borderRadius: CARD_RADIUS_MD,
            borderCurve: "continuous",
            backgroundColor: colors.card,
            paddingHorizontal: 18,
            paddingVertical: 18,
            gap: 14,
          }}
        >
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <SkeletonBone width={index === 1 ? 108 : 92} height={14} borderRadius={7} />
              <SkeletonBone width={index === 1 ? 140 : 56} height={14} borderRadius={7} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 28, paddingTop: 4, alignItems: "center" }}>
        <View style={{ gap: 10, alignItems: "center" }}>
          <SkeletonBone width={132} height={32} borderRadius={10} />
          <SkeletonBone width={118} height={14} borderRadius={7} />
        </View>
        <View style={{ alignSelf: "stretch", gap: 10 }}>
          <SkeletonBone width={72} height={52} borderRadius={12} />
          <SkeletonBone width={148} height={16} borderRadius={8} />
          <SkeletonBone width={210} height={14} borderRadius={7} />
          <SkeletonBone width={188} height={14} borderRadius={7} />
        </View>
      </View>

      <View
        style={{
          height: 168,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {BAR_HEIGHTS.map((height, index) => (
          <View
            key={index}
            style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}
          >
            <SkeletonBone width={22} height={height} borderRadius={5} />
          </View>
        ))}
      </View>

      <View
        style={{
          borderRadius: CARD_RADIUS_MD,
          borderCurve: "continuous",
          backgroundColor: colors.card,
          overflow: "hidden",
        }}
      >
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBone width={72} height={10} borderRadius={5} />
              <SkeletonBone width={108} height={24} borderRadius={8} />
              <SkeletonBone width={88} height={12} borderRadius={6} />
            </View>
            <SkeletonBone width={64} height={6} borderRadius={3} />
          </View>
        ))}
      </View>
    </SkeletonScope>
  );
}

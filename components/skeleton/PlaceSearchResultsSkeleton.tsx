/**
 * Venue search result placeholders — replaces the spinner with layout-matched rows.
 */
import { View } from "react-native";

import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { useThemeColors } from "@/hooks/useThemeColors";

const TITLE_WIDTHS = [168, 142, 186, 154] as const;

export function PlaceSearchResultsSkeleton() {
  const colors = useThemeColors();

  return (
    <SkeletonScope label="Searching places" style={{ gap: 8 }}>
      {TITLE_WIDTHS.map((width, index) => (
        <View
          key={index}
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <SkeletonBone width={width} height={15} borderRadius={7} />
          <SkeletonBone width={index % 2 === 0 ? "88%" : "64%"} height={12} borderRadius={6} />
        </View>
      ))}
    </SkeletonScope>
  );
}

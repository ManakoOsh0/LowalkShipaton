/**
 * Week schedule placeholder — scrollable day columns.
 */
import { View, useWindowDimensions } from "react-native";

import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { SCREEN_PADDING } from "@/lib/layout";
import {
  resolveWeekColumnWidth,
  WEEK_COLUMN_GAP,
  WEEK_VISIBLE_COLUMN_COUNT,
} from "@/lib/weekTimetable";

const COLUMN_HEIGHT = 220;

export function ScheduleScreenSkeleton() {
  const { width: screenWidth } = useWindowDimensions();
  const columnWidth = resolveWeekColumnWidth(screenWidth);

  return (
    <SkeletonScope
      label="Loading schedule"
      style={{
        flex: 1,
        paddingHorizontal: SCREEN_PADDING,
        paddingBottom: 40,
        gap: 12,
      }}
    >
      <SkeletonBone width={88} height={14} borderRadius={7} />
      <View style={{ flexDirection: "row", gap: WEEK_COLUMN_GAP }}>
        {Array.from({ length: WEEK_VISIBLE_COLUMN_COUNT }, (_, index) => (
          <View key={index} style={{ width: columnWidth, gap: 10 }}>
            <SkeletonBone width={48} height={24} borderRadius={12} style={{ alignSelf: "center" }} />
            <SkeletonBone width="100%" height={COLUMN_HEIGHT} borderRadius={12} />
          </View>
        ))}
      </View>
    </SkeletonScope>
  );
}

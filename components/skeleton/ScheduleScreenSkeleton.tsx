/**
 * Week schedule placeholder — day headers plus session rows, matching the live list.
 */
import { View } from "react-native";

import { ScheduleRowSkeleton } from "@/components/skeleton/ScheduleRowSkeleton";
import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { SCREEN_PADDING, SECTION_GAP } from "@/lib/layout";

const DAYS = [
  { label: 92, date: 48, rows: 2 },
  { label: 78, date: 52, rows: 1 },
  { label: 86, date: 44, rows: 2 },
  { label: 74, date: 50, rows: 1 },
] as const;

export function ScheduleScreenSkeleton() {
  return (
    <SkeletonScope
      label="Loading schedule"
      style={{
        paddingHorizontal: SCREEN_PADDING,
        paddingBottom: 40,
        gap: SECTION_GAP,
      }}
    >
      {DAYS.map((day, index) => (
        <View key={index} style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <SkeletonBone width={day.label} height={16} borderRadius={8} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <SkeletonBone width={day.date} height={14} borderRadius={7} />
              <SkeletonBone width={28} height={28} borderRadius={8} />
            </View>
          </View>
          {Array.from({ length: day.rows }, (_, rowIndex) => (
            <ScheduleRowSkeleton
              key={rowIndex}
              titleWidth={rowIndex === 0 ? 148 : 124}
            />
          ))}
        </View>
      ))}
    </SkeletonScope>
  );
}

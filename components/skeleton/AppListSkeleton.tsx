/**
 * App-row placeholders for the blocked-apps list and the installed-app picker.
 */
import { View } from "react-native";

import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { useThemeColors } from "@/hooks/useThemeColors";

type AppListSkeletonProps = {
  rows?: number;
  label?: string;
};

export function AppListSkeleton({
  rows = 6,
  label = "Loading apps",
}: AppListSkeletonProps) {
  const colors = useThemeColors();
  const widths = [132, 118, 154, 140, 126, 148];

  return (
    <SkeletonScope label={label} style={{ gap: 10 }}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 16,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <SkeletonBone width={36} height={36} borderRadius={10} />
          <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
            <SkeletonBone
              width={widths[index % widths.length]}
              height={14}
              borderRadius={7}
            />
            <SkeletonBone width={96} height={10} borderRadius={5} />
          </View>
          <SkeletonBone width={22} height={22} borderRadius={11} />
        </View>
      ))}
    </SkeletonScope>
  );
}

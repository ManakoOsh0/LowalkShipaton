/**
 * Settings placeholder for persisted reward totals and preference cards.
 */
import { View } from "react-native";

import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { useThemeColors } from "@/hooks/useThemeColors";

export function SettingsScreenSkeleton() {
  const colors = useThemeColors();

  return (
    <SkeletonScope label="Loading settings" style={{ gap: 24 }}>
      {[0, 1, 2].map((section) => (
        <View key={section} style={{ gap: 10 }}>
          <SkeletonBone width={section === 0 ? 108 : 96} height={11} borderRadius={6} />
          <View
            style={{
              borderRadius: 20,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 12,
            }}
          >
            <SkeletonBone width="54%" height={16} borderRadius={8} />
            <SkeletonBone width="88%" height={12} borderRadius={6} />
            <SkeletonBone width="100%" height={40} borderRadius={12} />
          </View>
        </View>
      ))}
    </SkeletonScope>
  );
}

/**
 * Home dashboard placeholder while schedule/user stores rehydrate from disk.
 * Chrome (date, tab bar) stays real so the layout does not jump.
 */
import { Text, View } from "react-native";

import { HeroEinkFrame } from "@/components/HeroEinkFrame";
import { NeuCard } from "@/components/NeuCard";
import { ScheduleRowSkeleton } from "@/components/skeleton/ScheduleRowSkeleton";
import { SkeletonBone, SkeletonScope } from "@/components/skeleton/SkeletonBone";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PILL_RADIUS } from "@/lib/cardStyle";
import { HERO_EINK_PADDING } from "@/lib/heroEink";
import { CARD_GAP, SCREEN_PADDING } from "@/lib/layout";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";

const TITLE_WIDTHS = [156, 132, 148] as const;

function formatWeekday(date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function formatDateSubtitle(date = new Date()): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

export function HomeDashboardSkeleton() {
  const colors = useThemeColors();
  const today = new Date();

  return (
    <SkeletonScope label="Loading home" style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: SCREEN_PADDING,
          paddingTop: 10,
          paddingBottom: 12,
          gap: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Text
            style={textStyle("h3", colors.foreground, {
              flexShrink: 1,
              fontFamily: FONT_FAMILY.bold,
            })}
            numberOfLines={1}
          >
            {formatWeekday(today)}
          </Text>
          <NeuCard
            borderRadius={PILL_RADIUS}
            shadowVariant="sm"
            contentStyle={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <SkeletonBone width={18} height={18} borderRadius={9} />
            <SkeletonBone width={22} height={14} borderRadius={7} />
          </NeuCard>
        </View>
        <Text style={textStyle("bodySm", colors.muted)}>
          {formatDateSubtitle(today)}
        </Text>
      </View>

      <NeuCard
        borderRadius={PILL_RADIUS}
        style={{ marginHorizontal: SCREEN_PADDING }}
        contentStyle={{
          paddingHorizontal: 18,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        <SkeletonBone width="62%" height={16} borderRadius={8} />
        <SkeletonBone width="100%" height={10} borderRadius={5} />
      </NeuCard>

      <View style={{ marginTop: 12, paddingHorizontal: SCREEN_PADDING }}>
        <HeroEinkFrame>
          <View style={{ flex: 1, padding: HERO_EINK_PADDING, gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <SkeletonBone width={72} height={10} borderRadius={5} tone="onLight" />
              <SkeletonBone width={56} height={10} borderRadius={5} tone="onLight" />
            </View>
            <SkeletonBone width="68%" height={18} borderRadius={8} tone="onLight" />
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <SkeletonBone width={88} height={88} borderRadius={22} tone="onLight" />
            </View>
          </View>
        </HeroEinkFrame>
      </View>

      <View
        style={{
          flex: 1,
          minHeight: 0,
          marginTop: CARD_GAP,
          paddingHorizontal: SCREEN_PADDING,
          gap: 10,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <SkeletonBone width={118} height={18} borderRadius={8} />
          <SkeletonBone width={64} height={14} borderRadius={7} />
        </View>
        {TITLE_WIDTHS.map((width) => (
          <ScheduleRowSkeleton key={width} titleWidth={width} />
        ))}
      </View>
    </SkeletonScope>
  );
}

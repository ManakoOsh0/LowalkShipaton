/**
 * Empty schedule placeholder — matches TodayScheduleCard row styling so the
 * home dashboard stays visually consistent when today has no Focus Nodes.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { PressableScale } from "@/components/PressableScale";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_LG, ICON_TILE_RADIUS_LG } from "@/lib/cardStyle";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";

const ICON_SIZE = 56;

type ScheduleEmptyStateProps = {
  onPress?: () => void;
};

export function ScheduleEmptyState({ onPress }: ScheduleEmptyStateProps) {
  const colors = useThemeColors();

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 24,
        minHeight: 104,
      }}
    >
      <View
        style={{
          marginRight: 16,
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: ICON_TILE_RADIUS_LG + 2,
          borderCurve: "continuous",
          backgroundColor: colors.iconTile,
        }}
      >
        <Ionicons name="calendar-outline" size={28} color={colors.sky} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={textStyle("h4", colors.foreground, {
            fontFamily: FONT_FAMILY.semibold,
            fontSize: 17,
            lineHeight: 23,
          })}
        >
          No sessions today
        </Text>
        <Text style={textStyle("bodyMd", colors.muted, { marginTop: 4 })}>
          {onPress ? "Tap to add your first session." : "Plan the rest of your week in View all."}
        </Text>
      </View>
    </View>
  );

  if (!onPress) {
    return (
      <NeuCard borderRadius={CARD_RADIUS_LG} shadowVariant="sm" contentStyle={{ padding: 0 }}>
        {content}
      </NeuCard>
    );
  }

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Add a session for today"
      onPress={onPress}
      haptic
    >
      <NeuCard borderRadius={CARD_RADIUS_LG} shadowVariant="sm" contentStyle={{ padding: 0 }}>
        {content}
      </NeuCard>
    </PressableScale>
  );
}

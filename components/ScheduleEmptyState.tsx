/**
 * Empty schedule placeholder — centred calendar and copy when today has no Focus Nodes.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useThemeColors } from "@/hooks/useThemeColors";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";

type ScheduleEmptyStateProps = {
  onPress?: () => void;
};

export function ScheduleEmptyState({ onPress }: ScheduleEmptyStateProps) {
  const colors = useThemeColors();

  const content = (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 32,
        gap: 8,
      }}
    >
      <Ionicons name="calendar-outline" size={32} color={colors.sky} />

      <Text
        style={textStyle("h4", colors.foreground, {
          fontFamily: FONT_FAMILY.semibold,
          fontSize: 17,
          lineHeight: 23,
          textAlign: "center",
        })}
      >
        No sessions today
      </Text>

      <Text style={textStyle("bodyMd", colors.muted, { textAlign: "center" })}>
        {onPress ? "Tap to add your first session." : "Plan the rest of your week in View all."}
      </Text>
    </View>
  );

  if (!onPress) {
    return <View style={{ flex: 1 }}>{content}</View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Add a session for today"
        onPress={onPress}
        haptic
        style={{ flex: 1, alignSelf: "stretch" }}
      >
        {content}
      </PressableScale>
    </View>
  );
}

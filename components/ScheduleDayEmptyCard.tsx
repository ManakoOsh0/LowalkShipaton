/**
 * ScheduleDayEmptyCard — tappable per-day empty state for the week schedule screen.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { CARD_RADIUS_LG, ICON_TILE_RADIUS_LG } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";

const ICON_SIZE = 48;

type ScheduleDayEmptyCardProps = {
  dayLabel: string;
  onPress: () => void;
};

export function ScheduleDayEmptyCard({ dayLabel, onPress }: ScheduleDayEmptyCardProps) {
  const colors = useThemeColors();

  return (
    <NeuCard
      borderRadius={CARD_RADIUS_LG}
      shadowVariant="sm"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Add session for ${dayLabel}`}
      contentStyle={{ padding: 0 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 20,
          minHeight: 96,
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
          <Ionicons name="calendar-outline" size={24} color={colors.sky} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 16,
              lineHeight: 22,
              color: colors.foreground,
            }}
          >
            No sessions scheduled
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            Tap to add for {dayLabel}
          </Text>
        </View>

        <Ionicons name="add-circle-outline" size={24} color={colors.foregroundSubtle} />
      </View>
    </NeuCard>
  );
}

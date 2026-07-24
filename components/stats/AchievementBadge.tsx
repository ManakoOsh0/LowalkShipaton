/**
 * AchievementBadge — horizontal scroll badge for unlocked or locked milestones.
 */
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { StatsCardShell } from "@/components/stats/StatsCardShell";
import type { Achievement } from "@/types/stats";
import { useThemeColors } from "@/hooks/useThemeColors";

type AchievementBadgeProps = {
  achievement: Achievement;
};

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(achievement.unlocked ? 0.92 : 1);

  useEffect(() => {
    if (achievement.unlocked) {
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    }
  }, [achievement.unlocked, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <StatsCardShell style={{ marginRight: 12, marginBottom: 0 }}>
        <View
          style={{
            width: 112,
            paddingHorizontal: 12,
            paddingVertical: 16,
            alignItems: "center",
            gap: 8,
            opacity: achievement.unlocked ? 1 : 0.45,
          }}
        >
          <Text style={{ fontSize: 30, lineHeight: 34 }}>{achievement.icon}</Text>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 12,
              lineHeight: 16,
              textAlign: "center",
              color: achievement.unlocked ? colors.foreground : colors.muted,
            }}
          >
            {achievement.title}
          </Text>
        </View>
      </StatsCardShell>
    </Animated.View>
  );
}

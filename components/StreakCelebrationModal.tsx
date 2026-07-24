/**
 * StreakCelebrationModal — full-screen celebration when the user completes today's schedule.
 * Flat minimal layout with streak count and week progress dots.
 */
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NeuCard } from "@/components/NeuCard";
import { CARD_RADIUS_XL } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useStreakCelebrationStore } from "@/store/useStreakCelebrationStore";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const WEEK_WINDOW = 5;

type WeekDot = {
  key: string;
  label: string;
  filled: boolean;
};

function buildWeekDots(streak: number): WeekDot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const safeStreak = Math.max(streak, 1);

  const dots: WeekDot[] = [];
  for (let offset = WEEK_WINDOW - 1; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const daysAgo = Math.round((today.getTime() - date.getTime()) / 86_400_000);
    dots.push({
      key: date.toISOString(),
      label: DAY_LETTERS[date.getDay()],
      filled: daysAgo < safeStreak,
    });
  }
  return dots;
}

function streakMessage(streak: number): string {
  if (streak <= 1) {
    return "Strong start! Keep showing up where you planned to be.";
  }
  if (streak < 7) {
    return "You're building a real routine — one focused day at a time.";
  }
  if (streak < 30) {
    return "This is consistency. Your future self is already benefiting.";
  }
  return "Legendary focus. You're proving you can trust yourself.";
}

function WeekStreakRow({ dots }: { dots: WeekDot[] }) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: 14,
        marginTop: 24,
        marginBottom: 8,
      }}
    >
      {dots.map((dot, index) => (
        <Animated.View
          key={dot.key}
          entering={FadeInDown.delay(200 + index * 60).springify().damping(14)}
          style={{ alignItems: "center", gap: 8 }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: dot.filled ? colors.success : colors.card,
              borderWidth: dot.filled ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            {dot.filled ? (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            ) : null}
          </View>
          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 12,
              color: dot.filled ? colors.foreground : colors.muted,
            }}
          >
            {dot.label}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

export function StreakCelebrationHost() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const visible = useStreakCelebrationStore((state) => state.visible);
  const streak = useStreakCelebrationStore((state) => state.streak);
  const coinAwarded = useStreakCelebrationStore((state) => state.coinAwarded);
  const hide = useStreakCelebrationStore((state) => state.hide);

  const dots = buildWeekDots(streak);
  const displayStreak = Math.max(streak, 1);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={hide}>
      <Animated.View
        entering={FadeIn.duration(220)}
        style={{
          flex: 1,
          backgroundColor: "rgba(13, 19, 43, 0.4)",
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 24,
          justifyContent: "center",
        }}
      >
        <NeuCard
          borderRadius={CARD_RADIUS_XL}
          shadowVariant="lg"
          contentStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${colors.streak}1A`,
            }}
          >
            <Ionicons name="flame-outline" size={32} color={colors.streak} />
          </View>

          <Animated.Text
            entering={FadeInDown.delay(120).springify()}
            style={{
              marginTop: 16,
              fontFamily: "Poppins-Bold",
              fontSize: 48,
              lineHeight: 56,
              color: colors.foreground,
            }}
          >
            {displayStreak}
          </Animated.Text>

          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 18,
              lineHeight: 24,
              color: colors.foreground,
            }}
          >
            day streak
          </Text>

          {coinAwarded ? (
            <Text
              style={{
                marginTop: 8,
                fontFamily: "Poppins-Medium",
                fontSize: 14,
                lineHeight: 20,
                color: colors.primary,
              }}
            >
              +1 Focus Coin earned
            </Text>
          ) : null}

          <WeekStreakRow dots={dots} />

          <Text
            style={{
              marginTop: 16,
              fontFamily: "Poppins-Regular",
              fontSize: 15,
              lineHeight: 22,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            {streakMessage(displayStreak)}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={hide}
            style={({ pressed }) => ({
              marginTop: 24,
              width: "100%",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 14,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 15,
                color: colors.foreground,
              }}
            >
              Continue
            </Text>
          </Pressable>
        </NeuCard>
      </Animated.View>
    </Modal>
  );
}

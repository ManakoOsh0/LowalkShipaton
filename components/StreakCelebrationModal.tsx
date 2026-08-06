/**
 * StreakCelebrationModal — full-screen daily-goal celebration when today's schedule is complete.
 * Mirrors SessionCompleteScreen: one hero badge, one headline, date, optional coin line, CTA.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FocusCoinIcon } from "@/components/FocusCoinIcon";
import { PressableScale } from "@/components/PressableScale";
import { StreakFlame } from "@/components/StreakFlame";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering, modalContentEntering } from "@/lib/heroMotion";
import { PILL_RADIUS } from "@/lib/cardStyle";
import { useStreakCelebrationStore } from "@/store/useStreakCelebrationStore";

function formatTodayLabel(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function streakHeadline(streak: number): string {
  const safe = Math.max(streak, 1);
  return `${safe}-day streak`;
}

type StreakCelebrationContentProps = {
  streak: number;
  coinAwarded: boolean;
  onDismiss: () => void;
};

function StreakCelebrationContent({
  streak,
  coinAwarded,
  onDismiss,
}: StreakCelebrationContentProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 24,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onDismiss}
        hitSlop={12}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Ionicons name="chevron-back" size={28} color={colors.foreground} />
      </Pressable>

      <Animated.View
        entering={modalContentEntering(reduceMotion)}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            width: 128,
            height: 128,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 128,
              height: 128,
              borderRadius: 64,
              backgroundColor: colors.primarySoft,
            }}
          />
          <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
            <StreakFlame height={72} color={colors.streak} />
          </Animated.View>
        </View>

        <Animated.Text
          entering={
            reduceMotion ? undefined : FadeInDown.delay(100).duration(240).springify().damping(16)
          }
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 44,
            lineHeight: 52,
            color: colors.foreground,
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          {streakHeadline(streak)}
        </Animated.Text>

        <Animated.Text
          entering={reduceMotion ? undefined : FadeIn.delay(180).duration(220)}
          style={{
            marginTop: 8,
            fontFamily: "Poppins-Regular",
            fontSize: 17,
            lineHeight: 24,
            color: colors.foregroundSubtle,
            textAlign: "center",
          }}
        >
          {formatTodayLabel()}
        </Animated.Text>

        {coinAwarded ? (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(260).duration(220)}
            style={{
              marginTop: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FocusCoinIcon size={16} />
            <Text
              style={{
                fontFamily: "Poppins-Medium",
                fontSize: 15,
                lineHeight: 20,
                color: colors.muted,
              }}
            >
              +1 Focus Coin
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>

      <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(320).duration(240)}>
        <PressableScale
          accessibilityRole="button"
          onPress={onDismiss}
          style={{
            width: "100%",
            borderRadius: PILL_RADIUS,
            backgroundColor: colors.primary,
            paddingVertical: 16,
            alignItems: "center",
            borderCurve: "continuous",
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 17,
              lineHeight: 22,
              color: "#FFFFFF",
            }}
          >
            Continue
          </Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

export function StreakCelebrationHost() {
  const reduceMotion = useReduceMotion();
  const visible = useStreakCelebrationStore((state) => state.visible);
  const streak = useStreakCelebrationStore((state) => state.streak);
  const coinAwarded = useStreakCelebrationStore((state) => state.coinAwarded);
  const hide = useStreakCelebrationStore((state) => state.hide);

  useEffect(() => {
    if (!visible) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [visible, streak]);

  if (!visible) return null;

  return (
    <Modal
      visible
      animationType={reduceMotion ? "none" : "fade"}
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={hide}
    >
      <StreakCelebrationContent
        streak={streak}
        coinAwarded={coinAwarded}
        onDismiss={hide}
      />
    </Modal>
  );
}

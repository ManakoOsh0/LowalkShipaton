/**
 * StreakCelebrationModal — full-screen daily-goal celebration when today's schedule is complete.
 * Me+-inspired layout: flame hero, bold streak count, motivational card, week rhythm, and CTA.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FocusCoinIcon } from "@/components/FocusCoinIcon";
import { PressableScale } from "@/components/PressableScale";
import { StreakFlame } from "@/components/StreakFlame";
import { useModalAnimationType, useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_LG, PILL_RADIUS, getCardSurfaceStyle } from "@/lib/cardStyle";
import {
  arrivalMascotEntering,
  HERO_MOTION,
  modalContentEntering,
} from "@/lib/heroMotion";
import {
  buildStreakWeekRhythm,
  getStreakWeekFillPercent,
  type StreakWeekDay,
} from "@/lib/streakWeekRhythm";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useStreakCelebrationStore } from "@/store/useStreakCelebrationStore";

function streakMotivation(streak: number): string {
  const safe = Math.max(streak, 1);
  if (safe === 1) {
    return "A streak is born! Keep it up every day to help it grow.";
  }
  if (safe < 7) {
    return "You're building momentum. Show up tomorrow to keep it alive.";
  }
  if (safe < 30) {
    return "You showed up, and that's what matters most!";
  }
  return "Legendary consistency. Your focus is becoming a habit.";
}

type StreakWeekRhythmProps = {
  days: StreakWeekDay[];
  reduceMotion: boolean;
};

/** Single week progress bar with flame anchored on today — Me+ streak overlay rhythm. */
function StreakWeekRhythm({ days, reduceMotion }: StreakWeekRhythmProps) {
  const colors = useThemeColors();
  const todayIndex = days.findIndex((day) => day.isToday);
  const fillPercent = getStreakWeekFillPercent(days);
  const fillProgress = useSharedValue(reduceMotion ? 1 : 0);
  const flameScale = useSharedValue(reduceMotion ? 1 : 0.5);

  useEffect(() => {
    if (reduceMotion) {
      fillProgress.value = 1;
      flameScale.value = 1;
      return;
    }

    fillProgress.value = withDelay(
      360,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    flameScale.value = withDelay(520, withSpring(1, HERO_MOTION.markerSpring));
  }, [fillProgress, flameScale, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillPercent * fillProgress.value}%`,
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
    opacity: flameScale.value,
  }));

  return (
    <View style={{ gap: 10 }}>
      <View style={{ paddingTop: 16 }}>
        <View
          style={{
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.border,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                height: "100%",
                borderRadius: 5,
                backgroundColor: colors.streak,
              },
              fillStyle,
            ]}
          />
        </View>

        {todayIndex >= 0 ? (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: `${(todayIndex / days.length) * 100}%`,
                width: `${100 / days.length}%`,
                alignItems: "center",
              },
              flameStyle,
            ]}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.foreground,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.cardShadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <StreakFlame height={18} color={colors.streak} />
            </View>
          </Animated.View>
        ) : null}
      </View>

      <View style={{ flexDirection: "row" }}>
        {days.map((day, index) => {
          const labelEntering =
            reduceMotion
              ? undefined
              : FadeIn.delay(380 + index * 35).duration(200);

          return (
            <Animated.View
              key={`${day.dateIso}-label`}
              entering={labelEntering}
              style={{ flex: 1, alignItems: "center" }}
            >
              <Text
                style={{
                  fontFamily: day.isToday ? "Poppins-Bold" : "Poppins-Medium",
                  fontSize: 12,
                  lineHeight: 16,
                  color: day.isToday
                    ? colors.foreground
                    : day.status === "complete"
                      ? colors.streak
                      : colors.muted,
                  opacity: day.status === "future" ? 0.5 : 1,
                }}
              >
                {day.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
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
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const weekDays = useMemo(() => buildStreakWeekRhythm(focusNodes), [focusNodes]);
  const safeStreak = Math.max(streak, 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[`${colors.streak}30`, `${colors.streak}10`, colors.surface]}
        locations={[0, 0.42, 1]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 360,
        }}
      />

      <View
        style={{
          flex: 1,
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
          <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
            <StreakFlame
              height={112}
              color={colors.streak}
              stroke="#FFFFFF"
              strokeWidth={5}
            />
          </Animated.View>

          <Animated.Text
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(100)
                    .duration(280)
                    .springify()
                    .damping(HERO_MOTION.markerSpring.damping)
                    .stiffness(HERO_MOTION.markerSpring.stiffness)
            }
            style={{
              marginTop: 8,
              fontFamily: "Poppins-Bold",
              fontSize: 72,
              lineHeight: 80,
              color: colors.streak,
              fontVariant: ["tabular-nums"],
            }}
          >
            {safeStreak}
          </Animated.Text>

          <Animated.Text
            entering={reduceMotion ? undefined : FadeIn.delay(170).duration(220)}
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 18,
              lineHeight: 24,
              color: colors.streak,
            }}
          >
            day streak
          </Animated.Text>

          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(220)
                    .duration(260)
                    .springify()
                    .damping(18)
                    .stiffness(160)
            }
            style={{
              marginTop: 28,
              width: "100%",
              ...getCardSurfaceStyle(colors, { borderRadius: CARD_RADIUS_LG, shadow: "md" }),
              paddingHorizontal: 18,
              paddingVertical: 18,
              gap: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-Medium",
                fontSize: 16,
                lineHeight: 24,
                color: colors.foreground,
                textAlign: "center",
              }}
            >
              {streakMotivation(safeStreak)}
            </Text>

            <StreakWeekRhythm days={weekDays} reduceMotion={reduceMotion} />

            {coinAwarded ? (
              <Animated.View
                entering={reduceMotion ? undefined : FadeIn.delay(480).duration(200)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <FocusCoinIcon size={16} />
                <Text
                  style={{
                    fontFamily: "Poppins-Medium",
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.muted,
                  }}
                >
                  +1 Focus Coin
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        </Animated.View>

        <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(420).duration(240)}>
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
              Keep it up
            </Text>
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
}

export function StreakCelebrationHost() {
  const modalAnimationType = useModalAnimationType("fade");
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
      animationType={modalAnimationType}
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

/**
 * SessionCompleteScreen — full-screen "Done" celebration after finishing a scheduled session.
 * Layout inspired by habit-app completion screens: badge, title, date, streak, and a single CTA.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArrivalMascotIcon } from "@/components/ArrivalMascotIcon";
import { FocusNodeKindIcon } from "@/components/FocusNodeKindIcon";
import { StreakFlame } from "@/components/StreakFlame";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering } from "@/lib/heroMotion";
import { PILL_RADIUS } from "@/lib/cardStyle";
import { ROUTES } from "@/lib/routes";
import { getKindAccentColor } from "@/lib/focusNodeKindColors";
import {
  useSessionCompleteStore,
  type SessionCompletePayload,
} from "@/store/useSessionCompleteStore";
import { useHeroCelebrationStore } from "@/store/useHeroCelebrationStore";
import { useStreakCelebrationStore } from "@/store/useStreakCelebrationStore";

function formatCompletionDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function streakLabel(streak: number): string {
  return `${streak}-day streak`;
}

type SessionCompleteContentProps = {
  payload: SessionCompletePayload;
  onDismiss: () => void;
};

function SessionCompleteContent({ payload, onDismiss }: SessionCompleteContentProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const accent = getKindAccentColor(payload.kind);

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

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 0 }}>
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
              backgroundColor: `${colors.success}14`,
            }}
          />
          <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
            <ArrivalMascotIcon size={72} color={colors.success} />
          </Animated.View>
        </View>

        <Animated.View
          entering={
            reduceMotion ? undefined : FadeInDown.delay(80).duration(220).springify().damping(16)
          }
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}
        >
          <FocusNodeKindIcon kind={payload.kind} size={16} color={colors.muted} />
          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 15,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            {payload.nodeTitle}
          </Text>
        </Animated.View>

        <Animated.Text
          entering={
            reduceMotion ? undefined : FadeInDown.delay(120).duration(240).springify().damping(16)
          }
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 44,
            lineHeight: 52,
            color: colors.foreground,
            letterSpacing: -0.5,
          }}
        >
          Done
        </Animated.Text>

        <Animated.Text
          entering={reduceMotion ? undefined : FadeIn.delay(180).duration(220)}
          style={{
            marginTop: 8,
            fontFamily: "Poppins-Regular",
            fontSize: 17,
            lineHeight: 24,
            color: colors.foregroundSubtle,
          }}
        >
          {formatCompletionDate()}
        </Animated.Text>

        {payload.streak > 0 ? (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(240).duration(220)}
            style={{
              marginTop: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: PILL_RADIUS,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              borderCurve: "continuous",
            }}
          >
            <StreakFlame height={18} color={colors.streak} />
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 15,
                lineHeight: 20,
                color: colors.foreground,
              }}
            >
              {streakLabel(payload.streak)}
            </Text>
          </Animated.View>
        ) : null}

        {payload.hitDailyGoal ? (
          <Animated.Text
            entering={reduceMotion ? undefined : FadeIn.delay(300).duration(200)}
            style={{
              marginTop: 12,
              fontFamily: "Poppins-Medium",
              fontSize: 14,
              lineHeight: 20,
              color: accent,
            }}
          >
            {payload.coinAwarded ? "Daily goal reached · +1 Focus Coin" : "Daily goal reached"}
          </Animated.Text>
        ) : null}
      </View>

      <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(320).duration(240)}>
        <Pressable
          accessibilityRole="button"
          onPress={onDismiss}
          style={({ pressed }) => ({
            width: "100%",
            borderRadius: PILL_RADIUS,
            backgroundColor: colors.primary,
            paddingVertical: 16,
            alignItems: "center",
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 17,
              lineHeight: 22,
              color: "#FFFFFF",
            }}
          >
            View Today
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function SessionCompleteHost() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const visible = useSessionCompleteStore((state) => state.visible);
  const payload = useSessionCompleteStore((state) => state.payload);
  const hide = useSessionCompleteStore((state) => state.hide);

  useEffect(() => {
    if (!visible) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [visible, payload?.completedAt]);

  const handleDismiss = () => {
    const pending = payload?.pendingStreakCelebration;
    const snapshot = payload;
    hide();
    router.replace(ROUTES.home);
    if (pending) {
      useStreakCelebrationStore.getState().show(pending);
      return;
    }
    if (snapshot) {
      useHeroCelebrationStore.getState().show({
        nodeId: snapshot.nodeId,
        nodeTitle: snapshot.nodeTitle,
        hitDailyGoal: snapshot.hitDailyGoal,
      });
    }
  };

  if (!visible || !payload) return null;

  return (
    <Modal
      visible
      animationType={reduceMotion ? "none" : "fade"}
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <SessionCompleteContent payload={payload} onDismiss={handleDismiss} />
    </Modal>
  );
}

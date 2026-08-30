/**
 * SessionCompleteScreen — full-screen "Done" celebration after finishing a scheduled session.
 * Layout: verified seal, title, streak, and a single CTA.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FocusNodeKindIcon } from "@/components/FocusNodeKindIcon";
import { SessionCompleteBadge } from "@/components/SessionCompleteBadge";
import { StreakFlame } from "@/components/StreakFlame";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering } from "@/lib/heroMotion";
import { PILL_RADIUS } from "@/lib/cardStyle";
import { getKindAccentColor } from "@/lib/focusNodeKindColors";
import { ROUTES } from "@/lib/routes";
import {
  useSessionCompleteStore,
  type SessionCompletePayload,
} from "@/store/useSessionCompleteStore";
import { useHeroCelebrationStore } from "@/store/useHeroCelebrationStore";
import { useStreakCelebrationStore } from "@/store/useStreakCelebrationStore";

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
        <View style={{ height: 112, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Animated.View entering={arrivalMascotEntering(reduceMotion)}>
            <SessionCompleteBadge size={104} color={colors.success} />
          </Animated.View>
        </View>

        <View
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
        </View>

        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 44,
            lineHeight: 52,
            color: colors.foreground,
            letterSpacing: -0.5,
          }}
        >
          Done
        </Text>

        {payload.streak > 0 ? (
          <View
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
          </View>
        ) : null}

        {payload.hitDailyGoal ? (
          <Text
            style={{
              marginTop: 12,
              fontFamily: "Poppins-Medium",
              fontSize: 14,
              lineHeight: 20,
              color: accent,
            }}
          >
            {payload.coinAwarded ? "Daily goal reached · +1 Focus Coin" : "Daily goal reached"}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
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
            Close
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SessionCompleteHost() {
  const router = useRouter();
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
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <SessionCompleteContent payload={payload} onDismiss={handleDismiss} />
    </Modal>
  );
}

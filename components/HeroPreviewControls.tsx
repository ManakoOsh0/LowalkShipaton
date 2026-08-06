/**
 * Dev-only control — cycle Hero Card states from Settings.
 * Uses the same forced-state store as the state preview chips.
 */
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ALL_HERO_STATES, HERO_STATE_LABELS } from "@/lib/heroCard";
import { ROUTES } from "@/lib/routes";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import type { HeroCardState } from "@/types/dashboard";

function stepState(
  current: HeroCardState | null,
  direction: -1 | 1,
): HeroCardState {
  const index =
    current == null
      ? direction === 1
        ? -1
        : 0
      : ALL_HERO_STATES.indexOf(current);
  const nextIndex =
    (index + direction + ALL_HERO_STATES.length) % ALL_HERO_STATES.length;
  return ALL_HERO_STATES[nextIndex];
}

type HeroPreviewControlsProps = {
  /** Renders inline inside the Settings debug card (no outer shell). */
  embedded?: boolean;
};

export function HeroPreviewControls({ embedded = false }: HeroPreviewControlsProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const forcedState = useHeroPreviewStore((state) => state.forcedState);
  const setForcedState = useHeroPreviewStore((state) => state.setForcedState);
  const setForcedVariant = useHeroPreviewStore((state) => state.setForcedVariant);

  if (!__DEV__) return null;

  const label = forcedState ? HERO_STATE_LABELS[forcedState] : "Live";

  const applyPreviewState = (state: HeroCardState | null) => {
    setForcedVariant(null);
    setForcedState(state);
    if (state != null) {
      router.push(ROUTES.home);
    }
  };

  const controls = (
    <>
      {!embedded ? (
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.muted,
          }}
        >
          Hero preview
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous hero state"
          onPress={() => {
            applyPreviewState(stepState(forcedState, -1));
          }}
          hitSlop={8}
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 13,
              color: colors.foreground,
            }}
          >
            Prev
          </Text>
        </Pressable>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "Poppins-SemiBold",
            fontSize: 13,
            lineHeight: 18,
            color: colors.primary,
          }}
          numberOfLines={2}
        >
          {label}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next hero state"
          onPress={() => {
            applyPreviewState(stepState(forcedState, 1));
          }}
          hitSlop={8}
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 13,
              color: colors.foreground,
            }}
          >
            Next
          </Text>
        </Pressable>
      </View>

      {forcedState ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setForcedVariant(null);
            setForcedState(null);
          }}
          hitSlop={8}
          style={{ alignSelf: "center", paddingVertical: 2 }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 13,
              color: colors.primary,
            }}
          >
            Back to live
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  if (embedded) {
    return <View style={{ gap: 8 }}>{controls}</View>;
  }

  return (
    <View
      style={{
        marginTop: 10,
        marginHorizontal: 16,
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
      }}
    >
      {controls}
    </View>
  );
}

/**
 * Dev-only control — cycle Hero Card scenarios from Settings.
 */
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ROUTES } from "@/lib/routes";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  HERO_PREVIEW_SCENARIOS,
  HERO_PREVIEW_SCENARIO_LABELS,
  type HeroPreviewScenario,
  useHeroPreviewStore,
} from "@/store/useHeroPreviewStore";

function stepScenario(
  current: HeroPreviewScenario | null,
  direction: -1 | 1,
): HeroPreviewScenario {
  const index =
    current == null
      ? direction === 1
        ? -1
        : 0
      : HERO_PREVIEW_SCENARIOS.indexOf(current);
  const nextIndex =
    (index + direction + HERO_PREVIEW_SCENARIOS.length) %
    HERO_PREVIEW_SCENARIOS.length;
  return HERO_PREVIEW_SCENARIOS[nextIndex];
}

type HeroPreviewControlsProps = {
  /** Renders inline inside the Settings debug card (no outer shell). */
  embedded?: boolean;
};

export function HeroPreviewControls({ embedded = false }: HeroPreviewControlsProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const forcedScenario = useHeroPreviewStore((state) => state.forcedScenario);
  const setForcedScenario = useHeroPreviewStore((state) => state.setForcedScenario);

  if (!__DEV__) return null;

  const label = forcedScenario ? HERO_PREVIEW_SCENARIO_LABELS[forcedScenario] : "Live";

  const applyPreviewScenario = (scenario: HeroPreviewScenario | null) => {
    setForcedScenario(scenario);
    if (scenario != null) {
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
          accessibilityLabel="Previous hero scenario"
          onPress={() => {
            applyPreviewScenario(stepScenario(forcedScenario, -1));
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
          accessibilityLabel="Next hero scenario"
          onPress={() => {
            applyPreviewScenario(stepScenario(forcedScenario, 1));
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

      {forcedScenario ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setForcedScenario(null)}
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

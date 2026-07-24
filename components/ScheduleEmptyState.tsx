/**
 * Empty schedule placeholder — flat copy when today has no planned Focus Nodes.
 */
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { HeroSunriseIcon } from "@/components/HeroSunriseIcon";
import { NeuCard } from "@/components/NeuCard";
import { ROUTES } from "@/lib/routes";
import { CARD_RADIUS_XL } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";

export function ScheduleEmptyState() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <NeuCard
      borderRadius={CARD_RADIUS_XL}
      contentStyle={{
        paddingHorizontal: 20,
        paddingVertical: 28,
        alignItems: "center",
        gap: 8,
      }}
    >
      <HeroSunriseIcon size={48} />

      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 15,
          lineHeight: 21,
          textAlign: "center",
          color: colors.foreground,
        }}
      >
        Nothing planned for today
      </Text>
      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 13,
          lineHeight: 18,
          textAlign: "center",
          color: colors.muted,
        }}
      >
        Add a Focus Node to build your schedule.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add session"
        onPress={() => router.push(ROUTES.focusNodeNew)}
        style={({ pressed }) => ({
          marginTop: 6,
          borderRadius: 12,
          borderCurve: "continuous",
              backgroundColor: colors.skyDeep,
          paddingHorizontal: 20,
          paddingVertical: 10,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 14,
            lineHeight: 20,
            color: "#FFFFFF",
          }}
        >
          Add session
        </Text>
      </Pressable>
    </NeuCard>
  );
}

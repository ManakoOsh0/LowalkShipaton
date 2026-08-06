/**
 * FocusRewardsCard — Settings summary of saved Focus Coins and how to earn them.
 */
import { Text, View } from "react-native";

import { FocusCoinIcon } from "@/components/FocusCoinIcon";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useUserStore } from "@/store/useUserStore";

export function FocusRewardsCard() {
  const colors = useThemeColors();
  const coins = useUserStore((state) => state.coins);

  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Focus Rewards
      </Text>

      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <FocusCoinIcon size={28} />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 28,
                lineHeight: 34,
                color: colors.foreground,
                fontVariant: ["tabular-nums"],
              }}
            >
              {coins}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                lineHeight: 18,
                color: colors.foreground,
              }}
            >
              Focus Coins
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Complete every session on today&apos;s schedule to earn +1 coin.
        </Text>
      </View>
    </View>
  );
}

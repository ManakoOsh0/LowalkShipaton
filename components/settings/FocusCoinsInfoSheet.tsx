/**
 * FocusCoinsInfoSheet — explains how Focus Coins are earned and spent.
 */
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { FocusCoinIcon } from "@/components/FocusCoinIcon";
import { useThemeColors } from "@/hooks/useThemeColors";

type FocusCoinsInfoSheetProps = {
  visible: boolean;
  coins: number;
  onClose: () => void;
};

export function FocusCoinsInfoSheet({ visible, coins, onClose }: FocusCoinsInfoSheetProps) {
  const colors = useThemeColors();
  const balanceLabel = `${coins} Focus Coin${coins === 1 ? "" : "s"} saved`;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 12, paddingBottom: 8 }}>
        <View style={{ alignItems: "center", gap: 10, paddingBottom: 4 }}>
          <FocusCoinIcon size={44} />

          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 18,
              lineHeight: 24,
              color: colors.foreground,
            }}
          >
            Focus Coins
          </Text>

          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 15,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            {balanceLabel}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 14,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          Complete every session on today&apos;s schedule to earn +1 Focus Coin.
        </Text>

        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 14,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          Tap ··· on a session to skip today for 1 coin.
        </Text>
      </View>
    </BottomSheet>
  );
}

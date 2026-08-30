/**
 * AboutSheet — version and local-first summary for Settings.
 */
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getAboutVersionLine } from "@/lib/appVersion";

type AboutSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function AboutSheet({ visible, onClose }: AboutSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 12, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 18,
            lineHeight: 24,
            color: colors.foreground,
          }}
        >
          About Lowalk
        </Text>

        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 14,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          Lowalk helps you show up where you planned to be and stay focused while you are there.
          Your schedule, anchors, and progress stay on this device.
        </Text>

        <Text
          style={{
            fontFamily: "Poppins-Medium",
            fontSize: 14,
            lineHeight: 20,
            color: colors.foreground,
          }}
        >
          {getAboutVersionLine()}
        </Text>
      </View>
    </BottomSheet>
  );
}

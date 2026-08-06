/**
 * StatsShareSheet — overflow share actions kept off the main activity scroll.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { useThemeColors } from "@/hooks/useThemeColors";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";

type StatsShareSheetProps = {
  visible: boolean;
  onClose: () => void;
  onShareWeek: () => void;
  onShareConsistency: () => void;
};

function ShareRow({
  icon,
  label,
  onPress,
  showDivider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          gap: 12,
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: colors.border,
        }}
      >
        <Ionicons name={icon} size={20} color={colors.foreground} />
        <Text
          style={{
            flex: 1,
            fontFamily: FONT_FAMILY.semibold,
            fontSize: 16,
            lineHeight: 22,
            color: colors.foreground,
          }}
        >
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export function StatsShareSheet({
  visible,
  onClose,
  onShareWeek,
  onShareConsistency,
}: StatsShareSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 8, paddingBottom: 8 }}>
        <Text
          style={textStyle("h3", colors.foreground, {
            fontFamily: FONT_FAMILY.bold,
            marginBottom: 4,
          })}
        >
          Share
        </Text>
        <ShareRow
          icon="share-outline"
          label="Share this week"
          showDivider
          onPress={() => {
            onClose();
            onShareWeek();
          }}
        />
        <ShareRow
          icon="grid-outline"
          label="Share consistency map"
          onPress={() => {
            onClose();
            onShareConsistency();
          }}
        />
      </View>
    </BottomSheet>
  );
}

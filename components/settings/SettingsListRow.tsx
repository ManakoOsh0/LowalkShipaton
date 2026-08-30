/**
 * SettingsListRow — icon + label row with optional trailing value and chevron.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type SettingsListRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showDivider?: boolean;
  accessibilityLabel?: string;
};

export function SettingsListRow({
  icon,
  label,
  value,
  onPress,
  showDivider = false,
  accessibilityLabel,
}: SettingsListRowProps) {
  const colors = useThemeColors();
  const interactive = Boolean(onPress);

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: colors.border,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardStroke,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.foreground} />
      </View>

      <Text
        style={{
          flex: 1,
          fontFamily: "Poppins-SemiBold",
          fontSize: 16,
          lineHeight: 22,
          color: colors.foreground,
        }}
      >
        {label}
      </Text>

      {value ? (
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 15,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          {value}
        </Text>
      ) : null}

      {interactive ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </View>
  );

  if (!onPress) {
    return (
      <View accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? label}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
    >
      {content}
    </Pressable>
  );
}

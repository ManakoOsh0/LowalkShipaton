/**
 * FormRow — tappable label + value row inside a FormSectionCard.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type FormRowProps = {
  label?: string;
  value: string;
  onPress?: () => void;
  showDivider?: boolean;
  showChevron?: boolean;
  accessibilityLabel?: string;
};

export function FormRow({
  label,
  value,
  onPress,
  showDivider = false,
  showChevron = Boolean(onPress),
  accessibilityLabel,
}: FormRowProps) {
  const colors = useThemeColors();

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: colors.border,
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: label ? 4 : 0 }}>
        {label ? (
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            {label}
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 16,
            lineHeight: 22,
            color: colors.foreground,
          }}
        >
          {value}
        </Text>
      </View>
      {showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? value}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
    >
      {content}
    </Pressable>
  );
}
